"use client";

import { useEffect, useRef, useState } from "react";
import { audioCtx, decodeFile, detectBPM, encodeWav } from "@/lib/creator/audio";
import { downloadBlob } from "@/lib/creator/export";
import { Card, ErrorBox, Range, Spinner, Stat } from "../ui";
import { AudioPicker, FileBar } from "../AudioUI";

export function TapBpm() {
  const [taps, setTaps] = useState<number[]>([]);
  const [flash, setFlash] = useState(false);
  const tap = () => {
    const now = performance.now();
    setTaps((t) => (t.length && now - t[t.length - 1] > 2500 ? [now] : [...t.slice(-24), now]));
    setFlash(true);
    setTimeout(() => setFlash(false), 90);
  };
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.key === "t" || e.key === "T") {
        if ((e.target as HTMLElement).tagName === "INPUT") return;
        e.preventDefault();
        tap();
      }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);
  const intervals = taps.slice(1).map((t, i) => t - taps[i]);
  const avg = intervals.length ? intervals.reduce((a, b) => a + b, 0) / intervals.length : 0;
  const bpm = avg ? 60000 / avg : 0;
  const recent = intervals.slice(-4);
  const recentBpm = recent.length ? 60000 / (recent.reduce((a, b) => a + b, 0) / recent.length) : 0;
  return (
    <Card className="text-center space-y-6">
      <button
        type="button"
        onPointerDown={tap}
        className={`w-48 h-48 sm:w-56 sm:h-56 rounded-full text-3xl font-extrabold text-white shadow-xl select-none touch-manipulation transition-transform ${flash ? "scale-95 bg-red-600" : "bg-red-500"}`}
      >
        TAP
      </button>
      <p className="text-sm text-gray-500">Tap the button (or press Space / T) on every beat. Pause 2.5 s to start again.</p>
      <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto">
        <Stat label="BPM" value={bpm ? Math.round(bpm) : "—"} sub={bpm ? bpm.toFixed(1) : ""} />
        <Stat label="Last 4 taps" value={recentBpm ? Math.round(recentBpm) : "—"} />
        <Stat label="Taps" value={taps.length} />
      </div>
      {bpm > 0 && <p className="text-sm text-gray-500">Half time {Math.round(bpm / 2)} · Double time {Math.round(bpm * 2)}</p>}
      <button type="button" onClick={() => setTaps([])} className="btn-secondary">Reset</button>
    </Card>
  );
}

const WATER: { name: string; desc: string; build: (c: BaseAudioContext, out: AudioNode, t: number, dur: number) => void }[] = [
  { name: "165 Hz tone", desc: "Classic water-eject frequency", build: (c, out, t, d) => tone(c, out, t, d, 165, "sine") },
  { name: "Low 80 Hz", desc: "Deep vibration for stubborn drops", build: (c, out, t, d) => tone(c, out, t, d, 80, "sine") },
  { name: "Pulse 165 Hz", desc: "On/off pulses shake water loose", build: (c, out, t, d) => { for (let x = 0; x < d; x += 0.5) tone(c, out, t + x, 0.3, 165, "sine"); } },
  { name: "Sweep 100–500 Hz", desc: "Sweeps through speaker resonances", build: (c, out, t, d) => sweep(c, out, t, d, 100, 500) },
  { name: "Square 150 Hz", desc: "Stronger, buzzier vibration", build: (c, out, t, d) => tone(c, out, t, d, 150, "square", 0.35) },
  { name: "Mixed 165 + 300 Hz", desc: "Two tones for earpiece + speaker", build: (c, out, t, d) => { tone(c, out, t, d, 165, "sine", 0.5); tone(c, out, t, d, 300, "sine", 0.5); } },
];

function tone(c: BaseAudioContext, out: AudioNode, t: number, d: number, f: number, type: OscillatorType, vol = 0.9) {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = f;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.03);
  g.gain.setValueAtTime(vol, t + Math.max(0.03, d - 0.05));
  g.gain.linearRampToValueAtTime(0, t + d);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + d + 0.02);
}

function sweep(c: BaseAudioContext, out: AudioNode, t: number, d: number, f1: number, f2: number) {
  const o = c.createOscillator();
  const g = c.createGain();
  o.frequency.setValueAtTime(f1, t);
  for (let x = 0; x < d; x += 2) {
    o.frequency.linearRampToValueAtTime(f2, t + Math.min(d, x + 1));
    o.frequency.linearRampToValueAtTime(f1, t + Math.min(d, x + 2));
  }
  g.gain.setValueAtTime(0.8, t);
  g.gain.setValueAtTime(0.8, t + d - 0.05);
  g.gain.linearRampToValueAtTime(0, t + d);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + d);
}

export function WaterEject() {
  const [dur, setDur] = useState(30);
  const [playing, setPlaying] = useState<number | null>(null);
  const stopRef = useRef<() => void>(() => undefined);
  const play = (i: number) => {
    stopRef.current();
    const c = audioCtx();
    c.resume();
    const g = c.createGain();
    g.connect(c.destination);
    WATER[i].build(c, g, c.currentTime + 0.05, dur);
    setPlaying(i);
    const timer = setTimeout(() => setPlaying(null), dur * 1000 + 200);
    stopRef.current = () => {
      g.disconnect();
      clearTimeout(timer);
      setPlaying(null);
    };
  };
  useEffect(() => () => stopRef.current(), []);
  return (
    <Card className="space-y-5">
      <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">Turn your phone volume to maximum, face the speaker down and play a sound. Stop if it sounds distorted. Use at your own risk.</p>
      <Range label="Duration" value={dur} onChange={setDur} min={10} max={120} step={5} suffix=" s" />
      <div className="grid sm:grid-cols-2 gap-3">
        {WATER.map((w, i) => (
          <button key={w.name} type="button" onClick={() => (playing === i ? stopRef.current() : play(i))} className={`text-left rounded-2xl border-2 p-4 transition ${playing === i ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300"}`}>
            <div className="font-bold text-gray-900">{playing === i ? "⏹ Stop" : "▶"} {w.name}</div>
            <div className="text-sm text-gray-500">{w.desc}</div>
          </button>
        ))}
      </div>
    </Card>
  );
}

function noise(c: BaseAudioContext, d: number) {
  const b = c.createBuffer(1, Math.ceil(c.sampleRate * d), c.sampleRate);
  const x = b.getChannelData(0);
  for (let i = 0; i < x.length; i++) x[i] = Math.random() * 2 - 1;
  const s = c.createBufferSource();
  s.buffer = b;
  return s;
}

function env(c: BaseAudioContext, t: number, a: number, peak: number, d: number) {
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  return g;
}

type Sfx = { name: string; icon: string; dur: number; play: (c: BaseAudioContext, out: AudioNode, t: number) => void };

const SFX: Sfx[] = [
  { name: "Air Horn", icon: "📯", dur: 1.6, play: (c, o, t) => { [233, 311, 466].forEach((f) => { const os = c.createOscillator(); os.type = "sawtooth"; os.frequency.value = f; const g = env(c, t, 0.02, 0.18, 1.5); os.connect(g).connect(o); os.start(t); os.stop(t + 1.6); }); } },
  { name: "Applause", icon: "👏", dur: 3, play: (c, o, t) => { for (let i = 0; i < 90; i++) { const n = noise(c, 0.05); const f = c.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 1500 + Math.random() * 2000; const st = t + Math.random() * 2.6; const g = env(c, st, 0.002, 0.6 * (1 - (st - t) / 3.2), 0.05); n.connect(f).connect(g).connect(o); n.start(st); } } },
  { name: "Drum Roll", icon: "🥁", dur: 2.6, play: (c, o, t) => { for (let x = 0; x < 2; x += 0.045) { const n = noise(c, 0.06); const f = c.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 900; const g = env(c, t + x, 0.002, 0.15 + x * 0.15, 0.06); n.connect(f).connect(g).connect(o); n.start(t + x); } const cy = noise(c, 0.6); const hf = c.createBiquadFilter(); hf.type = "highpass"; hf.frequency.value = 5000; const g = env(c, t + 2, 0.005, 0.7, 0.6); cy.connect(hf).connect(g).connect(o); cy.start(t + 2); } },
  { name: "Buzzer", icon: "🚫", dur: 1, play: (c, o, t) => { const os = c.createOscillator(); os.type = "square"; os.frequency.value = 140; const g = env(c, t, 0.01, 0.3, 0.95); os.connect(g).connect(o); os.start(t); os.stop(t + 1); } },
  { name: "Ding", icon: "🔔", dur: 1.5, play: (c, o, t) => { [1318, 2637].forEach((f, i) => { const os = c.createOscillator(); os.frequency.value = f; const g = env(c, t, 0.005, i ? 0.15 : 0.5, 1.4); os.connect(g).connect(o); os.start(t); os.stop(t + 1.5); }); } },
  { name: "Correct", icon: "✅", dur: 0.6, play: (c, o, t) => { [880, 1320].forEach((f, i) => { const os = c.createOscillator(); os.type = "triangle"; os.frequency.value = f; const g = env(c, t + i * 0.12, 0.005, 0.4, 0.35); os.connect(g).connect(o); os.start(t + i * 0.12); os.stop(t + i * 0.12 + 0.4); }); } },
  { name: "Wrong", icon: "❌", dur: 0.8, play: (c, o, t) => { [300, 200].forEach((f, i) => { const os = c.createOscillator(); os.type = "sawtooth"; os.frequency.value = f; const g = env(c, t + i * 0.25, 0.01, 0.25, 0.35); os.connect(g).connect(o); os.start(t + i * 0.25); os.stop(t + i * 0.25 + 0.4); }); } },
  { name: "Laser", icon: "🔫", dur: 0.5, play: (c, o, t) => { const os = c.createOscillator(); os.type = "square"; os.frequency.setValueAtTime(1800, t); os.frequency.exponentialRampToValueAtTime(120, t + 0.4); const g = env(c, t, 0.005, 0.25, 0.45); os.connect(g).connect(o); os.start(t); os.stop(t + 0.5); } },
  { name: "Boing", icon: "🪀", dur: 0.8, play: (c, o, t) => { const os = c.createOscillator(); os.frequency.setValueAtTime(120, t); os.frequency.exponentialRampToValueAtTime(600, t + 0.15); os.frequency.exponentialRampToValueAtTime(200, t + 0.7); const v = c.createOscillator(); v.frequency.value = 18; const vg = c.createGain(); vg.gain.value = 40; v.connect(vg).connect(os.frequency); const g = env(c, t, 0.01, 0.5, 0.75); os.connect(g).connect(o); os.start(t); v.start(t); os.stop(t + 0.8); v.stop(t + 0.8); } },
  { name: "Whoosh", icon: "💨", dur: 0.9, play: (c, o, t) => { const n = noise(c, 0.9); const f = c.createBiquadFilter(); f.type = "bandpass"; f.Q.value = 2; f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(4000, t + 0.45); f.frequency.exponentialRampToValueAtTime(500, t + 0.85); const g = env(c, t, 0.3, 0.9, 0.85); n.connect(f).connect(g).connect(o); n.start(t); } },
  { name: "Explosion", icon: "💥", dur: 2.2, play: (c, o, t) => { const n = noise(c, 2.2); const f = c.createBiquadFilter(); f.type = "lowpass"; f.frequency.setValueAtTime(1200, t); f.frequency.exponentialRampToValueAtTime(80, t + 2); const g = env(c, t, 0.01, 1, 2.1); n.connect(f).connect(g).connect(o); n.start(t); } },
  { name: "Heartbeat", icon: "💓", dur: 2, play: (c, o, t) => { [0, 0.25, 1, 1.25].forEach((x, i) => { const os = c.createOscillator(); os.frequency.setValueAtTime(70, t + x); os.frequency.exponentialRampToValueAtTime(40, t + x + 0.15); const g = env(c, t + x, 0.01, i % 2 ? 0.5 : 0.8, 0.2); os.connect(g).connect(o); os.start(t + x); os.stop(t + x + 0.25); }); } },
  { name: "Sad Trombone", icon: "🎺", dur: 2.4, play: (c, o, t) => { [[392, 0, 0.45], [370, 0.5, 0.45], [349, 1, 0.45], [330, 1.5, 0.9]].forEach(([f, x, d]) => { const os = c.createOscillator(); os.type = "sawtooth"; os.frequency.setValueAtTime(f, t + x); if (d > 0.5) { const v = c.createOscillator(); v.frequency.value = 6; const vg = c.createGain(); vg.gain.value = 8; v.connect(vg).connect(os.frequency); v.start(t + x); v.stop(t + x + d); } const lp = c.createBiquadFilter(); lp.frequency.value = 1200; const g = env(c, t + x, 0.03, 0.3, d); os.connect(lp).connect(g).connect(o); os.start(t + x); os.stop(t + x + d + 0.05); }); } },
  { name: "Ta-da", icon: "🎉", dur: 1.6, play: (c, o, t) => { [[523, 0, 0.15], [659, 0.15, 1.3], [784, 0.15, 1.3], [1046, 0.15, 1.3]].forEach(([f, x, d]) => { const os = c.createOscillator(); os.type = "triangle"; os.frequency.value = f; const g = env(c, t + x, 0.01, 0.25, d); os.connect(g).connect(o); os.start(t + x); os.stop(t + x + d + 0.05); }); } },
  { name: "Camera Shutter", icon: "📷", dur: 0.3, play: (c, o, t) => { [0, 0.08].forEach((x) => { const n = noise(c, 0.06); const f = c.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 2500; const g = env(c, t + x, 0.001, 0.8, 0.06); n.connect(f).connect(g).connect(o); n.start(t + x); }); } },
  { name: "Clock Tick", icon: "⏰", dur: 2, play: (c, o, t) => { for (let x = 0; x < 2; x += 0.5) { const os = c.createOscillator(); os.type = "square"; os.frequency.value = x % 1 ? 1800 : 2400; const g = env(c, t + x, 0.001, 0.25, 0.03); os.connect(g).connect(o); os.start(t + x); os.stop(t + x + 0.04); } } },
];

async function renderSfx(s: Sfx) {
  const c = new OfflineAudioContext(2, Math.ceil(44100 * (s.dur + 0.2)), 44100);
  s.play(c, c.destination, 0.05);
  return encodeWav(await c.startRendering());
}

export function Soundboard() {
  const [vol, setVol] = useState(80);
  const [last, setLast] = useState<string | null>(null);
  const play = (s: Sfx) => {
    const c = audioCtx();
    c.resume();
    const g = c.createGain();
    g.gain.value = vol / 100;
    g.connect(c.destination);
    s.play(c, g, c.currentTime + 0.02);
    setLast(s.name);
    setTimeout(() => g.disconnect(), (s.dur + 0.5) * 1000);
  };
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const i = "1234567890qwerty".indexOf(e.key.toLowerCase());
      if (i >= 0 && i < SFX.length && (e.target as HTMLElement).tagName !== "INPUT") play(SFX[i]);
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  });
  return (
    <Card className="space-y-5">
      <Range label="Volume" value={vol} onChange={setVol} min={0} max={100} suffix="%" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {SFX.map((s, i) => (
          <div key={s.name} className={`rounded-2xl border-2 p-3 text-center ${last === s.name ? "border-red-400 bg-red-50" : "border-gray-200"}`}>
            <button type="button" onClick={() => play(s)} className="w-full">
              <div className="text-4xl">{s.icon}</div>
              <div className="font-bold text-gray-900 text-sm mt-1">{s.name}</div>
              <div className="text-xs text-gray-400">key {"1234567890qwerty"[i].toUpperCase()}</div>
            </button>
            <button type="button" onClick={async () => downloadBlob(await renderSfx(s), `${s.name.toLowerCase().replace(/\W+/g, "-")}.wav`)} className="text-xs text-blue-600 hover:underline mt-1">⬇ WAV</button>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400">All sounds are generated in your browser and free to use in your videos.</p>
    </Card>
  );
}

export function TempoDetector() {
  const [file, setFile] = useState<File | null>(null);
  const [res, setRes] = useState<{ bpm: number; confidence: number; candidates: number[]; duration: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [metro, setMetro] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const analyse = async (f: File) => {
    setFile(f);
    setBusy(true);
    setErr(null);
    setRes(null);
    try {
      const buf = await decodeFile(f);
      setRes({ ...detectBPM(buf), duration: buf.duration });
    } catch {
      setErr("Could not read this audio file.");
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    if (timer.current) clearInterval(timer.current);
    if (metro && res) {
      const c = audioCtx();
      c.resume();
      timer.current = setInterval(() => {
        const o = c.createOscillator();
        const g = c.createGain();
        o.frequency.value = 1500;
        g.gain.setValueAtTime(0.4, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.05);
        o.connect(g).connect(c.destination);
        o.start();
        o.stop(c.currentTime + 0.06);
      }, 60000 / res.bpm);
    }
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [metro, res]);
  return (
    <Card className="space-y-5">
      {!file ? <AudioPicker onFile={(f) => analyse(f[0])} /> : <FileBar file={file} onReset={() => { setFile(null); setRes(null); setMetro(false); }} />}
      {busy && <Spinner label="Listening for the beat…" />}
      <ErrorBox error={err} />
      {res && (
        <div className="space-y-4 text-center">
          <div className="text-6xl font-extrabold text-red-500">{Math.round(res.bpm)} <span className="text-2xl text-gray-500">BPM</span></div>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Exact" value={res.bpm.toFixed(1)} />
            <Stat label="Half time" value={Math.round(res.bpm / 2)} />
            <Stat label="Double time" value={Math.round(res.bpm * 2)} />
          </div>
          <p className="text-sm text-gray-500">Other likely tempos: {res.candidates.join(", ")}</p>
          <button type="button" className="btn-secondary" onClick={() => setMetro(!metro)}>{metro ? "⏹ Stop metronome" : "▶ Play metronome to check"}</button>
        </div>
      )}
    </Card>
  );
}
