"use client";

import { useState } from "react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import FileUpload from "@/components/FileUpload";

export default function PPTToPDF() {
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
      const JSZip = (await import("jszip")).default;
      const zip = await JSZip.loadAsync(arrayBuffer);

      const slideFiles = Object.keys(zip.files)
        .filter((name) => name.match(/ppt\/slides\/slide\d+\.xml$/))
        .sort((a, b) => {
          const numA = parseInt(a.match(/slide(\d+)/)?.[1] || "0");
          const numB = parseInt(b.match(/slide(\d+)/)?.[1] || "0");
          return numA - numB;
        });

      const pdf = await PDFDocument.create();
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);

      for (let slideIdx = 0; slideIdx < slideFiles.length; slideIdx++) {
        const slideXml = await zip.files[slideFiles[slideIdx]].async("string");
        const page = pdf.addPage([960, 540]);

        page.drawRectangle({
          x: 0,
          y: 0,
          width: 960,
          height: 540,
          color: rgb(1, 1, 1),
        });

        const textMatches = slideXml.match(/<a:t>([^<]*)<\/a:t>/g) || [];
        const texts = textMatches.map((m) => m.replace(/<\/?a:t>/g, "").trim()).filter(Boolean);

        let y = 490;
        const isTitle = slideIdx === 0;

        for (let i = 0; i < texts.length; i++) {
          const text = texts[i];
          const useFont = i === 0 ? boldFont : font;
          const size = i === 0 ? (isTitle ? 28 : 22) : 14;

          if (y < 40) break;

          const maxWidth = 880;
          const words = text.split(" ");
          let line = "";

          for (const word of words) {
            const testLine = line ? `${line} ${word}` : word;
            const width = useFont.widthOfTextAtSize(testLine, size);
            if (width > maxWidth && line) {
              page.drawText(line, { x: 40, y, size, font: useFont, color: rgb(0.1, 0.1, 0.1) });
              y -= size * 1.5;
              line = word;
            } else {
              line = testLine;
            }
          }
          if (line && y > 40) {
            page.drawText(line, { x: 40, y, size, font: useFont, color: rgb(0.1, 0.1, 0.1) });
            y -= size * 1.8;
          }
        }

        page.drawText(`Slide ${slideIdx + 1}`, {
          x: 880,
          y: 15,
          size: 10,
          font,
          color: rgb(0.6, 0.6, 0.6),
        });
      }

      const bytes = await pdf.save();
      const blob = new Blob([bytes.slice().buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name.replace(/\.(pptx?|ppt)$/i, ".pdf");
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
        <h1 className="page-title mb-3">PowerPoint to PDF</h1>
        <p className="page-desc">Make PPT and PPTX slideshows easy to view by converting them to PDF.</p>
      </div>

      {!file ? (
        <FileUpload
          accept=".ppt,.pptx"
          onFilesSelected={handleFileSelected}
          label="Select PowerPoint file"
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
