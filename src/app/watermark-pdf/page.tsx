"use client";

import { useState } from "react";
import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";
import FileUpload from "@/components/FileUpload";

export default function WatermarkPDF() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("CONFIDENTIAL");
  const [fontSize, setFontSize] = useState(48);
  const [opacity, setOpacity] = useState(0.3);
  const [processing, setProcessing] = useState(false);

  const addWatermark = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const font = await pdf.embedFont(StandardFonts.HelveticaBold);

      const pages = pdf.getPages();
      for (const page of pages) {
        const { width, height } = page.getSize();
        const textWidth = font.widthOfTextAtSize(text, fontSize);
        page.drawText(text, {
          x: (width - textWidth) / 2,
          y: height / 2,
          size: fontSize,
          font,
          color: rgb(0.5, 0.5, 0.5),
          opacity,
          rotate: degrees(-45),
        });
      }

      const bytes = await pdf.save();
      const blob = new Blob([bytes.slice().buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `watermarked-${file.name}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Error: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Watermark PDF</h1>
        <p className="text-gray-600">
          Stamp text over your PDF in seconds.
        </p>
      </div>

      {!file ? (
        <FileUpload accept=".pdf" onFilesSelected={(f) => setFile(f[0])} label="Select PDF file" />
      ) : (
        <div className="max-w-md mx-auto space-y-4">
          <div className="p-4 bg-white rounded-lg border shadow-sm">
            <p className="font-medium">📄 {file.name}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Watermark Text</label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full p-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Font Size: {fontSize}</label>
            <input
              type="range"
              min="12"
              max="120"
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Opacity: {(opacity * 100).toFixed(0)}%</label>
            <input
              type="range"
              min="0.05"
              max="1"
              step="0.05"
              value={opacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="text-center pt-4">
            <button onClick={addWatermark} disabled={processing} className="btn-primary disabled:opacity-50">
              {processing ? "Adding watermark..." : "Add Watermark & Download"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
