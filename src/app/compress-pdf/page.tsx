"use client";

import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import FileUpload from "@/components/FileUpload";

export default function CompressPDF() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ original: number; compressed: number; url: string } | null>(null);

  const handleFileSelected = (files: File[]) => {
    setFile(files[0]);
    setResult(null);
  };

  const compressPDF = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const compressedBytes = await pdf.save({ useObjectStreams: true, addDefaultPage: false });
      const blob = new Blob([compressedBytes.slice().buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setResult({ original: file.size, compressed: compressedBytes.length, url });
    } catch (err) {
      alert("Error compressing PDF: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setProcessing(false);
    }
  };

  const downloadResult = () => {
    if (!result) return;
    const a = document.createElement("a");
    a.href = result.url;
    a.download = `compressed-${file?.name || "document.pdf"}`;
    a.click();
  };

  return (
    <div className="tool-container">
      <div className="text-center mb-10">
        <h1 className="page-title mb-3">Compress PDF</h1>
        <p className="page-desc">Reduce file size while optimizing for maximal PDF quality.</p>
      </div>

      {!file ? (
        <FileUpload accept=".pdf" onFilesSelected={handleFileSelected} label="Select PDF file" />
      ) : !result ? (
        <div className="text-center">
          <div className="file-card mb-8 inline-block">
            <p className="file-name">📄 {file.name}</p>
            <p className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
          <div>
            <button onClick={compressPDF} disabled={processing} className="btn-primary disabled:opacity-50">
              {processing ? "Compressing..." : "Compress PDF"}
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <div className="p-8 bg-green-50 rounded-2xl border-2 border-green-200 mb-8 inline-block">
            <p className="text-green-700 font-bold text-2xl mb-4">Compression Complete!</p>
            <div className="flex gap-10 justify-center text-base">
              <div>
                <p className="text-gray-400 text-sm mb-1">Original</p>
                <p className="font-bold text-xl">{(result.original / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <div className="text-3xl text-gray-300 flex items-center">→</div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Compressed</p>
                <p className="font-bold text-xl text-green-600">{(result.compressed / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Saved</p>
                <p className="font-bold text-xl text-green-600">
                  {(((result.original - result.compressed) / result.original) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
          <div>
            <button onClick={downloadResult} className="btn-success">Download Compressed PDF</button>
          </div>
        </div>
      )}
    </div>
  );
}
