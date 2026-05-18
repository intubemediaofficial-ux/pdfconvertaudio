"use client";

import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import FileUpload from "@/components/FileUpload";

export default function ProtectPDF() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  const handleFileSelected = (files: File[]) => {
    setFile(files[0]);
    setDone(false);
  };

  const protectPDF = async () => {
    if (!file || !password) return;
    setProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);

      const title = pdf.getTitle() || file.name;
      pdf.setTitle(title);

      const bytes = await pdf.save();

      const { encryptPdf } = await import("@/lib/pdf-encrypt");
      const encryptedBytes = await encryptPdf(new Uint8Array(bytes), password);

      const blob = new Blob([encryptedBytes.slice().buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `protected-${file.name}`;
      a.click();
      URL.revokeObjectURL(url);
      setDone(true);
    } catch (err) {
      alert("Error: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="tool-container">
      <div className="text-center mb-10">
        <h1 className="page-title mb-3">Protect PDF</h1>
        <p className="page-desc">Protect PDF files with a password. Encrypt PDF documents to prevent unauthorized access.</p>
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
            <label className="setting-label">Set Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="input-field"
            />
          </div>

          <div className="text-center">
            <button
              onClick={protectPDF}
              disabled={processing || !password}
              className="btn-primary disabled:opacity-50"
            >
              {processing ? "Protecting..." : "Protect PDF"}
            </button>
          </div>

          {done && (
            <div className="success-msg mt-6">
              <p className="text-green-700 font-bold text-lg">PDF protected and downloaded!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
