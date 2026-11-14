import { getFFmpeg } from "@/lib/ffmpeg-helper";

export type OutFormat = "mp3" | "wav";

let ctx: AudioContext | null = null;
export function audioCtx() {
  if (!ctx) ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  return ctx;
}

export async function decodeFile(file: Blob): Promise<AudioBuffer> {
  const buf = await file.arrayBuffer();
  try {
    return await audioCtx().decodeAudioData(buf.slice(0));
  } catch {
    const wav = await ffmpegRun([{ name: "in", data: file }], ["-i", "in", "-ac", "2", "-ar", "44100"], "out.wav");
    return await audioCtx().decodeAudioData(await wav.arrayBuffer());
  }
}

export function encodeWav(buffer: AudioBuffer, sampleRate = buffer.sampleRate): Blob {
  const chs = buffer.numberOfChannels;
  const len = buffer.length;
  const bytes = 44 + len * chs * 2;
  const view = new DataView(new ArrayBuffer(bytes));
  const w = (o: number, s: string) => [...s].forEach((c, i) => view.setUint8(o + i, c.charCodeAt(0)));
  w(0, "RIFF");
  view.setUint32(4, bytes - 8, true);
  w(8, "WAVE");
  w(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, chs, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * chs * 2, true);
  view.setUint16(32, chs * 2, true);
  view.setUint16(34, 16, true);
  w(36, "data");
  view.setUint32(40, len * chs * 2, true);
  const data = Array.from({ length: chs }, (_, c) => buffer.getChannelData(c));
  let o = 44;
  for (let i = 0; i < len; i++) {
    for (let c = 0; c < chs; c++) {
      const s = Math.max(-1, Math.min(1, data[c][i]));
      view.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      o += 2;
    }
  }
  return new Blob([view.buffer], { type: "audio/wav" });
}

let queue: Promise<unknown> = Promise.resolve();

/** Run ffmpeg.wasm with the given input files. Calls are serialised. */
export function ffmpegRun(inputs: { name: string; data: Blob }[], args: string[], outName: string): Promise<Blob> {
  const job = queue.then(async () => {
    const ff = await getFFmpeg();
    for (const f of inputs) await ff.writeFile(f.name, new Uint8Array(await f.data.arrayBuffer()));
    const code = (await ff.exec([...args, "-y", outName])) as number;
    let out: Uint8Array | null = null;
    try {
      out = (await ff.readFile(outName)) as Uint8Array;
    } catch {
      out = null;
    }
    for (const f of inputs) await ff.deleteFile(f.name).catch(() => undefined);
    await ff.deleteFile(outName).catch(() => undefined);
    if (!out || !out.length || (typeof code === "number" && code !== 0 && !out.length)) {
      throw new Error("Processing failed. Try another file or format.");
    }
    return new Blob([out.slice().buffer as ArrayBuffer], { type: mimeOf(outName) });
  });
  queue = job.catch(() => undefined);
  return job;
}

export function mimeOf(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  return ext === "wav" ? "audio/wav" : ext === "mp3" ? "audio/mpeg" : ext === "zip" ? "application/zip" : "application/octet-stream";
}

export function codecArgs(fmt: OutFormat) {
  return fmt === "mp3" ? ["-c:a", "libmp3lame", "-b:a", "192k"] : ["-c:a", "pcm_s16le"];
}

/** Apply an ffmpeg audio filter chain to a file. */
export function processFile(file: Blob, filter: string, fmt: OutFormat = "mp3", extra: string[] = []): Promise<Blob> {
  return ffmpegRun([{ name: "input", data: file }], ["-i", "input", "-vn", ...(filter ? ["-af", filter] : []), ...extra, ...codecArgs(fmt)], `output.${fmt}`);
}

/** Convert an AudioBuffer (rendered in the browser) to the requested format. */
export async function bufferToFormat(buf: AudioBuffer, fmt: OutFormat): Promise<Blob> {
  const wav = encodeWav(buf);
  if (fmt === "wav") return wav;
  return ffmpegRun([{ name: "in.wav", data: wav }], ["-i", "in.wav", ...codecArgs("mp3")], "out.mp3");
}

export function sliceBuffer(buf: AudioBuffer, start: number, end: number): AudioBuffer {
  const sr = buf.sampleRate;
  const s = Math.max(0, Math.floor(start * sr));
  const e = Math.min(buf.length, Math.floor(end * sr));
  const out = audioCtx().createBuffer(buf.numberOfChannels, Math.max(1, e - s), sr);
  for (let c = 0; c < buf.numberOfChannels; c++) out.copyToChannel(buf.getChannelData(c).subarray(s, e), c);
  return out;
}

/** Repeat a buffer `times` times (or until `targetSec`) with an equal-power crossfade. */
export function loopBuffer(buf: AudioBuffer, opts: { times?: number; targetSec?: number; crossfade?: number }): AudioBuffer {
  const sr = buf.sampleRate;
  const fade = Math.min(Math.floor((opts.crossfade ?? 0) * sr), Math.floor(buf.length / 3));
  const step = buf.length - fade;
  const total = opts.targetSec ? Math.floor(opts.targetSec * sr) : step * (opts.times ?? 2) + fade;
  const out = audioCtx().createBuffer(buf.numberOfChannels, Math.max(1, total), sr);
  for (let c = 0; c < buf.numberOfChannels; c++) {
    const src = buf.getChannelData(c);
    const dst = out.getChannelData(c);
    for (let pos = 0; pos < total; pos += step) {
      for (let i = 0; i < buf.length && pos + i < total; i++) {
        let g = 1;
        if (fade && pos > 0 && i < fade) g = Math.sin((i / fade) * Math.PI / 2);
        if (fade && i >= buf.length - fade && pos + step < total) g *= Math.cos(((i - (buf.length - fade)) / fade) * Math.PI / 2);
        dst[pos + i] += src[i] * g;
      }
    }
    const fo = Math.min(Math.floor(0.05 * sr), total);
    if (opts.targetSec) for (let i = 0; i < fo; i++) dst[total - 1 - i] *= i / fo;
  }
  return out;
}

export function peaks(buf: AudioBuffer, n = 800): number[] {
  const data = buf.getChannelData(0);
  const step = Math.max(1, Math.floor(data.length / n));
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    let m = 0;
    for (let j = i * step; j < Math.min(data.length, (i + 1) * step); j++) m = Math.max(m, Math.abs(data[j]));
    out.push(m);
  }
  return out;
}

/** Tempo estimate: onset envelope + autocorrelation, folded into 70-180 BPM. */
export function detectBPM(buf: AudioBuffer): { bpm: number; confidence: number; candidates: number[] } {
  const sr = buf.sampleRate;
  const maxSec = Math.min(buf.duration, 90);
  const offset = buf.duration > 120 ? Math.floor(30 * sr) : 0;
  const len = Math.floor(maxSec * sr);
  const mono = new Float32Array(len);
  for (let c = 0; c < buf.numberOfChannels; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < len && offset + i < d.length; i++) mono[i] += d[offset + i] / buf.numberOfChannels;
  }
  const hop = 512;
  const frames = Math.floor(len / hop);
  const env = new Float32Array(frames);
  let prev = 0;
  for (let f = 0; f < frames; f++) {
    let e = 0;
    for (let i = 0; i < hop; i++) {
      const s = mono[f * hop + i];
      e += s * s;
    }
    e = Math.log(1 + 1000 * Math.sqrt(e / hop));
    env[f] = Math.max(0, e - prev);
    prev = e;
  }
  const fps = sr / hop;
  const scores: { bpm: number; s: number }[] = [];
  for (let bpm = 60; bpm <= 200; bpm += 0.5) {
    const lag = (60 / bpm) * fps;
    let s = 0;
    const at = (x: number) => {
      const i = Math.floor(x);
      const fr = x - i;
      return env[i] * (1 - fr) + (env[i + 1] ?? 0) * fr;
    };
    for (let f = 0; f + lag * 4 + 1 < frames; f++) {
      const a = env[f];
      s += a * (at(f + lag) + 0.5 * at(f + lag * 2) + 0.25 * at(f + lag * 4));
    }
    scores.push({ bpm, s });
  }
  scores.sort((a, b) => b.s - a.s);
  let best = scores[0]?.bpm ?? 120;
  while (best < 70) best *= 2;
  while (best > 180) best /= 2;
  const mean = scores.reduce((t, x) => t + x.s, 0) / Math.max(1, scores.length);
  const confidence = Math.min(1, Math.max(0, (scores[0].s - mean) / (scores[0].s || 1)));
  const candidates = [...new Set(scores.slice(0, 12).map((x) => Math.round(x.bpm)))].slice(0, 4);
  return { bpm: Math.round(best * 10) / 10, confidence, candidates };
}

export function atempoChain(ratio: number) {
  const parts: string[] = [];
  let r = ratio;
  while (r > 2) {
    parts.push("atempo=2");
    r /= 2;
  }
  while (r < 0.5) {
    parts.push("atempo=0.5");
    r /= 0.5;
  }
  parts.push(`atempo=${r.toFixed(5)}`);
  return parts.join(",");
}

export function pitchFilter(semitones: number, sr = 44100) {
  const f = Math.pow(2, semitones / 12);
  return `aresample=${sr},asetrate=${Math.round(sr * f)},aresample=${sr},${atempoChain(1 / f)}`;
}

/** Write one input once and produce several outputs (e.g. split parts). */
export function ffmpegMulti(input: Blob, jobs: { args: string[]; out: string }[], onProgress?: (done: number) => void): Promise<Blob[]> {
  const job = queue.then(async () => {
    const ff = await getFFmpeg();
    await ff.writeFile("input", new Uint8Array(await input.arrayBuffer()));
    const outs: Blob[] = [];
    try {
      for (const j of jobs) {
        await ff.exec([...j.args, "-y", j.out]);
        const data = (await ff.readFile(j.out)) as Uint8Array;
        await ff.deleteFile(j.out).catch(() => undefined);
        outs.push(new Blob([data.slice().buffer as ArrayBuffer], { type: mimeOf(j.out) }));
        onProgress?.(outs.length);
      }
    } finally {
      await ff.deleteFile("input").catch(() => undefined);
    }
    return outs;
  });
  queue = job.catch(() => undefined);
  return job;
}

export function getDuration(file: Blob): Promise<number> {
  return new Promise((resolve, reject) => {
    const a = document.createElement("audio");
    const url = URL.createObjectURL(file);
    a.preload = "metadata";
    a.onloadedmetadata = () => {
      const d = a.duration;
      URL.revokeObjectURL(url);
      if (Number.isFinite(d) && d > 0) resolve(d);
      else decodeFile(file).then((b) => resolve(b.duration), reject);
    };
    a.onerror = () => {
      URL.revokeObjectURL(url);
      decodeFile(file).then((b) => resolve(b.duration), reject);
    };
    a.src = url;
  });
}
