"use client";

import { useState, useRef } from "react";
import { getFFmpeg, convertAudio } from "@/lib/ffmpeg-helper";

const allFormats = [
  { value: "mp3", label: "MP3", mime: "audio/mpeg", ext: ".mp3" },
  { value: "wav", label: "WAV", mime: "audio/wav", ext: ".wav" },
  { value: "aac", label: "AAC", mime: "audio/aac", ext: ".aac" },
  { value: "ogg", label: "OGG", mime: "audio/ogg", ext: ".ogg" },
  { value: "flac", label: "FLAC", mime: "audio/flac", ext: ".flac" },
  { value: "m4a", label: "M4A", mime: "audio/mp4", ext: ".m4a" },
  { value: "opus", label: "OPUS", mime: "audio/opus", ext: ".opus" },
  { value: "aiff", label: "AIFF", mime: "audio/aiff", ext: ".aiff" },
  { value: "wma", label: "WMA", mime: "audio/x-ms-wma", ext: ".wma" },
  { value: "mp4", label: "MP4", mime: "video/mp4", ext: ".mp4", inputOnly: true },
  { value: "mkv", label: "MKV", mime: "video/x-matroska", ext: ".mkv", inputOnly: true },
  { value: "avi", label: "AVI", mime: "video/x-msvideo", ext: ".avi", inputOnly: true },
  { value: "mov", label: "MOV", mime: "video/quicktime", ext: ".mov", inputOnly: true },
  { value: "webm", label: "WEBM", mime: "video/webm", ext: ".webm", inputOnly: true },
];

const inputFormats = allFormats;
const outputFormats = allFormats.filter((f) => !("inputOnly" in f));

const inputAccept = ".mp3,.wav,.aac,.ogg,.flac,.m4a,.opus,.aiff,.wma,.mp4,.mkv,.avi,.mov,.webm,audio/*,video/*";

function getFFmpegArgs(outputFormat: string, bitrate: string): string[] {
  const args: string[] = [];
  if (outputFormat === "mp3") {
    args.push("-vn", "-b:a", bitrate + "k");
  } else if (outputFormat === "aac" || outputFormat === "m4a") {
    args.push("-vn", "-c:a", "aac", "-b:a", bitrate + "k");
  } else if (outputFormat === "ogg") {
    args.push("-vn", "-c:a", "libvorbis", "-b:a", bitrate + "k");
  } else if (outputFormat === "opus") {
    args.push("-vn", "-c:a", "libopus", "-b:a", bitrate + "k");
  } else if (outputFormat === "flac") {
    args.push("-vn", "-c:a", "flac");
  } else if (outputFormat === "wma") {
    args.push("-vn", "-c:a", "wmav2", "-b:a", bitrate + "k");
  } else {
    args.push("-vn");
  }
  return args;
}

function detectInputExt(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() || "mp3";
}

interface FormatPickerProps {
  label: string;
  selected: string;
  formats: typeof allFormats;
  onSelect: (value: string) => void;
  color: string;
}

function FormatPicker({ label, selected, formats, onSelect, color }: FormatPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const filtered = formats.filter((f) =>
    f.label.toLowerCase().includes(search.toLowerCase())
  );
  const current = formats.find((f) => f.value === selected);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="bg-white border-2 border-gray-200 rounded-2xl px-8 py-5 text-center min-w-[150px] hover:border-red-400 transition cursor-pointer"
      >
        <p className="text-xs text-gray-400 uppercase font-semibold mb-1">{label}</p>
        <div className="text-3xl mb-2">📁</div>
        <div className={`text-lg font-bold flex items-center justify-center gap-2 ${color}`}>
          {current?.label || selected.toUpperCase()}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white border-2 border-gray-200 rounded-2xl shadow-2xl z-50 w-80 overflow-hidden">
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search Format"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-red-400"
                autoFocus
              />
            </div>
          </div>
          <div className="p-3 max-h-64 overflow-y-auto">
            <p className="text-xs font-semibold text-gray-400 uppercase mb-2 px-1">
              {formats.some((f) => "inputOnly" in f) ? "Audio & Video Formats" : "Audio Formats"}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {filtered.map((f) => (
                <button
                  key={f.value}
                  onClick={() => {
                    onSelect(f.value);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    selected === f.value
                      ? "bg-red-500 text-white shadow-md"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AudioConverter() {
  const [file, setFile] = useState<File | null>(null);
  const [inputFormat, setInputFormat] = useState("mp3");
  const [outputFormat, setOutputFormat] = useState("wav");
  const [bitrate, setBitrate] = useState("192");
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | File[]) => {
    const f = Array.from(files)[0];
    if (f) {
      setFile(f);
      setDone(false);
      setError("");
      const ext = detectInputExt(f.name);
      setInputFormat(ext);
    }
  };

  const convert = async () => {
    if (!file) return;
    setConverting(true);
    setProgress("Loading FFmpeg (first time may take ~25 seconds)...");
    setError("");

    try {
      await getFFmpeg();
      setProgress(`Converting to ${outputFormat.toUpperCase()}...`);

      const arrayBuf = await file.arrayBuffer();
      const inputData = new Uint8Array(arrayBuf);
      const inputExt = detectInputExt(file.name);
      const format = outputFormats.find((f) => f.value === outputFormat);
      const outputExt = format?.ext || "." + outputFormat;
      const ffmpegArgs = getFFmpegArgs(outputFormat, bitrate);

      const outputData = await convertAudio(
        inputData,
        `input.${inputExt}`,
        `output${outputExt}`,
        ffmpegArgs
      );

      const blob = new Blob([outputData.buffer as ArrayBuffer], {
        type: format?.mime || "audio/mpeg",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const baseName = file.name.replace(/\.[^.]+$/, "");
      a.download = baseName + outputExt;
      a.click();
      URL.revokeObjectURL(url);

      setDone(true);
      setProgress("");
    } catch (err) {
      setError(
        "Error converting: " +
          (err instanceof Error ? err.message : String(err))
      );
    } finally {
      setConverting(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  const selectedFormat = outputFormats.find((f) => f.value === outputFormat);
  const showBitrate = !["wav", "flac", "aiff"].includes(outputFormat);

  return (
    <div className="tool-container">
      <div className="text-center mb-10">
        <h1 className="page-title">Audio Converter</h1>
        <p className="page-desc mt-3">
          Convert any audio or video file to any audio format. MP3, WAV, AAC,
          OGG, FLAC, M4A, OPUS, AIFF, WMA — all in your browser.
        </p>
      </div>

      {/* CloudConvert-style ANY to ANY format selector */}
      <div className="flex items-center justify-center gap-6 mb-10 flex-wrap">
        <FormatPicker
          label="From"
          selected={file ? detectInputExt(file.name) : inputFormat}
          formats={inputFormats}
          onSelect={setInputFormat}
          color="text-gray-700"
        />

        <div className="flex flex-col items-center">
          <div className="text-3xl">🔄</div>
          <div className="text-gray-400 font-bold text-sm mt-1">TO</div>
        </div>

        <FormatPicker
          label="To"
          selected={outputFormat}
          formats={outputFormats}
          onSelect={setOutputFormat}
          color="text-red-500"
        />
      </div>

      {!file ? (
        <div className="flex flex-col items-center gap-6 py-8">
          <div
            className={`upload-zone p-20 text-center cursor-pointer w-full max-w-2xl ${dragOver ? "drag-over" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
            onClick={() => inputRef.current?.click()}
          >
            <div className="text-6xl mb-6">🎵</div>
            <button type="button" className="btn-primary mb-4">Select File</button>
            <p className="text-gray-400 text-lg mt-2">or drop your file here</p>
            <p className="text-gray-300 text-sm mt-2">
              Supports MP3, WAV, AAC, OGG, FLAC, M4A, OPUS, MP4, MKV, AVI, MOV
            </p>
            <input
              ref={inputRef}
              type="file"
              accept={inputAccept}
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
              className="hidden"
            />
          </div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto">
          <div className="file-card flex items-center justify-between mb-6">
            <div>
              <div className="file-name">{file.name}</div>
              <div className="file-size">{formatSize(file.size)}</div>
            </div>
            <button
              onClick={() => { setFile(null); setDone(false); setError(""); }}
              className="text-gray-400 hover:text-red-500 text-2xl"
            >
              &times;
            </button>
          </div>

          {/* Bitrate Setting (only for lossy formats) */}
          {showBitrate && (
            <div className="file-card mb-6">
              <label className="setting-label">Audio Quality (Bitrate)</label>
              <div className="flex gap-3 flex-wrap">
                {[
                  { value: "128", label: "128 kbps" },
                  { value: "192", label: "192 kbps" },
                  { value: "256", label: "256 kbps" },
                  { value: "320", label: "320 kbps" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setBitrate(opt.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      bitrate === opt.value
                        ? "bg-red-500 text-white shadow-md"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 text-center mb-6">
              <p className="text-red-600 font-semibold text-lg">{error}</p>
            </div>
          )}

          {done ? (
            <div className="success-msg">
              <p>{selectedFormat?.label} file downloaded successfully!</p>
            </div>
          ) : (
            <div className="text-center">
              {progress && (
                <div className="mb-4">
                  <div className="inline-flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-full px-6 py-3">
                    <div className="w-5 h-5 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-blue-700 font-semibold">{progress}</span>
                  </div>
                </div>
              )}
              <button
                onClick={convert}
                disabled={converting}
                className="btn-primary disabled:opacity-50"
              >
                {converting
                  ? "Converting..."
                  : `Convert to ${selectedFormat?.label || "MP3"}`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
