"use client";

import { useState } from "react";
import { PDFDocument, degrees } from "pdf-lib";
import FileUpload from "@/components/FileUpload";

export default function RotatePDF() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [rotations, setRotations] = useState<number[]>([]);
  const [processing, setProcessing] = useState(false);

  const handleFileSelected = async (files: File[]) => {
    const f = files[0];
    setFile(f);
    const arrayBuffer = await f.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const count = pdf.getPageCount();
    setPageCount(count);
    setRotations(new Array(count).fill(0));
  };

  const rotatePage = (index: number) => {
    setRotations((prev) => {
      const updated = [...prev];
      updated[index] = (updated[index] + 90) % 360;
      return updated;
    });
  };

  const rotateAll = (angle: number) => {
    setRotations((prev) => prev.map((r) => (r + angle) % 360));
  };

  const applyRotation = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);

      pdf.getPages().forEach((page, i) => {
        if (rotations[i] !== 0) {
          page.setRotation(degrees(page.getRotation().angle + rotations[i]));
        }
      });

      const bytes = await pdf.save();
      const blob = new Blob([bytes.slice().buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rotated-${file.name}`;
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Rotate PDF</h1>
        <p className="text-gray-600">
          Rotate your PDFs the way you need them.
        </p>
      </div>

      {!file ? (
        <FileUpload accept=".pdf" onFilesSelected={handleFileSelected} label="Select PDF file" />
      ) : (
        <div>
          <div className="flex gap-3 justify-center mb-6">
            <button onClick={() => rotateAll(90)} className="btn-secondary">
              Rotate All →
            </button>
            <button onClick={() => rotateAll(270)} className="btn-secondary">
              ← Rotate All
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: pageCount }).map((_, i) => (
              <div
                key={i}
                className="border rounded-lg p-3 text-center cursor-pointer hover:border-red-300 transition"
                onClick={() => rotatePage(i)}
              >
                <div
                  className="w-16 h-20 bg-gray-100 rounded mx-auto mb-2 flex items-center justify-center text-xs font-bold text-gray-400 transition-transform"
                  style={{ transform: `rotate(${rotations[i]}deg)` }}
                >
                  {i + 1}
                </div>
                <p className="text-xs text-gray-600">Page {i + 1}</p>
                <p className="text-xs text-red-500 font-medium">
                  {rotations[i]}°
                </p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <button
              onClick={applyRotation}
              disabled={processing}
              className="btn-primary disabled:opacity-50"
            >
              {processing ? "Rotating..." : "Apply & Download"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
