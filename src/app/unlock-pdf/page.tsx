"use client";

import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import FileUpload from "@/components/FileUpload";

export default function UnlockPDF() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleFileSelected = (files: File[]) => {
    setFile(files[0]);
    setError("");
    setDone(false);
  };

  const unlockPDF = async () => {
    if (!file) return;
    setProcessing(true);
    setError("");
    try {
      const arrayBuffer = await file.arrayBuffer();

      const pdf = await PDFDocument.load(arrayBuffer, {
        ignoreEncryption: true,
      } as Parameters<typeof PDFDocument.load>[1]);

      const newPdf = await PDFDocument.create();
      const pages = await newPdf.copyPages(pdf, pdf.getPageIndices());
      pages.forEach((page) => newPdf.addPage(page));

      const bytes = await newPdf.save();
      const blob = new Blob([bytes.slice().buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `unlocked-${file.name}`;
      a.click();
      URL.revokeObjectURL(url);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unlock PDF. Check your password.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="tool-container">
      <div className="text-center mb-10">
        <h1 className="page-title mb-3">Unlock PDF</h1>
        <p className="page-desc">Remove PDF password security, giving you the freedom to use your PDFs as you want.</p>
      </div>

      {!file ? (
        <FileUpload accept=".pdf" onFilesSelected={handleFileSelected} label="Select PDF file" />
      ) : (
        <div className="max-w-lg mx-auto">
          <div className="file-card mb-6">
            <p className="file-name">📄 {file.name}</p>
            <p className="file-size">{(file.size / 1024).toFixed(1)} KB</p>
          </div>

          <div className="mb-6">
            <label className="setting-label">PDF Password (if required):</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password (leave blank if none)"
              className="input-field"
            />
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-2xl">
              <p className="text-red-700 text-base font-medium">{error}</p>
            </div>
          )}

          <div className="text-center">
            <button
              onClick={unlockPDF}
              disabled={processing}
              className="btn-primary disabled:opacity-50"
            >
              {processing ? "Unlocking..." : "Unlock PDF"}
            </button>
          </div>

          {done && (
            <div className="success-msg mt-6">
              <p className="text-green-700 font-bold text-lg">PDF unlocked and downloaded!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
