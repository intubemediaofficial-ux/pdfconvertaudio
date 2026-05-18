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
      const pages = pdf.getPages();

      for (const page of pages) {
        const { width, height } = page.getSize();
        page.setCropBox(
          margins.left,
          margins.bottom,
          width - margins.left - margins.right,
          height - margins.top - margins.bottom
        );
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
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Crop PDF</h1>
        <p className="text-gray-600">Crop margins of PDF documents.</p>
      </div>

      {!file ? (
        <FileUpload accept=".pdf" onFilesSelected={(f) => setFile(f[0])} label="Select PDF file" />
      ) : (
        <div className="max-w-md mx-auto space-y-4">
          <div className="p-4 bg-white rounded-lg border shadow-sm">
            <p className="font-medium">📄 {file.name}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {(["top", "right", "bottom", "left"] as const).map((side) => (
              <div key={side}>
                <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{side} (pt)</label>
                <input type="number" value={margins[side]}
                  onChange={(e) => setMargins((prev) => ({ ...prev, [side]: parseInt(e.target.value) || 0 }))}
                  className="w-full p-2 border rounded-md" min="0" />
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
