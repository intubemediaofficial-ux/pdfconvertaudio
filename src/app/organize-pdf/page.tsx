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
      if (next.has(page)) next.delete(page); else next.add(page);
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
    <div className="tool-container">
      <div className="text-center mb-10">
        <h1 className="page-title mb-3">Organize PDF</h1>
        <p className="page-desc">Sort, delete, and rearrange pages in your PDF.</p>
      </div>

      {!file ? (
        <FileUpload accept=".pdf" onFilesSelected={handleFileSelected} label="Select PDF file" />
      ) : (
        <div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 mb-8">
            {pageOrder.map((page, idx) => (
              <div key={page}
                className={`relative bg-white border-2 rounded-2xl p-4 text-center cursor-pointer transition shadow-sm ${
                  deletedPages.has(page) ? "border-red-300 bg-red-50 opacity-50" : "border-gray-100 hover:border-blue-300"
                }`}>
                <div className="w-14 h-18 bg-gray-50 rounded-xl mx-auto mb-3 flex items-center justify-center text-base font-bold text-gray-500">
                  {page + 1}
                </div>
                <div className="flex gap-2 justify-center">
                  {idx > 0 && (
                    <button onClick={() => movePage(idx, idx - 1)} className="text-base text-blue-500 font-bold hover:text-blue-700">←</button>
                  )}
                  <button onClick={() => toggleDelete(page)}
                    className={`text-base font-semibold ${deletedPages.has(page) ? "text-green-500" : "text-red-500"}`}>
                    {deletedPages.has(page) ? "Undo" : "Delete"}
                  </button>
                  {idx < pageOrder.length - 1 && (
                    <button onClick={() => movePage(idx, idx + 1)} className="text-base text-blue-500 font-bold hover:text-blue-700">→</button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-base text-gray-500 mb-6 font-medium">
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
