"use client";

import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import FileUpload from "@/components/FileUpload";

export default function OrganizePDF() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [pageOrder, setPageOrder] = useState<number[]>([]);
  const [deletedPages, setDeletedPages] = useState<Set<number>>(new Set());
  const [processing, setProcessing] = useState(false);

  const handleFileSelected = async (files: File[]) => {
    const f = files[0];
    setFile(f);
    const ab = await f.arrayBuffer();
    const pdf = await PDFDocument.load(ab);
    const count = pdf.getPageCount();
    setPageCount(count);
    setPageOrder(Array.from({ length: count }, (_, i) => i));
    setDeletedPages(new Set());
  };

  const toggleDelete = (page: number) => {
    setDeletedPages((prev) => {
      const next = new Set(prev);
      if (next.has(page)) next.delete(page);
      else next.add(page);
      return next;
    });
  };

  const movePage = (from: number, to: number) => {
    setPageOrder((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(from, 1);
      updated.splice(to, 0, moved);
      return updated;
    });
  };

  const applyChanges = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const ab = await file.arrayBuffer();
      const sourcePdf = await PDFDocument.load(ab);
      const newPdf = await PDFDocument.create();

      const activePages = pageOrder.filter((p) => !deletedPages.has(p));
      const copiedPages = await newPdf.copyPages(sourcePdf, activePages);
      copiedPages.forEach((page) => newPdf.addPage(page));

      const bytes = await newPdf.save();
      const blob = new Blob([bytes.slice().buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `organized-${file.name}`;
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Organize PDF</h1>
        <p className="text-gray-600">Sort, delete, and rearrange pages in your PDF.</p>
      </div>

      {!file ? (
        <FileUpload accept=".pdf" onFilesSelected={handleFileSelected} label="Select PDF file" />
      ) : (
        <div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mb-6">
            {pageOrder.map((page, idx) => (
              <div key={page}
                className={`relative border-2 rounded-lg p-3 text-center cursor-pointer transition ${
                  deletedPages.has(page)
                    ? "border-red-300 bg-red-50 opacity-50"
                    : "border-gray-200 hover:border-blue-300"
                }`}>
                <div className="w-12 h-16 bg-gray-100 rounded mx-auto mb-2 flex items-center justify-center text-sm font-bold text-gray-500">
                  {page + 1}
                </div>
                <div className="flex gap-1 justify-center">
                  {idx > 0 && (
                    <button onClick={() => movePage(idx, idx - 1)} className="text-xs text-blue-500">←</button>
                  )}
                  <button onClick={() => toggleDelete(page)}
                    className={`text-xs ${deletedPages.has(page) ? "text-green-500" : "text-red-500"}`}>
                    {deletedPages.has(page) ? "Undo" : "Delete"}
                  </button>
                  {idx < pageOrder.length - 1 && (
                    <button onClick={() => movePage(idx, idx + 1)} className="text-xs text-blue-500">→</button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-gray-500 mb-4">
            {pageCount - deletedPages.size} of {pageCount} pages selected
          </p>

          <div className="text-center">
            <button onClick={applyChanges} disabled={processing} className="btn-primary disabled:opacity-50">
              {processing ? "Processing..." : "Apply & Download"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
