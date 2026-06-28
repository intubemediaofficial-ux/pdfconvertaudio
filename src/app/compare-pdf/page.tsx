"use client";

import { useState, useRef } from "react";
import FileUpload from "@/components/FileUpload";

interface PageDiff {
  pageNum: number;
  img1: string;
  img2: string;
  diffCanvas: string;
  hasDifferences: boolean;
}

export default function ComparePDF() {
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [diffs, setDiffs] = useState<PageDiff[]>([]);
  const [processing, setProcessing] = useState(false);
  const [viewMode, setViewMode] = useState<"side-by-side" | "overlay" | "diff">("side-by-side");
  const [currentPage, setCurrentPage] = useState(0);
  const [step, setStep] = useState<"upload1" | "upload2" | "comparing" | "result">("upload1");
  const file1Ref = useRef<File | null>(null);

  const renderPDFPages = async (arrayBuffer: ArrayBuffer, scale = 1.5): Promise<string[]> => {
    const pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const images: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: ctx, viewport, canvas } as Parameters<typeof page.render>[0]).promise;
      images.push(canvas.toDataURL());
    }
    return images;
  };

  const computeDiff = (img1Src: string, img2Src: string): Promise<{ diffCanvas: string; hasDifferences: boolean }> => {
    return new Promise((resolve) => {
      const img1 = new Image();
      const img2 = new Image();
      let loaded = 0;

      const onLoad = () => {
        loaded++;
        if (loaded < 2) return;

        const w = Math.max(img1.width, img2.width);
        const h = Math.max(img1.height, img2.height);

        const canvas1 = document.createElement("canvas");
        canvas1.width = w;
        canvas1.height = h;
        const ctx1 = canvas1.getContext("2d")!;
        ctx1.fillStyle = "#fff";
        ctx1.fillRect(0, 0, w, h);
        ctx1.drawImage(img1, 0, 0);

        const canvas2 = document.createElement("canvas");
        canvas2.width = w;
        canvas2.height = h;
        const ctx2 = canvas2.getContext("2d")!;
        ctx2.fillStyle = "#fff";
        ctx2.fillRect(0, 0, w, h);
        ctx2.drawImage(img2, 0, 0);

        const data1 = ctx1.getImageData(0, 0, w, h);
        const data2 = ctx2.getImageData(0, 0, w, h);

        const diffCanvas = document.createElement("canvas");
        diffCanvas.width = w;
        diffCanvas.height = h;
        const diffCtx = diffCanvas.getContext("2d")!;
        const diffData = diffCtx.createImageData(w, h);

        let diffCount = 0;
        const threshold = 30;

        for (let i = 0; i < data1.data.length; i += 4) {
          const r1 = data1.data[i], g1 = data1.data[i + 1], b1 = data1.data[i + 2];
          const r2 = data2.data[i], g2 = data2.data[i + 1], b2 = data2.data[i + 2];

          const diff = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);

          if (diff > threshold) {
            diffData.data[i] = 255;
            diffData.data[i + 1] = 50;
            diffData.data[i + 2] = 50;
            diffData.data[i + 3] = 200;
            diffCount++;
          } else {
            diffData.data[i] = r1;
            diffData.data[i + 1] = g1;
            diffData.data[i + 2] = b1;
            diffData.data[i + 3] = 60;
          }
        }

        diffCtx.putImageData(diffData, 0, 0);
        resolve({
          diffCanvas: diffCanvas.toDataURL(),
          hasDifferences: diffCount > 100,
        });
      };

      img1.onload = onLoad;
      img2.onload = onLoad;
      img1.src = img1Src;
      img2.src = img2Src;
    });
  };

  const handleFile1 = (files: File[]) => {
    setFile1(files[0]);
    file1Ref.current = files[0];
    setStep("upload2");
  };

  const handleFile2 = async (files: File[]) => {
    const f2 = files[0];
    setFile2(f2);
    setStep("comparing");
    setProcessing(true);

    try {
      const f1 = file1Ref.current!;
      const [ab1, ab2] = await Promise.all([f1.arrayBuffer(), f2.arrayBuffer()]);
      const [pages1, pages2] = await Promise.all([renderPDFPages(ab1), renderPDFPages(ab2)]);

      const maxPages = Math.max(pages1.length, pages2.length);
      const results: PageDiff[] = [];

      for (let i = 0; i < maxPages; i++) {
        const img1 = pages1[i] || "";
        const img2 = pages2[i] || "";

        if (img1 && img2) {
          const { diffCanvas, hasDifferences } = await computeDiff(img1, img2);
          results.push({ pageNum: i + 1, img1, img2, diffCanvas, hasDifferences });
        } else {
          results.push({
            pageNum: i + 1,
            img1: img1 || "",
            img2: img2 || "",
            diffCanvas: "",
            hasDifferences: true,
          });
        }
      }

      setDiffs(results);
      setStep("result");
    } catch (err) {
      alert("Error comparing PDFs: " + (err instanceof Error ? err.message : "Unknown"));
      setStep("upload1");
    } finally {
      setProcessing(false);
    }
  };

  const reset = () => {
    setFile1(null);
    setFile2(null);
    setDiffs([]);
    setCurrentPage(0);
    setStep("upload1");
  };

  const diffSummary = diffs.filter((d) => d.hasDifferences).length;

  return (
    <div className="tool-container" style={{ maxWidth: 1200 }}>
      <div className="text-center mb-10">
        <h1 className="page-title mb-3">Compare PDF</h1>
        <p className="page-desc">
          Show a side-by-side document comparison and easily spot changes between different file versions.
        </p>
      </div>

      {step === "upload1" && (
        <div>
          <h2 className="text-xl font-bold text-center text-gray-700 mb-4">Step 1: Select First PDF (Original)</h2>
          <FileUpload accept=".pdf" onFilesSelected={handleFile1} label="Select Original PDF" />
        </div>
      )}

      {step === "upload2" && (
        <div>
          <div className="file-card mb-6 max-w-lg mx-auto">
            <p className="file-name">📄 Original: {file1?.name}</p>
            <p className="file-size">{((file1?.size || 0) / 1024).toFixed(1)} KB</p>
          </div>
          <h2 className="text-xl font-bold text-center text-gray-700 mb-4">Step 2: Select Second PDF (Modified)</h2>
          <FileUpload accept=".pdf" onFilesSelected={handleFile2} label="Select Modified PDF" />
        </div>
      )}

      {step === "comparing" && (
        <div className="text-center py-20">
          <div className="text-6xl mb-6 animate-pulse">🔍</div>
          <p className="text-xl font-semibold text-gray-700">Comparing documents...</p>
          <p className="text-gray-500 mt-2">Analyzing page-by-page differences</p>
        </div>
      )}

      {step === "result" && diffs.length > 0 && (
        <div>
          {/* Summary */}
          <div className="bg-white border-2 border-gray-100 rounded-2xl p-5 mb-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-bold text-lg text-gray-800">
                  {diffSummary === 0
                    ? "✅ Documents are identical!"
                    : `⚠️ ${diffSummary} of ${diffs.length} page(s) have differences`}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {file1?.name} vs {file2?.name}
                </p>
              </div>
              <div className="flex gap-2">
                {(["side-by-side", "overlay", "diff"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition capitalize ${
                      viewMode === mode
                        ? "bg-red-500 text-white border-red-500"
                        : "bg-white text-gray-600 border-gray-200 hover:border-red-200"
                    }`}
                  >
                    {mode === "side-by-side" ? "Side by Side" : mode === "overlay" ? "Overlay" : "Differences"}
                  </button>
                ))}
              </div>
              <button onClick={reset} className="btn-secondary text-sm">
                Compare New Files
              </button>
            </div>
          </div>

          {/* Page navigation */}
          {diffs.length > 1 && (
            <div className="flex gap-2 justify-center mb-6 flex-wrap">
              {diffs.map((d, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition ${
                    currentPage === i
                      ? "bg-red-500 text-white border-red-500"
                      : d.hasDifferences
                      ? "bg-yellow-50 text-yellow-700 border-yellow-300 hover:border-yellow-500"
                      : "bg-white text-gray-700 border-gray-200"
                  }`}
                >
                  Page {d.pageNum} {d.hasDifferences ? "⚠️" : "✓"}
                </button>
              ))}
            </div>
          )}

          {/* Comparison view */}
          <div className="border-2 border-gray-200 rounded-2xl overflow-hidden bg-gray-50">
            {viewMode === "side-by-side" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                <div className="relative">
                  <div className="absolute top-2 left-2 bg-blue-500 text-white px-3 py-1 rounded-lg text-xs font-bold z-10">
                    Original
                  </div>
                  {diffs[currentPage]?.img1 ? (
                    <img src={diffs[currentPage].img1} alt="Original" className="w-full" />
                  ) : (
                    <div className="h-96 flex items-center justify-center text-gray-400">Page not in this document</div>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute top-2 left-2 bg-green-500 text-white px-3 py-1 rounded-lg text-xs font-bold z-10">
                    Modified
                  </div>
                  {diffs[currentPage]?.img2 ? (
                    <img src={diffs[currentPage].img2} alt="Modified" className="w-full" />
                  ) : (
                    <div className="h-96 flex items-center justify-center text-gray-400">Page not in this document</div>
                  )}
                </div>
              </div>
            )}

            {viewMode === "overlay" && (
              <div className="relative">
                {diffs[currentPage]?.img1 && (
                  <img src={diffs[currentPage].img1} alt="Original" className="w-full" />
                )}
                {diffs[currentPage]?.img2 && (
                  <img
                    src={diffs[currentPage].img2}
                    alt="Modified"
                    className="w-full absolute inset-0 opacity-50"
                    style={{ mixBlendMode: "difference" }}
                  />
                )}
              </div>
            )}

            {viewMode === "diff" && (
              <div className="relative">
                {diffs[currentPage]?.diffCanvas ? (
                  <img src={diffs[currentPage].diffCanvas} alt="Differences" className="w-full" />
                ) : (
                  <div className="h-96 flex items-center justify-center text-gray-400">
                    Cannot compute diff for this page
                  </div>
                )}
                <div className="absolute bottom-4 right-4 bg-white/90 border rounded-lg px-3 py-2 text-sm">
                  <span className="inline-block w-3 h-3 bg-red-500 rounded mr-2"></span>
                  Red = Changed areas
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
