"use client";

import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import FileUpload from "@/components/FileUpload";

export default function SplitPDF() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [splitMode, setSplitMode] = useState<"range" | "extract">("range");
  const [ranges, setRanges] = useState("1-3, 4-6");
  const [processing, setProcessing] = useState(false);

  const handleFileSelected = async (files: File[]) => {
    const f = files[0];
    setFile(f);
    const arrayBuffer = await f.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    setPageCount(pdf.getPageCount());
    setRanges(`1-${pdf.getPageCount()}`);
  };

  const splitPDF = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const sourcePdf = await PDFDocument.load(arrayBuffer);

      if (splitMode === "extract") {
        for (let i = 0; i < sourcePdf.getPageCount(); i++) {
          const newPdf = await PDFDocument.create();
          const [page] = await newPdf.copyPages(sourcePdf, [i]);
          newPdf.addPage(page);
          const bytes = await newPdf.save();
          const blob = new Blob([bytes.slice().buffer as ArrayBuffer], { type: "application/pdf" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `page-${i + 1}.pdf`;
          a.click();
          URL.revokeObjectURL(url);
        }
      } else {
        const parts = ranges.split(",").map((r) => r.trim());
        for (const part of parts) {
          const match = part.match(/^(\d+)\s*-\s*(\d+)$/);
          if (match) {
            const start = parseInt(match[1]) - 1;
            const end = parseInt(match[2]) - 1;
            const newPdf = await PDFDocument.create();
            const indices = [];
            for (let i = start; i <= end && i < sourcePdf.getPageCount(); i++) {
              indices.push(i);
            }
            const pages = await newPdf.copyPages(sourcePdf, indices);
            pages.forEach((p) => newPdf.addPage(p));
            const bytes = await newPdf.save();
            const blob = new Blob([bytes.slice().buffer as ArrayBuffer], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `pages-${part.replace(/\s/g, "")}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
          }
        }
      }
    } catch (err) {
      alert("Error splitting PDF: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Split PDF file
        </h1>
        <p className="text-gray-600">
          Separate one page or a whole set for easy conversion into independent
          PDF files.
        </p>
      </div>

      {!file ? (
        <FileUpload
          accept=".pdf"
          onFilesSelected={handleFileSelected}
          label="Select PDF file"
        />
      ) : (
        <div className="max-w-md mx-auto">
          <div className="p-4 bg-white rounded-lg border shadow-sm mb-6">
            <p className="font-medium">📄 {file.name}</p>
            <p className="text-sm text-gray-500">{pageCount} pages</p>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={splitMode === "range"}
                  onChange={() => setSplitMode("range")}
                  className="accent-red-500"
                />
                <span className="text-sm font-medium">Split by range</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={splitMode === "extract"}
                  onChange={() => setSplitMode("extract")}
                  className="accent-red-500"
                />
                <span className="text-sm font-medium">
                  Extract all pages
                </span>
              </label>
            </div>

            {splitMode === "range" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Page ranges (e.g., 1-3, 4-6, 7-10):
                </label>
                <input
                  type="text"
                  value={ranges}
                  onChange={(e) => setRanges(e.target.value)}
                  className="w-full p-2 border rounded-md text-sm"
                  placeholder="1-3, 4-6"
                />
              </div>
            )}
          </div>

          <div className="text-center">
            <button
              onClick={splitPDF}
              disabled={processing}
              className="btn-primary disabled:opacity-50"
            >
              {processing ? "Splitting..." : "Split PDF"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
