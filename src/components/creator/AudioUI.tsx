"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { downloadBlob, safeName } from "@/lib/creator/export";
import type { OutFormat } from "@/lib/creator/audio";

export function AudioPicker({ onFile, multiple = false, label = "Select audio file", accept = "audio/*,video/*,.mp3,.wav,.m4a,.aac,.ogg,.flac,.opus,.wma,.aiff,.mp4,.webm" }: {
  onFile: (files: File[]) => void;
  multiple?: boolean;
  label?: string;
  accept?: string;
}) {
  const [drag, setDrag] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div
      className={`upload-zone p-8 sm:p-12 text-center cursor-pointer ${drag ? "drag-over" : ""}`}
      onClick={() => ref.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length) onFile(multiple ? files : files.slice(0, 1));
      }}
    >
      <div className="text-5xl mb-3">🎵</div>
      <button type="button" className="btn-primary !px-8 !py-3 !text-lg">{label}</button>
      <p className="text-gray-500 mt-3 text-sm">or drop {multiple ? "files" : "a file"} here · MP3, WAV, M4A, OGG, FLAC, MP4 and more · processed in your browser</p>
      <input
        ref={ref}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          if (files.length) onFile(files);
          e.target.value = "";
        }}
      />
    </div>
  );
}

export function FileBar({ file, onReset, children }: { file: File; onReset: () => void; children?: ReactNode }) {
  return (
    <div className="file-card flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="file-name truncate">🎵 {file.name}</div>
        <div className="file-size">
          {(file.size / 1024 / 1024).toFixed(2)} MB {children}
        </div>
      </div>
      <button type="button" onClick={onReset} className="text-sm font-semibold text-gray-500 hover:text-red-600 shrink-0">
        ✕ Change file
      </button>
    </div>
  );
}

export function useObjectUrl(blob: Blob | null) {
  const url = useMemo(() => (blob ? URL.createObjectURL(blob) : null), [blob]);
  useEffect(() => () => {
    if (url) URL.revokeObjectURL(url);
  }, [url]);
  return url;
}

export function Player({ src }: { src: Blob | null }) {
  const url = useObjectUrl(src);
  if (!url) return null;
  return <audio controls src={url} className="w-full mt-2" />;
}

export function AudioResult({ blob, name, label = "Result" }: { blob: Blob | null; name: string; label?: string }) {
  if (!blob) return null;
  return (
    <div className="success-msg mt-6 !text-left">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="!m-0 font-bold">✓ {label} ready · {(blob.size / 1024 / 1024).toFixed(2)} MB</p>
        <button type="button" onClick={() => downloadBlob(blob, name)} className="btn-success !px-5 !py-2 !text-base">
          ⬇ Download
        </button>
      </div>
      <Player src={blob} />
    </div>
  );
}

export function FormatPicker({ value, onChange }: { value: OutFormat; onChange: (v: OutFormat) => void }) {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
      Output:
      {(["mp3", "wav"] as OutFormat[]).map((f) => (
        <button
          type="button"
          key={f}
          onClick={() => onChange(f)}
          className={`px-3 py-1.5 rounded-lg border ${value === f ? "bg-red-500 text-white border-red-500" : "bg-white border-gray-300"}`}
        >
          {f.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

export function outName(file: File | null, suffix: string, fmt: string) {
  return `${safeName((file?.name || "audio").replace(/\.[^.]+$/, ""))}-${suffix}.${fmt}`;
}

export function Waveform({
  peaks,
  duration,
  start,
  end,
  onChange,
  playhead,
}: {
  peaks: number[];
  duration: number;
  start: number;
  end: number;
  onChange?: (s: number, e: number) => void;
  playhead?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drag = useRef<"s" | "e" | null>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    const w = c.clientWidth, h = c.clientHeight;
    c.width = w * dpr;
    c.height = h * dpr;
    const g = c.getContext("2d")!;
    g.scale(dpr, dpr);
    g.clearRect(0, 0, w, h);
    const sx = (start / duration) * w, ex = (end / duration) * w;
    g.fillStyle = "rgba(231,76,60,0.08)";
    g.fillRect(sx, 0, ex - sx, h);
    const bw = w / peaks.length;
    peaks.forEach((p, i) => {
      const x = i * bw;
      g.fillStyle = x >= sx && x <= ex ? "#e74c3c" : "#d1d5db";
      const bh = Math.max(1, p * h * 0.95);
      g.fillRect(x, (h - bh) / 2, Math.max(1, bw - 0.5), bh);
    });
    if (onChange) {
      g.fillStyle = "#111827";
      g.fillRect(sx - 1.5, 0, 3, h);
      g.fillRect(ex - 1.5, 0, 3, h);
    }
    if (playhead !== undefined) {
      g.fillStyle = "#2563eb";
      g.fillRect((playhead / duration) * w - 1, 0, 2, h);
    }
  }, [peaks, duration, start, end, playhead, onChange]);
  const toTime = (clientX: number) => {
    const r = ref.current!.getBoundingClientRect();
    return Math.max(0, Math.min(duration, ((clientX - r.left) / r.width) * duration));
  };
  return (
    <canvas
      ref={ref}
      className="w-full h-28 rounded-xl bg-gray-50 border border-gray-200 touch-none"
      onPointerDown={(e) => {
        if (!onChange) return;
        const t = toTime(e.clientX);
        drag.current = Math.abs(t - start) < Math.abs(t - end) ? "s" : "e";
        (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
        if (drag.current === "s") onChange(Math.min(t, end - 0.05), end);
        else onChange(start, Math.max(t, start + 0.05));
      }}
      onPointerMove={(e) => {
        if (!onChange || !drag.current) return;
        const t = toTime(e.clientX);
        if (drag.current === "s") onChange(Math.min(t, end - 0.05), end);
        else onChange(start, Math.max(t, start + 0.05));
      }}
      onPointerUp={() => (drag.current = null)}
    />
  );
}
