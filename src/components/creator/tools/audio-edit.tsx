"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import JSZip from "jszip";
import {
  atempoChain, audioCtx, bufferToFormat, codecArgs, decodeFile, detectBPM, ffmpegMulti, ffmpegRun, getDuration,
  loopBuffer, peaks as getPeaks, pitchFilter, processFile, sliceBuffer, type OutFormat,
} from "@/lib/creator/audio";
import { fmtDuration } from "@/lib/creator/api";
import { downloadBlob, safeName } from "@/lib/creator/export";
import { Card, ErrorBox, Field, Range, Select, Spinner, Toggle } from "../ui";
import { AudioPicker, AudioResult, FileBar, FormatPicker, outName, Player, Waveform } from "../AudioUI";

function useJob() {
  const [result, setResult] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async (fn: () => Promise<Blob>) => {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      setResult(await fn());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Processing failed.");
    } finally {
      setBusy(false);
    }
  };
  return { result, setResult, busy, error, run };
}

/** Single-file tool shell: pick → options → process → result. */
function SimpleTool({ children, action, onProcess, suffix, showFormat = true, onFile }: {
  children?: (file: File) => ReactNode;
  action: string;
  onProcess: (file: File, fmt: OutFormat) => Promise<Blob>;
  suffix: string;
  showFormat?: boolean;
  onFile?: (f: File) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [fmt, setFmt] = useState<OutFormat>("mp3");
  const job = useJob();
  return (
    <Card className="space-y-5">
      {!file ? (
        <AudioPicker onFile={(f) => { setFile(f[0]); job.setResult(null); onFile?.(f[0]); }} />
      ) : (
        <>
          <FileBar file={file} onReset={() => { setFile(null); job.setResult(null); }} />
          <Player src={file} />
          {children?.(file)}
          <div className="flex flex-wrap items-center justify-between gap-4">
            {showFormat ? <FormatPicker value={fmt} onChange={setFmt} /> : <span />}
            <button type="button" disabled={job.busy} onClick={() => job.run(() => onProcess(file, fmt))} className="btn-primary disabled:opacity-50">
              {job.busy ? "Processing…" : action}
            </button>
          </div>
          {job.busy && <Spinner label="Processing in your browser… first run loads the audio engine (~30 MB)" />}
          <ErrorBox error={job.error} />
          <AudioResult blob={job.result} name={outName(file, suffix, job.result?.type === "audio/wav" ? "wav" : fmt)} />
        </>
      )}
    </Card>
  );
}

export function SpeedChanger() {
  const [speed, setSpeed] = useState(1.25);
  const [keepPitch, setKeepPitch] = useState(true);
  return (
    <SimpleTool
      action="Change speed"
      suffix={`${speed}x`}
      onProcess={(f, fmt) => processFile(f, keepPitch ? atempoChain(speed) : `aresample=44100,asetrate=${Math.round(44100 * speed)},aresample=44100`, fmt)}
    >
      {() => (
        <div className="space-y-3">
          <Range label="Speed" value={speed} onChange={setSpeed} min={0.25} max={4} step={0.05} suffix="x" />
          <div className="flex flex-wrap gap-2">{[0.5, 0.75, 1.25, 1.5, 2].map((v) => <button key={v} type="button" onClick={() => setSpeed(v)} className="px-3 py-1 rounded-lg border text-sm font-semibold">{v}x</button>)}</div>
          <Toggle label="Keep original pitch" checked={keepPitch} onChange={setKeepPitch} />
        </div>
      )}
    </SimpleTool>
  );
}

export function PitchChanger() {
  const [semi, setSemi] = useState(2);
  return (
    <SimpleTool action="Change pitch" suffix={`pitch${semi >= 0 ? "+" : ""}${semi}`} onProcess={(f, fmt) => processFile(f, pitchFilter(semi), fmt)}>
      {() => (
        <div className="space-y-2">
          <Range label="Semitones" value={semi} onChange={setSemi} min={-12} max={12} step={0.5} />
          <p className="text-xs text-gray-500">+12 = one octave higher, −12 = one octave lower. Speed stays the same.</p>
        </div>
      )}
    </SimpleTool>
  );
}

export function BpmChanger() {
  const [orig, setOrig] = useState(0);
  const [target, setTarget] = useState(120);
  const [detecting, setDetecting] = useState(false);
  return (
    <SimpleTool
      action="Change BPM"
      suffix={`${target}bpm`}
      onFile={async (f) => {
        setDetecting(true);
        try {
          const b = detectBPM(await decodeFile(f)).bpm;
          setOrig(Math.round(b));
          setTarget(Math.round(b));
        } finally {
          setDetecting(false);
        }
      }}
      onProcess={async (f, fmt) => {
        if (!orig) throw new Error("Enter the original BPM.");
        return processFile(f, atempoChain(target / orig), fmt);
      }}
    >
      {() => (
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label={detecting ? "Original BPM (detecting…)" : "Original BPM (auto-detected, edit if wrong)"}>
            <input type="number" min={20} max={300} value={orig || ""} onChange={(e) => setOrig(Number(e.target.value))} className="input-field" />
          </Field>
          <Field label="Target BPM">
            <input type="number" min={20} max={300} value={target} onChange={(e) => setTarget(Number(e.target.value))} className="input-field" />
          </Field>
          {orig > 0 && <p className="text-sm text-gray-500 sm:col-span-2">Tempo change: {((target / orig) * 100).toFixed(1)}% · pitch is preserved</p>}
        </div>
      )}
    </SimpleTool>
  );
}

const VOICES: [string, string, string][] = [
  ["chipmunk", "🐿️ Chipmunk", pitchFilter(7)],
  ["helium", "🎈 Helium", pitchFilter(11)],
  ["deep", "🧔 Deep voice", pitchFilter(-5)],
  ["monster", "👹 Monster", `${pitchFilter(-9)},aecho=0.8:0.7:40:0.35`],
  ["robot", "🤖 Robot", "afftfilt=real='hypot(re,im)':imag='0':win_size=512:overlap=0.75,volume=0.8"],
  ["alien", "👽 Alien", `${pitchFilter(4)},vibrato=f=9:d=0.7`],
  ["radio", "📻 Old radio", "highpass=f=500,lowpass=f=3000,acrusher=bits=10:mix=0.3,volume=1.4"],
  ["telephone", "☎️ Telephone", "highpass=f=300,lowpass=f=3400,aresample=8000,aresample=44100,volume=1.3"],
  ["echo", "🏔️ Echo", "aecho=0.8:0.9:450|900:0.35|0.2"],
  ["cave", "🕳️ Cave / hall", "aecho=0.8:0.88:60|120|210:0.4|0.3|0.2"],
  ["underwater", "🌊 Underwater", "lowpass=f=450,vibrato=f=1.5:d=0.4,volume=1.5"],
  ["custom", "🎛️ Custom", ""],
];

export function VoiceChanger() {
  const [preset, setPreset] = useState("chipmunk");
  const [cp, setCp] = useState(0);
  const [echo, setEcho] = useState(false);
  const [trem, setTrem] = useState(false);
  const filter = () => {
    if (preset !== "custom") return VOICES.find((v) => v[0] === preset)![2];
    const parts = [cp ? pitchFilter(cp) : "", echo ? "aecho=0.8:0.85:300:0.3" : "", trem ? "tremolo=f=6:d=0.6" : ""].filter(Boolean);
    return parts.join(",") || "anull";
  };
  return (
    <SimpleTool action="Apply voice" suffix={preset} onProcess={(f, fmt) => processFile(f, filter(), fmt)}>
      {() => (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {VOICES.map(([k, l]) => (
              <button key={k} type="button" onClick={() => setPreset(k)} className={`rounded-xl border-2 px-3 py-2 text-sm font-bold ${preset === k ? "border-red-500 bg-red-50" : "border-gray-200"}`}>{l}</button>
            ))}
          </div>
          {preset === "custom" && (
            <div className="space-y-3">
              <Range label="Pitch (semitones)" value={cp} onChange={setCp} min={-12} max={12} step={0.5} />
              <div className="flex gap-5"><Toggle label="Echo" checked={echo} onChange={setEcho} /><Toggle label="Tremolo" checked={trem} onChange={setTrem} /></div>
            </div>
          )}
        </div>
      )}
    </SimpleTool>
  );
}

export function SilenceRemover() {
  const [thr, setThr] = useState(-45);
  const [min, setMin] = useState(0.5);
  const [keep, setKeep] = useState(0.15);
  const [before, setBefore] = useState<number | null>(null);
  return (
    <SimpleTool
      action="Remove silence"
      suffix="no-silence"
      onFile={async (f) => setBefore(await getDuration(f).catch(() => null))}
      onProcess={(f, fmt) => processFile(f, `silenceremove=start_periods=1:start_threshold=${thr}dB:start_silence=${keep}:stop_periods=-1:stop_duration=${min}:stop_threshold=${thr}dB:stop_silence=${keep}`, fmt)}
    >
      {() => (
        <div className="space-y-3">
          {before && <p className="text-sm text-gray-500">Original length: {fmtDuration(before)}</p>}
          <Range label="Silence threshold" value={thr} onChange={setThr} min={-70} max={-20} suffix=" dB" />
          <Range label="Remove pauses longer than" value={min} onChange={setMin} min={0.1} max={3} step={0.1} suffix=" s" />
          <Range label="Keep a short gap of" value={keep} onChange={setKeep} min={0} max={1} step={0.05} suffix=" s" />
        </div>
      )}
    </SimpleTool>
  );
}

export function ReverseAudio() {
  return <SimpleTool action="Reverse audio" suffix="reversed" onProcess={(f, fmt) => processFile(f, "areverse", fmt)} />;
}

const ONHOLD: [string, string, string[], string][] = [
  ["pcm8", "8 kHz · 16-bit · mono WAV (most PBX / Asterisk / FreePBX)", ["-ar", "8000", "-ac", "1", "-c:a", "pcm_s16le"], "wav"],
  ["ulaw", "8 kHz · μ-law G.711u WAV (US / Cisco / Avaya)", ["-ar", "8000", "-ac", "1", "-c:a", "pcm_mulaw"], "wav"],
  ["alaw", "8 kHz · A-law G.711a WAV (Europe / India)", ["-ar", "8000", "-ac", "1", "-c:a", "pcm_alaw"], "wav"],
  ["pcm16", "16 kHz · 16-bit · mono WAV (HD voice / Teams / 3CX)", ["-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le"], "wav"],
  ["mp3", "8 kHz · mono MP3 32 kbps (cloud phone systems)", ["-ar", "8000", "-ac", "1", "-c:a", "libmp3lame", "-b:a", "32k"], "mp3"],
];

export function OnHoldConverter() {
  const [preset, setPreset] = useState("pcm8");
  const [norm, setNorm] = useState(true);
  const p = ONHOLD.find((x) => x[0] === preset)!;
  return (
    <SimpleTool
      action="Convert for phone"
      suffix={`onhold-${preset}`}
      showFormat={false}
      onProcess={(f) => ffmpegRun([{ name: "input", data: f }], ["-i", "input", "-vn", "-af", `highpass=f=200,lowpass=f=3400${norm ? ",loudnorm=I=-18:TP=-3:LRA=11" : ""}`, ...p[2]], `out.${p[3]}`)}
    >
      {() => (
        <div className="space-y-3">
          <Field label="Phone system format"><Select value={preset} onChange={setPreset} options={ONHOLD.map(([k, l]) => [k, l])} /></Field>
          <Toggle label="Normalize loudness (recommended)" checked={norm} onChange={setNorm} />
        </div>
      )}
    </SimpleTool>
  );
}

export function EightD() {
  const [hz, setHz] = useState(0.1);
  const [reverb, setReverb] = useState(true);
  return (
    <SimpleTool
      action="Make 8D audio"
      suffix="8d"
      onProcess={(f, fmt) => processFile(f, `aformat=channel_layouts=stereo,apulsator=hz=${hz}:amount=0.85:width=1${reverb ? ",aecho=0.8:0.6:40|70:0.25|0.15" : ""}`, fmt)}
    >
      {() => (
        <div className="space-y-3">
          <Range label="Rotation speed" value={hz} onChange={setHz} min={0.04} max={0.5} step={0.01} suffix=" Hz" />
          <p className="text-xs text-gray-500">{(1 / hz).toFixed(1)} seconds per full circle. Use headphones.</p>
          <Toggle label="Add room reverb" checked={reverb} onChange={setReverb} />
        </div>
      )}
    </SimpleTool>
  );
}

function useDecoded(onLoad?: (b: AudioBuffer) => void) {
  const [file, setFileState] = useState<File | null>(null);
  const [buf, setBuf] = useState<AudioBuffer | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const setFile = (f: File | null) => {
    setFileState(f);
    setBuf(null);
    setErr(null);
    if (!f) return;
    decodeFile(f).then(
      (b) => {
        setBuf(b);
        onLoad?.(b);
      },
      () => setErr("Could not read this audio file.")
    );
  };
  return { file, setFile, buf, err };
}

function useRegionPlayer() {
  const src = useRef<AudioBufferSourceNode | null>(null);
  const [playing, setPlaying] = useState(false);
  const stop = () => {
    src.current?.stop();
    src.current = null;
    setPlaying(false);
  };
  const play = (buf: AudioBuffer, start: number, end: number, loop = false) => {
    stop();
    const c = audioCtx();
    c.resume();
    const s = c.createBufferSource();
    s.buffer = buf;
    s.loop = loop;
    s.loopStart = start;
    s.loopEnd = end;
    s.connect(c.destination);
    s.onended = () => setPlaying(false);
    s.start(0, start, loop ? undefined : end - start);
    src.current = s;
    setPlaying(true);
  };
  useEffect(() => () => src.current?.stop(), []);
  return { play, stop, playing };
}

function TimeInputs({ start, end, max, onChange }: { start: number; end: number; max: number; onChange: (s: number, e: number) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Field label="Start (seconds)"><input type="number" step={0.01} min={0} max={end} value={start.toFixed(2)} onChange={(e) => onChange(Math.max(0, Math.min(Number(e.target.value), end - 0.05)), end)} className="input-field" /></Field>
      <Field label="End (seconds)"><input type="number" step={0.01} min={start} max={max} value={end.toFixed(2)} onChange={(e) => onChange(start, Math.min(max, Math.max(Number(e.target.value), start + 0.05)))} className="input-field" /></Field>
    </div>
  );
}

export function AudioCutter() {
  const [r, setR] = useState<[number, number]>([0, 0]);
  const [pk, setPk] = useState<number[]>([]);
  const { file, setFile, buf, err } = useDecoded((b) => {
    setPk(getPeaks(b));
    setR([0, b.duration]);
  });
  const [fadeIn, setFadeIn] = useState(0);
  const [fadeOut, setFadeOut] = useState(0);
  const [mode, setMode] = useState("keep");
  const [fmt, setFmt] = useState<OutFormat>("mp3");
  const job = useJob();
  const pl = useRegionPlayer();
  const cut = async () => {
    if (!buf || !file) throw new Error("No audio");
    const [s, e] = r;
    if (mode === "keep") {
      const d = e - s;
      const af = [fadeIn ? `afade=t=in:st=0:d=${fadeIn}` : "", fadeOut ? `afade=t=out:st=${Math.max(0, d - fadeOut)}:d=${fadeOut}` : ""].filter(Boolean).join(",");
      return ffmpegRun([{ name: "input", data: file }], ["-ss", s.toFixed(3), "-t", d.toFixed(3), "-i", "input", "-vn", ...(af ? ["-af", af] : []), ...codecArgs(fmt)], `out.${fmt}`);
    }
    const a = sliceBuffer(buf, 0, s), b = sliceBuffer(buf, e, buf.duration);
    const out = audioCtx().createBuffer(buf.numberOfChannels, a.length + b.length, buf.sampleRate);
    for (let c = 0; c < buf.numberOfChannels; c++) {
      out.getChannelData(c).set(a.getChannelData(c), 0);
      out.getChannelData(c).set(b.getChannelData(c), a.length);
    }
    return bufferToFormat(out, fmt);
  };
  return (
    <Card className="space-y-5">
      {!file ? <AudioPicker onFile={(f) => { setFile(f[0]); job.setResult(null); }} /> : <FileBar file={file} onReset={() => { pl.stop(); setFile(null); }}>{buf && ` · ${fmtDuration(buf.duration)}`}</FileBar>}
      <ErrorBox error={err} />
      {file && !buf && !err && <Spinner label="Reading audio…" />}
      {buf && (
        <>
          <Waveform peaks={pk} duration={buf.duration} start={r[0]} end={r[1]} onChange={(s, e) => setR([s, e])} />
          <p className="text-xs text-gray-500">Drag on the waveform to move the start / end markers. Selected: {fmtDuration(r[1] - r[0])}</p>
          <TimeInputs start={r[0]} end={r[1]} max={buf.duration} onChange={(s, e) => setR([s, e])} />
          <div className="flex flex-wrap gap-3 items-center">
            <button type="button" onClick={() => (pl.playing ? pl.stop() : pl.play(buf, r[0], r[1]))} className="btn-secondary">{pl.playing ? "⏹ Stop" : "▶ Play selection"}</button>
            <Select value={mode} onChange={setMode} options={[["keep", "Keep the selection"], ["remove", "Remove the selection"]]} />
          </div>
          {mode === "keep" && (
            <div className="grid sm:grid-cols-2 gap-4">
              <Range label="Fade in" value={fadeIn} onChange={setFadeIn} min={0} max={10} step={0.5} suffix=" s" />
              <Range label="Fade out" value={fadeOut} onChange={setFadeOut} min={0} max={10} step={0.5} suffix=" s" />
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <FormatPicker value={fmt} onChange={setFmt} />
            <button type="button" disabled={job.busy} onClick={() => job.run(cut)} className="btn-primary disabled:opacity-50">{job.busy ? "Cutting…" : "✂ Cut audio"}</button>
          </div>
          {job.busy && <Spinner label="Processing…" />}
          <ErrorBox error={job.error} />
          <AudioResult blob={job.result} name={outName(file, "cut", fmt)} />
        </>
      )}
    </Card>
  );
}

export function LoopMaker() {
  const [r, setR] = useState<[number, number]>([0, 0]);
  const [pk, setPk] = useState<number[]>([]);
  const { file, setFile, buf, err } = useDecoded((b) => {
    setPk(getPeaks(b));
    setR([0, Math.min(b.duration, 8)]);
  });
  const [times, setTimes] = useState(4);
  const [xf, setXf] = useState(0.05);
  const [fmt, setFmt] = useState<OutFormat>("mp3");
  const job = useJob();
  const pl = useRegionPlayer();
  const snap = () => {
    if (!buf) return;
    const { bpm } = detectBPM(sliceBuffer(buf, 0, Math.min(buf.duration, 60)));
    const bar = (60 / bpm) * 4;
    const bars = Math.max(1, Math.round((r[1] - r[0]) / bar));
    setR([r[0], Math.min(buf.duration, r[0] + bars * bar)]);
  };
  return (
    <Card className="space-y-5">
      {!file ? <AudioPicker onFile={(f) => setFile(f[0])} /> : <FileBar file={file} onReset={() => { pl.stop(); setFile(null); job.setResult(null); }} />}
      <ErrorBox error={err} />
      {file && !buf && !err && <Spinner label="Reading audio…" />}
      {buf && (
        <>
          <Waveform peaks={pk} duration={buf.duration} start={r[0]} end={r[1]} onChange={(s, e) => setR([s, e])} />
          <TimeInputs start={r[0]} end={r[1]} max={buf.duration} onChange={(s, e) => setR([s, e])} />
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => (pl.playing ? pl.stop() : pl.play(buf, r[0], r[1], true))} className="btn-secondary">{pl.playing ? "⏹ Stop" : "🔁 Preview loop"}</button>
            <button type="button" onClick={snap} className="rounded-lg border border-gray-300 px-4 py-2 font-semibold text-sm">🎯 Snap to whole bars</button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Range label="Repeat" value={times} onChange={setTimes} min={1} max={32} suffix="×" />
            <Range label="Crossfade at seams" value={xf} onChange={setXf} min={0} max={0.5} step={0.01} suffix=" s" />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <FormatPicker value={fmt} onChange={setFmt} />
            <button type="button" disabled={job.busy} onClick={() => job.run(() => bufferToFormat(loopBuffer(sliceBuffer(buf, r[0], r[1]), { times, crossfade: xf }), fmt))} className="btn-primary disabled:opacity-50">{job.busy ? "Rendering…" : "Create loop"}</button>
          </div>
          <ErrorBox error={job.error} />
          <AudioResult blob={job.result} name={outName(file, `loop-x${times}`, fmt)} />
        </>
      )}
    </Card>
  );
}

export function LooperExtender() {
  const { file, setFile, buf, err } = useDecoded();
  const [mode, setMode] = useState("times");
  const [times, setTimes] = useState(3);
  const [mins, setMins] = useState(10);
  const [xf, setXf] = useState(0.5);
  const [fmt, setFmt] = useState<OutFormat>("mp3");
  const job = useJob();
  return (
    <Card className="space-y-5">
      {!file ? <AudioPicker onFile={(f) => setFile(f[0])} /> : <FileBar file={file} onReset={() => { setFile(null); job.setResult(null); }}>{buf && ` · ${fmtDuration(buf.duration)}`}</FileBar>}
      <ErrorBox error={err} />
      {file && !buf && !err && <Spinner label="Reading audio…" />}
      {buf && (
        <>
          <Player src={file} />
          <div className="flex gap-2">
            {[["times", "Repeat N times"], ["target", "Extend to a length"]].map(([k, l]) => <button key={k} type="button" onClick={() => setMode(k)} className={`px-4 py-2 rounded-lg border text-sm font-semibold ${mode === k ? "bg-red-500 text-white border-red-500" : "bg-white border-gray-300"}`}>{l}</button>)}
          </div>
          {mode === "times" ? <Range label="Repeat" value={times} onChange={setTimes} min={2} max={50} suffix="×" /> : <Range label="Target length" value={mins} onChange={setMins} min={1} max={120} suffix=" min" />}
          <Range label="Crossfade between repeats" value={xf} onChange={setXf} min={0} max={5} step={0.1} suffix=" s" />
          <p className="text-sm text-gray-500">Result length: {fmtDuration(mode === "times" ? (buf.duration - xf) * times + xf : mins * 60)}</p>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <FormatPicker value={fmt} onChange={setFmt} />
            <button type="button" disabled={job.busy} onClick={() => job.run(async () => { const sec = mode === "times" ? (buf.duration - xf) * times + xf : mins * 60; if (sec > 7200) throw new Error("Maximum result length is 2 hours."); return bufferToFormat(loopBuffer(buf, mode === "times" ? { times, crossfade: xf } : { targetSec: mins * 60, crossfade: xf }), fmt); })} className="btn-primary disabled:opacity-50">{job.busy ? "Rendering…" : "Extend audio"}</button>
          </div>
          {job.busy && <Spinner label="Rendering… long results take a moment" />}
          <ErrorBox error={job.error} />
          <AudioResult blob={job.result} name={outName(file, "extended", fmt)} />
        </>
      )}
    </Card>
  );
}

export function SplitAudio() {
  const [file, setFile] = useState<File | null>(null);
  const [dur, setDur] = useState(0);
  const [mode, setMode] = useState("parts");
  const [parts, setParts] = useState(3);
  const [secs, setSecs] = useState(60);
  const [fmt, setFmt] = useState<OutFormat>("mp3");
  const [out, setOut] = useState<Blob[]>([]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const cuts = (() => {
    if (!dur) return [] as [number, number][];
    const len = mode === "parts" ? dur / parts : secs;
    const r: [number, number][] = [];
    for (let s = 0; s < dur - 0.05; s += len) r.push([s, Math.min(dur, s + len)]);
    return r.slice(0, 200);
  })();
  const base = safeName((file?.name || "audio").replace(/\.[^.]+$/, ""));
  const run = async () => {
    if (!file) return;
    setBusy(true);
    setErr(null);
    setOut([]);
    setDone(0);
    try {
      setOut(await ffmpegMulti(file, cuts.map(([s, e], i) => ({ args: ["-ss", s.toFixed(3), "-t", (e - s).toFixed(3), "-i", "input", "-vn", ...codecArgs(fmt)], out: `part${i + 1}.${fmt}` })), setDone));
    } catch {
      setErr("Splitting failed. Try another file.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card className="space-y-5">
      {!file ? <AudioPicker onFile={async (f) => { setFile(f[0]); setOut([]); setDur(await getDuration(f[0]).catch(() => 0)); }} /> : <FileBar file={file} onReset={() => { setFile(null); setOut([]); setDur(0); }}>{dur > 0 && ` · ${fmtDuration(dur)}`}</FileBar>}
      {file && (
        <>
          <div className="flex gap-2">
            {[["parts", "Equal parts"], ["length", "Every X seconds"]].map(([k, l]) => <button key={k} type="button" onClick={() => setMode(k)} className={`px-4 py-2 rounded-lg border text-sm font-semibold ${mode === k ? "bg-red-500 text-white border-red-500" : "bg-white border-gray-300"}`}>{l}</button>)}
          </div>
          {mode === "parts" ? <Range label="Number of parts" value={parts} onChange={setParts} min={2} max={50} /> : <Range label="Length of each piece" value={secs} onChange={setSecs} min={5} max={1800} step={5} suffix=" s" />}
          <p className="text-sm text-gray-500">{cuts.length} pieces of about {cuts.length ? fmtDuration(cuts[0][1] - cuts[0][0]) : "—"}</p>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <FormatPicker value={fmt} onChange={setFmt} />
            <button type="button" disabled={busy || !cuts.length} onClick={run} className="btn-primary disabled:opacity-50">{busy ? `Splitting ${done}/${cuts.length}…` : "Split audio"}</button>
          </div>
          <ErrorBox error={err} />
          {out.length > 0 && (
            <div className="space-y-2">
              <div className="success-msg flex flex-wrap items-center justify-between gap-3 !text-left">
                <p className="!m-0 font-bold">✓ {out.length} parts ready</p>
                <button type="button" className="btn-success !px-5 !py-2 !text-base" onClick={async () => { const z = new JSZip(); out.forEach((b, i) => z.file(`${base}-part${i + 1}.${fmt}`, b)); downloadBlob(await z.generateAsync({ type: "blob" }), `${base}-parts.zip`); }}>⬇ Download all (ZIP)</button>
              </div>
              {out.map((b, i) => (
                <div key={i} className="file-card flex flex-wrap items-center justify-between gap-3">
                  <span className="file-name">Part {i + 1} · {fmtDuration(cuts[i][0])}–{fmtDuration(cuts[i][1])}</span>
                  <button type="button" onClick={() => downloadBlob(b, `${base}-part${i + 1}.${fmt}`)} className="btn-success !px-4 !py-1.5 !text-sm ml-auto">⬇</button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </Card>
  );
}

export function AudioJoiner() {
  const [files, setFiles] = useState<File[]>([]);
  const [xf, setXf] = useState(0);
  const [gap, setGap] = useState(0);
  const [fmt, setFmt] = useState<OutFormat>("mp3");
  const job = useJob();
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= files.length) return;
    const n = [...files];
    [n[i], n[j]] = [n[j], n[i]];
    setFiles(n);
  };
  const join = async () => {
    if (files.length < 2) throw new Error("Add at least 2 files.");
    const n = files.length;
    const pre = files.map((_, i) => `[${i}:a]aresample=44100,aformat=sample_fmts=fltp:channel_layouts=stereo${gap && !xf && i < n - 1 ? `,apad=pad_dur=${gap}` : ""}[a${i}]`).join(";");
    let chain: string;
    if (xf > 0) {
      chain = "";
      let last = "a0";
      for (let i = 1; i < n; i++) {
        const o = i === n - 1 ? "out" : `x${i}`;
        chain += `;[${last}][a${i}]acrossfade=d=${xf}:c1=tri:c2=tri[${o}]`;
        last = o;
      }
    } else {
      chain = `;${files.map((_, i) => `[a${i}]`).join("")}concat=n=${n}:v=0:a=1[out]`;
    }
    const inputs = files.map((f, i) => ({ name: `in${i}`, data: f as Blob }));
    return ffmpegRun(inputs, [...inputs.flatMap((x) => ["-i", x.name]), "-filter_complex", pre + chain, "-map", "[out]", ...codecArgs(fmt)], `joined.${fmt}`);
  };
  return (
    <Card className="space-y-5">
      <AudioPicker multiple label={files.length ? "Add more files" : "Select audio files"} onFile={(f) => { setFiles([...files, ...f]); job.setResult(null); }} />
      {files.length > 0 && (
        <>
          <div className="space-y-2">
            {files.map((f, i) => (
              <div key={`${f.name}-${i}`} className="file-card flex items-center gap-3">
                <span className="font-bold text-gray-400 w-6">{i + 1}</span>
                <span className="file-name truncate flex-1 min-w-0">{f.name}</span>
                <div className="flex gap-1 shrink-0">
                  <button type="button" aria-label="Move up" onClick={() => move(i, -1)} className="px-2 py-1 rounded border">↑</button>
                  <button type="button" aria-label="Move down" onClick={() => move(i, 1)} className="px-2 py-1 rounded border">↓</button>
                  <button type="button" aria-label="Remove" onClick={() => setFiles(files.filter((_, j) => j !== i))} className="px-2 py-1 rounded border text-red-600">✕</button>
                </div>
              </div>
            ))}
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Range label="Crossfade between files" value={xf} onChange={setXf} min={0} max={10} step={0.5} suffix=" s" />
            {!xf && <Range label="Silence between files" value={gap} onChange={setGap} min={0} max={10} step={0.5} suffix=" s" />}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <FormatPicker value={fmt} onChange={setFmt} />
            <button type="button" disabled={job.busy || files.length < 2} onClick={() => job.run(join)} className="btn-primary disabled:opacity-50">{job.busy ? "Joining…" : `Join ${files.length} files`}</button>
          </div>
          {job.busy && <Spinner label="Joining in your browser…" />}
          <ErrorBox error={job.error} />
          <AudioResult blob={job.result} name={`joined-audio.${fmt}`} />
        </>
      )}
    </Card>
  );
}
