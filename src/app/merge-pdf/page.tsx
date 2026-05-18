"use client";

import { useState, useCallback } from "react";
import { PDFDocument } from "pdf-lib";
import FileUpload from "@/components/FileUpload";

export default function MergePDF() {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);

  const handleFilesSelected = useCallback((newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const moveFile = (from: number, to: number) => {
    setFiles((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(from, 1);
      updated.splice(to, 0, moved);
      return updated;
    });
  };

  const mergePDFs = async () => {
    if (files.length < 2) return;
    setProcessing(true);
    try {
      const mergedPdf = await PDFDocument.create();

      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(
          pdf,
          pdf.getPageIndices()
        );
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes.slice().buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "merged.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Error merging PDFs: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Merge PDF files
        </h1>
        <p className="text-gray-600">
          Combine PDFs in the order you want with the easiest PDF merger
          available.
        </p>
      </div>

      {files.length === 0 ? (
        <FileUpload
          accept=".pdf"
          multiple
          onFilesSelected={handleFilesSelected}
          label="Select PDF files"
          description="or drop PDF files here"
        />
      ) : (
        <div>
          <div className="space-y-2 mb-6">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center gap-3 p-3 bg-white rounded-lg border shadow-sm"
              >
                <span className="text-2xl">📄</span>
                <div className="flex-1">
                  <p className="font-medium text-sm">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <div className="flex gap-1">
                  {index > 0 && (
                    <button
                      onClick={() => moveFile(index, index - 1)}
                      className="p-1 text-gray-500 hover:text-gray-700"
                      title="Move up"
                    >
                      ↑
                    </button>
                  )}
                  {index < files.length - 1 && (
                    <button
                      onClick={() => moveFile(index, index + 1)}
                      className="p-1 text-gray-500 hover:text-gray-700"
                      title="Move down"
                    >
                      ↓
                    </button>
                  )}
                  <button
                    onClick={() => removeFile(index)}
                    className="p-1 text-red-500 hover:text-red-700"
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={() =>
                document.querySelector<HTMLInputElement>("#add-more")?.click()
              }
              className="btn-secondary"
            >
              + Add more files
            </button>
            <input
              id="add-more"
              type="file"
              accept=".pdf"
              multiple
              className="hidden"
              onChange={(e) => {
                const newFiles = Array.from(e.target.files || []);
                handleFilesSelected(newFiles);
                e.target.value = "";
              }}
            />
            <button
              onClick={mergePDFs}
              disabled={files.length < 2 || processing}
              className="btn-primary disabled:opacity-50"
            >
              {processing ? "Merging..." : "Merge PDFs"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
