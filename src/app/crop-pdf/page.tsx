"use client";

import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import FileUpload from "@/components/FileUpload";

export default function CropPDF() {
  const [file, setFile] = useState<File | null>(null);
  const [margins, setMargins] = useState({ top: 0, right: 0, bottom: 0, left: 0 });
  const [processing, setProcessing] = useState(false);

  const cropPDF = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const ab = await file.arrayBuffer();
      const pdf = await PDFDocument.load(ab);
      for (const page of pdf.getPages()) {
        const { width, height } = page.getSize();
        page.setCropBox(margins.left, margins.bottom, width - margins.left - margins.right, height - margins.top - margins.bottom);
      }
      const bytes = await pdf.save();
      const blob = new Blob([bytes.slice().buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cropped-${file.name}`;
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
        <h1 className="page-title mb-3">Crop PDF</h1>
        <p className="page-desc">Crop margins of PDF documents.</p>
      </div>

      {!file ? (
        <FileUpload accept=".pdf" onFilesSelected={(f) => setFile(f[0])} label="Select PDF file" />
      ) : (
        <div className="max-w-lg mx-auto space-y-6">
          <div className="file-card">
            <p className="file-name">📄 {file.name}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {(["top", "right", "bottom", "left"] as const).map((side) => (
              <div key={side}>
                <label className="setting-label capitalize">{side} (pt)</label>
                <input type="number" value={margins[side]}
                  onChange={(e) => setMargins((prev) => ({ ...prev, [side]: parseInt(e.target.value) || 0 }))}
                  className="input-field" min="0" />
              </div>
            ))}
          </div>

          <div className="text-center pt-4">
            <button onClick={cropPDF} disabled={processing} className="btn-primary disabled:opacity-50">
              {processing ? "Cropping..." : "Crop & Download"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
