"use client";

import { useState } from "react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import FileUpload from "@/components/FileUpload";

export default function WordToPDF() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  const handleFileSelected = (files: File[]) => {
    setFile(files[0]);
    setDone(false);
  };

  const convertToPDF = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuffer);

      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ arrayBuffer });
      const text = result.value
        .replace(/\t/g, "    ")
        .replace(/[^\n\r\x20-\x7E\xA0-\xFF]/g, "");

      const pdf = await PDFDocument.create();
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      const fontSize = 12;
      const margin = 50;
      const lineHeight = fontSize * 1.4;

      const lines = text.split("\n");
      let page = pdf.addPage([595, 842]);
      let y = 842 - margin;

      for (const line of lines) {
        const words = line.split(" ");
        let currentLine = "";

        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const width = font.widthOfTextAtSize(testLine, fontSize);

          if (width > 595 - margin * 2 && currentLine) {
            if (y < margin + lineHeight) {
              page = pdf.addPage([595, 842]);
              y = 842 - margin;
            }
            page.drawText(currentLine, { x: margin, y, size: fontSize, font, color: rgb(0, 0, 0) });
            y -= lineHeight;
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }

        if (currentLine) {
          if (y < margin + lineHeight) {
            page = pdf.addPage([595, 842]);
            y = 842 - margin;
          }
          page.drawText(currentLine, { x: margin, y, size: fontSize, font, color: rgb(0, 0, 0) });
          y -= lineHeight;
        } else {
          y -= lineHeight;
        }
      }

      void uint8;

      const bytes = await pdf.save();
      const blob = new Blob([bytes.slice().buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name.replace(/\.(docx?|txt)$/i, ".pdf");
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
        <h1 className="page-title mb-3">Word to PDF</h1>
        <p className="page-desc">Make DOC and DOCX files easy to read by converting them to PDF.</p>
      </div>

      {!file ? (
        <FileUpload
          accept=".doc,.docx"
          onFilesSelected={handleFileSelected}
          label="Select Word file"
        />
      ) : (
        <div className="max-w-lg mx-auto text-center">
          <div className="file-card mb-8">
            <p className="file-name">📄 {file.name}</p>
            <p className="file-size">{(file.size / 1024).toFixed(1)} KB</p>
          </div>

          <button
            onClick={convertToPDF}
            disabled={processing}
            className="btn-primary disabled:opacity-50"
          >
            {processing ? "Converting..." : "Convert to PDF"}
          </button>

          {done && (
            <div className="success-msg mt-6">
              <p className="text-green-700 font-bold text-lg">Converted and downloaded!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
