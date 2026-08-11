"use client";

import { useState, useRef, useEffect } from "react";

type ItemStatus = "pending" | "processing" | "done" | "error";

interface QueueItem {
  id: string;
  file: File;
  status: ItemStatus;
  error?: string;
  originalUrl: string;
  resultUrl?: string;
  resultName?: string;
  resultSize?: number;
  width?: number;
  height?: number;
}

const inputAccept = ".jpg,.jpeg,.png,.webp,.bmp,.gif,.avif,.tif,.tiff,image/*";

// Formats the background-removal model can decode directly. Anything else
// (BMP, GIF, AVIF, TIFF, HEIC...) is re-encoded to PNG first, at full size.
const NATIVELY_DECODABLE = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

function megapixels(w: number, h: number) {
  return ((w * h) / 1e6).toFixed(1);
}

/**
 * Re-encodes an image the model cannot decode into a lossless PNG, preserving
 * its exact pixel dimensions. Returns the original file when no work is needed.
 */
async function normalizeForModel(file: File): Promise<Blob> {
  if (NATIVELY_DECODABLE.has(file.type)) return file;

  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get canvas context");
    ctx.drawImage(bitmap, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png")
    );
    if (!blob) throw new Error("Could not read this image format");
    return blob;
  } finally {
    bitmap.close();
  }
}

export default function RemoveBackground() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState("");
  const [allDone, setAllDone] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemsRef = useRef<QueueItem[]>([]);

  itemsRef.current = items;

  // Release object URLs on unmount
  useEffect(() => {
    return () => {
      for (const it of itemsRef.current) {
        URL.revokeObjectURL(it.originalUrl);
        if (it.resultUrl) URL.revokeObjectURL(it.resultUrl);
      }
    };
  }, []);

  const handleFiles = (files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (arr.length === 0) return;
    const newItems: QueueItem[] = arr.map((f, i) => ({
      id: `${Date.now()}-${i}-${f.name}`,
      file: f,
      status: "pending",
      originalUrl: URL.createObjectURL(f),
    }));
    setItems((prev) => [...prev, ...newItems]);
    setAllDone(false);
  };

  const removeItem = (id: string) => {
    setItems((prev) => {
      const target = prev.find((it) => it.id === id);
      if (target) {
        URL.revokeObjectURL(target.originalUrl);
        if (target.resultUrl) URL.revokeObjectURL(target.resultUrl);
      }
      return prev.filter((it) => it.id !== id);
    });
  };

  const clearAll = () => {
    for (const it of items) {
      URL.revokeObjectURL(it.originalUrl);
      if (it.resultUrl) URL.revokeObjectURL(it.resultUrl);
    }
    setItems([]);
    setAllDone(false);
    setProgress("");
  };

  const downloadItem = (it: QueueItem) => {
    if (!it.resultUrl || !it.resultName) return;
    const a = document.createElement("a");
    a.href = it.resultUrl;
    a.download = it.resultName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const downloadAll = () => {
    for (const it of items) {
      if (it.status === "done") downloadItem(it);
    }
  };

  const run = async () => {
    const pending = items.filter(
      (it) => it.status === "pending" || it.status === "error"
    );
    if (pending.length === 0) return;

    setProcessing(true);
    setAllDone(false);
    setProgress("Loading AI model (first time may take a while)...");

    let removeBackground: typeof import("@imgly/background-removal").removeBackground;
    try {
      const mod = await import("@imgly/background-removal");
      removeBackground = mod.removeBackground;
    } catch (err) {
      setProgress("");
      setProcessing(false);
      setItems((prev) =>
        prev.map((it) =>
          it.status === "pending"
            ? {
                ...it,
                status: "error",
                error:
                  "Failed to load AI model: " +
                  (err instanceof Error ? err.message : String(err)),
              }
            : it
        )
      );
      return;
    }

    let index = 0;
    for (const item of pending) {
      index++;
      setProgress(`Removing background ${index} of ${pending.length}...`);
      setItems((prev) =>
        prev.map((it) =>
          it.id === item.id
            ? { ...it, status: "processing", error: undefined }
            : it
        )
      );

      try {
        const source = await normalizeForModel(item.file);
        const blob = await removeBackground(source, {
          // Upscales the mask back to the source dimensions so the output keeps
          // the input's full resolution (4K in, 4K out) rather than the 1024px
          // the model runs at internally.
          rescale: true,
          // PNG is lossless and the only listed format carrying an alpha channel.
          output: { format: "image/png", quality: 1 },
          progress: (key, current, total) => {
            if (key.startsWith("fetch")) {
              const pct = total > 0 ? Math.round((current / total) * 100) : 0;
              setProgress(`Downloading AI model... ${pct}%`);
            } else {
              setProgress(
                `Removing background ${index} of ${pending.length}...`
              );
            }
          },
        });

        const resultUrl = URL.createObjectURL(blob);
        const baseName = item.file.name.replace(/\.[^.]+$/, "");
        const resultName = `${baseName}-no-bg.png`;

        let width: number | undefined;
        let height: number | undefined;
        try {
          const outBitmap = await createImageBitmap(blob);
          width = outBitmap.width;
          height = outBitmap.height;
          outBitmap.close();
        } catch {
          // Dimensions are display-only; failing to read them is not fatal.
        }

        // Auto-download as soon as this image is ready
        const a = document.createElement("a");
        a.href = resultUrl;
        a.download = resultName;
        document.body.appendChild(a);
        a.click();
        a.remove();

        setItems((prev) =>
          prev.map((it) =>
            it.id === item.id
              ? {
                  ...it,
                  status: "done",
                  resultUrl,
                  resultName,
                  resultSize: blob.size,
                  width,
                  height,
                }
              : it
          )
        );
      } catch (err) {
        setItems((prev) =>
          prev.map((it) =>
            it.id === item.id
              ? {
                  ...it,
                  status: "error",
                  error: err instanceof Error ? err.message : String(err),
                }
              : it
          )
        );
      }
    }

    setProgress("");
    setProcessing(false);
    setAllDone(true);
  };

  const doneCount = items.filter((it) => it.status === "done").length;
  const pendingCount = items.filter(
    (it) => it.status === "pending" || it.status === "error"
  ).length;

  return (
    <div className="tool-container">
      <div className="text-center mb-10">
        <h1 className="page-title">Remove Background</h1>
        <p className="page-desc mt-3">
          Automatically remove the background from any photo — JPG, PNG, WEBP
          and more. Output is a lossless transparent PNG at the{" "}
          <strong>full original resolution</strong> — put a 4K photo in, get a 4K
          cutout out. Runs fully in your browser, your images are never uploaded.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-6 py-8">
          <div
            className={`upload-zone p-20 text-center cursor-pointer w-full max-w-2xl ${dragOver ? "drag-over" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFiles(e.dataTransfer.files);
            }}
            onClick={() => inputRef.current?.click()}
          >
            <div className="text-6xl mb-6">🖼️</div>
            <button type="button" className="btn-primary mb-4">
              Select Images
            </button>
            <p className="text-gray-400 text-lg mt-2">or drop your images here</p>
            <p className="text-gray-300 text-sm mt-2">
              Upload as many images as you like — no limit. Each one downloads
              the moment it&apos;s ready.
            </p>
            <p className="text-gray-300 text-sm mt-1">
              JPG, PNG, WEBP, BMP, GIF, AVIF, TIFF &middot; full resolution kept
            </p>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept={inputAccept}
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
              className="hidden"
            />
          </div>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="text-gray-600 font-semibold">
              {items.length} image{items.length > 1 ? "s" : ""}
              {doneCount > 0 && (
                <span className="text-green-600"> · {doneCount} done</span>
              )}
            </div>
            <div className="flex gap-3">
              {doneCount > 0 && !processing && (
                <button
                  onClick={downloadAll}
                  className="text-sm font-semibold text-green-600 hover:text-green-700"
                >
                  Download all
                </button>
              )}
              <button
                onClick={() => inputRef.current?.click()}
                disabled={processing}
                className="text-sm font-semibold text-red-500 hover:text-red-600 disabled:opacity-50"
              >
                + Add more
              </button>
              <button
                onClick={clearAll}
                disabled={processing}
                className="text-sm font-semibold text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                Clear all
              </button>
            </div>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept={inputAccept}
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
              className="hidden"
            />
          </div>

          <div className="space-y-3 mb-6 max-h-[30rem] overflow-y-auto">
            {items.map((it) => (
              <div
                key={it.id}
                className="file-card flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  {/* Original */}
                  <img
                    src={it.originalUrl}
                    alt={it.file.name}
                    className="w-16 h-16 object-cover rounded-lg border border-gray-200 shrink-0"
                  />
                  {it.status === "done" && it.resultUrl && (
                    <>
                      <span className="text-gray-300 shrink-0">→</span>
                      {/* Result on checkerboard so transparency is visible */}
                      <div
                        className="w-16 h-16 rounded-lg border border-gray-200 shrink-0"
                        style={{
                          backgroundImage:
                            "linear-gradient(45deg,#e5e7eb 25%,transparent 25%),linear-gradient(-45deg,#e5e7eb 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#e5e7eb 75%),linear-gradient(-45deg,transparent 75%,#e5e7eb 75%)",
                          backgroundSize: "12px 12px",
                          backgroundPosition:
                            "0 0, 0 6px, 6px -6px, -6px 0px",
                        }}
                      >
                        <img
                          src={it.resultUrl}
                          alt="Background removed"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </>
                  )}
                  <div className="min-w-0">
                    <div className="file-name truncate">{it.file.name}</div>
                    <div className="file-size">
                      {formatSize(it.file.size)}
                      {it.status === "done" && it.width && it.height && (
                        <span className="text-green-600">
                          {" "}
                          &rarr; {it.width}&times;{it.height} (
                          {megapixels(it.width, it.height)} MP
                          {it.resultSize ? `, ${formatSize(it.resultSize)}` : ""}
                          )
                        </span>
                      )}
                    </div>
                    {it.status === "error" && it.error && (
                      <div className="text-red-500 text-xs mt-1 truncate">
                        {it.error}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {it.status === "pending" && (
                    <span className="text-gray-400 text-sm">Waiting</span>
                  )}
                  {it.status === "processing" && (
                    <span className="inline-flex items-center gap-2 text-blue-600 text-sm font-semibold">
                      <span className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      Removing
                    </span>
                  )}
                  {it.status === "done" && (
                    <button
                      onClick={() => downloadItem(it)}
                      className="text-green-600 text-sm font-semibold hover:text-green-700"
                    >
                      ✓ Download
                    </button>
                  )}
                  {it.status === "error" && (
                    <span className="text-red-500 text-sm font-semibold">
                      Failed
                    </span>
                  )}
                  {!processing && (
                    <button
                      onClick={() => removeItem(it.id)}
                      className="text-gray-400 hover:text-red-500 text-xl leading-none"
                    >
                      &times;
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            {progress && (
              <div className="mb-4">
                <div className="inline-flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-full px-6 py-3">
                  <div className="w-5 h-5 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-blue-700 font-semibold">{progress}</span>
                </div>
              </div>
            )}
            {allDone && !processing && doneCount > 0 && (
              <div className="success-msg mb-4">
                <p>
                  Background removed from {doneCount} image
                  {doneCount > 1 ? "s" : ""} and downloaded!
                </p>
              </div>
            )}
            {pendingCount > 0 && (
              <button
                onClick={run}
                disabled={processing}
                className="btn-primary disabled:opacity-50"
              >
                {processing
                  ? "Removing background..."
                  : `Remove background from ${pendingCount} image${pendingCount > 1 ? "s" : ""}`}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
