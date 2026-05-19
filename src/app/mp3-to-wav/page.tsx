"use client";

import { useState, useRef } from "react";
import { getFFmpeg, convertAudio } from "@/lib/ffmpeg-helper";

export default function Mp3ToWav() {
  const [file, setFile] = useState<File | null>(null);
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
    }
  };

  const convert = async () => {
    if (!file) return;
    setConverting(true);
    setProgress("Loading FFmpeg...");
    setError("");

    try {
      await getFFmpeg();
      setProgress("Converting MP3 to WAV...");

      const arrayBuf = await file.arrayBuffer();
      const inputData = new Uint8Array(arrayBuf);
      const outputData = await convertAudio(inputData, "input.mp3", "output.wav");

      const blob = new Blob([outputData.buffer as ArrayBuffer], { type: "audio/wav" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name.replace(/\.mp3$/i, "") + ".wav";
      a.click();
      URL.revokeObjectURL(url);

      setDone(true);
      setProgress("");
    } catch (err) {
      setError("Error converting: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setConverting(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  return (
    <div className="tool-container">
      <div className="text-center mb-10">
        <h1 className="page-title">MP3 to WAV</h1>
        <p className="page-desc mt-3">
          Convert MP3 audio files to high quality WAV format. Fast, free, and
          runs entirely in your browser.
        </p>
      </div>

      {!file ? (
        <div className="flex flex-col items-center gap-6 py-12">
          <div
            className={`upload-zone p-20 text-center cursor-pointer w-full max-w-2xl ${dragOver ? "drag-over" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
            onClick={() => inputRef.current?.click()}
          >
            <div className="text-6xl mb-6">🎵</div>
            <button type="button" className="btn-primary mb-4">Select MP3 File</button>
            <p className="text-gray-400 text-lg mt-2">or drop MP3 file here</p>
            <input
              ref={inputRef}
              type="file"
              accept=".mp3,audio/mpeg"
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

          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 text-center mb-6">
              <p className="text-red-600 font-semibold text-lg">{error}</p>
            </div>
          )}

          {done ? (
            <div className="success-msg">
              <p>WAV file downloaded successfully!</p>
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
                {converting ? "Converting..." : "Convert to WAV"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
