"use client";

import { useState } from "react";
import { PDFDocument, rgb } from "pdf-lib";
import FileUpload from "@/components/FileUpload";

interface RedactArea {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function RedactPDF() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfBytes, setPdfBytes] = useState<ArrayBuffer | null>(null);
  const [pageImages, setPageImages] = useState<string[]>([]);
  const [redactAreas, setRedactAreas] = useState<RedactArea[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [tempRect, setTempRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [redactColor, setRedactColor] = useState<"black" | "white">("black");
  const [done, setDone] = useState(false);

  const handleFileSelected = async (files: File[]) => {
    const f = files[0];
    setFile(f);
    setDone(false);
    const ab = await f.arrayBuffer();
    setPdfBytes(ab);

    const pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
    const imgs: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: ctx, viewport, canvas } as Parameters<typeof page.render>[0]).promise;
      imgs.push(canvas.toDataURL());
    }
    setPageImages(imgs);
  };

  const getRelativePos = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const pos = getRelativePos(e);
    setDrawing(true);
    setStartPos(pos);
    setTempRect(null);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!drawing || !startPos) return;
    const pos = getRelativePos(e);
    setTempRect({
      x: Math.min(startPos.x, pos.x),
      y: Math.min(startPos.y, pos.y),
      w: Math.abs(pos.x - startPos.x),
      h: Math.abs(pos.y - startPos.y),
    });
  };

  const handleMouseUp = () => {
    if (!drawing || !tempRect || tempRect.w < 5 || tempRect.h < 5) {
      setDrawing(false);
      setStartPos(null);
      setTempRect(null);
      return;
    }

    setRedactAreas((prev) => [
      ...prev,
      {
        page: currentPage,
        x: tempRect.x,
        y: tempRect.y,
        width: tempRect.w,
        height: tempRect.h,
      },
    ]);
    setDrawing(false);
    setStartPos(null);
    setTempRect(null);
  };

  const removeArea = (index: number) => {
    setRedactAreas((prev) => prev.filter((_, i) => i !== index));
  };

  const applyRedaction = async () => {
    if (!pdfBytes || redactAreas.length === 0) return;
    setProcessing(true);
    try {
      const pdf = await PDFDocument.load(pdfBytes);
      const pages = pdf.getPages();

      for (const area of redactAreas) {
        const page = pages[area.page];
        const { height: pageHeight } = page.getSize();

        const tempImg = new Image();
        tempImg.src = pageImages[area.page];
        await new Promise((r) => (tempImg.onload = r));
        const scaleX = page.getWidth() / tempImg.width;
        const scaleY = pageHeight / tempImg.height;

        const color = redactColor === "black" ? rgb(0, 0, 0) : rgb(1, 1, 1);

        page.drawRectangle({
          x: area.x * scaleX,
          y: pageHeight - (area.y + area.height) * scaleY,
          width: area.width * scaleX,
          height: area.height * scaleY,
          color,
        });
      }

      const bytes = await pdf.save();
      const blob = new Blob([bytes.slice().buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `redacted-${file?.name || "document.pdf"}`;
      a.click();
      URL.revokeObjectURL(url);
      setDone(true);
    } catch (err) {
      alert("Error: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setProcessing(false);
    }
  };

  const currentPageAreas = redactAreas.filter((a) => a.page === currentPage);

  return (
    <div className="tool-container" style={{ maxWidth: 1000 }}>
      <div className="text-center mb-10">
        <h1 className="page-title mb-3">Redact PDF</h1>
        <p className="page-desc">
          Redact text and graphics to permanently remove sensitive information from a PDF.
        </p>
      </div>

      {!file ? (
        <FileUpload accept=".pdf" onFilesSelected={handleFileSelected} label="Select PDF to Redact" />
      ) : (
        <div>
          {/* Controls */}
          <div className="bg-white border-2 border-gray-100 rounded-2xl p-4 mb-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-base font-semibold text-gray-700">
                Draw rectangles over areas to redact:
              </span>
              <div className="flex gap-2 items-center">
                <span className="text-sm text-gray-500">Color:</span>
                <button
                  onClick={() => setRedactColor("black")}
                  className={`w-8 h-8 rounded-lg border-2 transition ${
                    redactColor === "black" ? "border-red-500 ring-2 ring-red-200" : "border-gray-300"
                  }`}
                  style={{ backgroundColor: "#000" }}
                  title="Black redaction"
                />
                <button
                  onClick={() => setRedactColor("white")}
                  className={`w-8 h-8 rounded-lg border-2 transition ${
                    redactColor === "white" ? "border-red-500 ring-2 ring-red-200" : "border-gray-300"
                  }`}
                  style={{ backgroundColor: "#fff" }}
                  title="White redaction"
                />
              </div>
              <div className="ml-auto flex items-center gap-3">
                <span className="text-sm text-gray-500">
                  {redactAreas.length} area(s) marked
                </span>
                {redactAreas.length > 0 && (
                  <button
                    onClick={() => setRedactAreas([])}
                    className="text-sm text-red-500 hover:underline font-semibold"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Page navigation */}
          {pageImages.length > 1 && (
            <div className="flex gap-2 justify-center mb-6 flex-wrap">
              {pageImages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i)}
                  className={`px-5 py-2 rounded-xl text-base font-semibold border-2 transition ${
                    currentPage === i
                      ? "bg-red-500 text-white border-red-500"
                      : "bg-white text-gray-700 border-gray-200"
                  }`}
                >
                  Page {i + 1}
                </button>
              ))}
            </div>
          )}

          {/* PDF canvas with redaction drawing */}
          <div
            className="relative border-2 rounded-2xl overflow-hidden cursor-crosshair mb-6 select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <img
              src={pageImages[currentPage]}
              alt={`Page ${currentPage + 1}`}
              className="w-full pointer-events-none"
              draggable={false}
            />

            {/* Existing redact areas */}
            {currentPageAreas.map((area, i) => (
              <div
                key={i}
                className="absolute group"
                style={{
                  left: area.x,
                  top: area.y,
                  width: area.width,
                  height: area.height,
                  backgroundColor: redactColor === "black" ? "rgba(0,0,0,0.85)" : "rgba(255,255,255,0.9)",
                  border: redactColor === "black" ? "2px solid #333" : "2px solid #ccc",
                }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeArea(redactAreas.indexOf(area));
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs font-bold opacity-0 group-hover:opacity-100 transition shadow"
                >
                  x
                </button>
              </div>
            ))}

            {/* Temp drawing rect */}
            {tempRect && (
              <div
                className="absolute pointer-events-none"
                style={{
                  left: tempRect.x,
                  top: tempRect.y,
                  width: tempRect.w,
                  height: tempRect.h,
                  backgroundColor: redactColor === "black" ? "rgba(0,0,0,0.5)" : "rgba(200,200,200,0.5)",
                  border: "2px dashed #f00",
                }}
              />
            )}
          </div>

          {/* Apply button */}
          <div className="text-center">
            <button
              onClick={applyRedaction}
              disabled={processing || redactAreas.length === 0}
              className="btn-primary disabled:opacity-50"
            >
              {processing
                ? "Applying Redaction..."
                : `Redact & Download (${redactAreas.length} areas)`}
            </button>
          </div>

          {done && (
            <div className="success-msg mt-6 text-center">
              <p className="text-green-700 font-bold text-lg">
                PDF redacted and downloaded successfully!
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Redacted areas are permanently removed — content cannot be recovered.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
