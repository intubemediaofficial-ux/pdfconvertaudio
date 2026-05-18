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
    <div className="tool-container">
      <div className="text-center mb-10">
        <h1 className="page-title mb-3">Rotate PDF</h1>
        <p className="page-desc">Rotate your PDFs the way you need them.</p>
      </div>

      {!file ? (
        <FileUpload accept=".pdf" onFilesSelected={handleFileSelected} label="Select PDF file" />
      ) : (
        <div>
          <div className="flex gap-4 justify-center mb-8">
            <button onClick={() => rotateAll(90)} className="btn-secondary text-lg">Rotate All →</button>
            <button onClick={() => rotateAll(270)} className="btn-secondary text-lg">← Rotate All</button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 mb-8">
            {Array.from({ length: pageCount }).map((_, i) => (
              <div key={i}
                className="bg-white border-2 border-gray-100 rounded-2xl p-5 text-center cursor-pointer hover:border-red-200 transition shadow-sm"
                onClick={() => rotatePage(i)}
              >
                <div className="w-20 h-24 bg-gray-50 rounded-xl mx-auto mb-3 flex items-center justify-center text-base font-bold text-gray-400 transition-transform"
                  style={{ transform: `rotate(${rotations[i]}deg)` }}
                >
                  {i + 1}
                </div>
                <p className="text-base font-semibold text-gray-700">Page {i + 1}</p>
                <p className="text-sm text-red-500 font-bold mt-1">{rotations[i]}°</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <button onClick={applyRotation} disabled={processing} className="btn-primary disabled:opacity-50">
              {processing ? "Rotating..." : "Apply & Download"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
