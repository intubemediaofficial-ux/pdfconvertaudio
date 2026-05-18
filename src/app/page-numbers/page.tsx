"use client";

import { useState } from "react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import FileUpload from "@/components/FileUpload";

export default function PageNumbers() {
  const [file, setFile] = useState<File | null>(null);
  const [position, setPosition] = useState<"bottom-center" | "bottom-right" | "top-center" | "top-right">("bottom-center");
  const [fontSize, setFontSize] = useState(12);
  const [processing, setProcessing] = useState(false);

  const addPageNumbers = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      const pages = pdf.getPages();

      pages.forEach((page, i) => {
        const { width, height } = page.getSize();
        const text = `${i + 1} / ${pages.length}`;
        const textWidth = font.widthOfTextAtSize(text, fontSize);

        let x = 0, y = 0;
        if (position === "bottom-center") { x = (width - textWidth) / 2; y = 30; }
        else if (position === "bottom-right") { x = width - textWidth - 40; y = 30; }
        else if (position === "top-center") { x = (width - textWidth) / 2; y = height - 40; }
        else if (position === "top-right") { x = width - textWidth - 40; y = height - 40; }

        page.drawText(text, { x, y, size: fontSize, font, color: rgb(0, 0, 0) });
      });

      const bytes = await pdf.save();
      const blob = new Blob([bytes.slice().buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `numbered-${file.name}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Error: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="tool-container">
      <div className="text-center mb-10">
        <h1 className="page-title mb-3">Page Numbers</h1>
        <p className="page-desc">Add page numbers into PDFs with ease.</p>
      </div>

      {!file ? (
        <FileUpload accept=".pdf" onFilesSelected={(f) => setFile(f[0])} label="Select PDF file" />
      ) : (
        <div className="max-w-lg mx-auto space-y-6">
          <div className="file-card">
            <p className="file-name">📄 {file.name}</p>
          </div>
          <div>
            <label className="setting-label">Position</label>
            <div className="grid grid-cols-2 gap-3">
              {(["top-center", "top-right", "bottom-center", "bottom-right"] as const).map((pos) => (
                <button key={pos} onClick={() => setPosition(pos)}
                  className={`p-4 rounded-xl text-base font-semibold border-2 transition ${
                    position === pos ? "bg-red-500 text-white border-red-500" : "bg-white text-gray-700 border-gray-200 hover:border-red-200"
                  }`}>
                  {pos.replace("-", " ").replace(/\b\w/g, l => l.toUpperCase())}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="setting-label">Font Size: {fontSize}</label>
            <input type="range" min="8" max="24" value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))} className="w-full h-3 accent-red-500" />
          </div>
          <div className="text-center pt-4">
            <button onClick={addPageNumbers} disabled={processing} className="btn-primary disabled:opacity-50">
              {processing ? "Adding..." : "Add Page Numbers & Download"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
