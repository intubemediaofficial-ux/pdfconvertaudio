"use client";

import { useState, useRef } from "react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export default function HTMLToPDF() {
  const [htmlContent, setHtmlContent] = useState("");
  const [mode, setMode] = useState<"paste" | "file">("paste");
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setHtmlContent(text);
  };

  const convertToPDF = async () => {
    if (!htmlContent.trim()) return;
    setProcessing(true);
    try {
      const container = document.createElement("div");
      container.innerHTML = htmlContent;
      container.style.cssText = "position:absolute;left:-9999px;top:-9999px;width:595px;font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#000;";
      document.body.appendChild(container);

      const textContent = container.innerText || container.textContent || "";
      document.body.removeChild(container);

      const pdf = await PDFDocument.create();
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);
      const fontSize = 12;
      const margin = 50;
      const lineHeight = fontSize * 1.5;
      const pageWidth = 595;
      const pageHeight = 842;
      const maxTextWidth = pageWidth - margin * 2;

      let page = pdf.addPage([pageWidth, pageHeight]);
      let y = pageHeight - margin;

      const lines = textContent.split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
          y -= lineHeight;
          if (y < margin) {
            page = pdf.addPage([pageWidth, pageHeight]);
            y = pageHeight - margin;
          }
          continue;
        }

        const isHeading = trimmed.length < 80 && trimmed === trimmed.toUpperCase() && trimmed.length > 2;
        const currentFont = isHeading ? boldFont : font;
        const currentSize = isHeading ? 16 : fontSize;

        const words = trimmed.split(" ");
        let currentLine = "";

        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const width = currentFont.widthOfTextAtSize(testLine, currentSize);
          if (width > maxTextWidth && currentLine) {
            if (y < margin + lineHeight) {
              page = pdf.addPage([pageWidth, pageHeight]);
              y = pageHeight - margin;
            }
            page.drawText(currentLine, {
              x: margin,
              y,
              size: currentSize,
              font: currentFont,
              color: rgb(0, 0, 0),
            });
            y -= currentSize * 1.5;
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }

        if (currentLine) {
          if (y < margin + lineHeight) {
            page = pdf.addPage([pageWidth, pageHeight]);
            y = pageHeight - margin;
          }
          page.drawText(currentLine, {
            x: margin,
            y,
            size: currentSize,
            font: currentFont,
            color: rgb(0, 0, 0),
          });
          y -= currentSize * 1.5;
        }
      }

      const bytes = await pdf.save();
      const blob = new Blob([bytes.slice().buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "converted.pdf";
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
        <h1 className="page-title mb-3">HTML to PDF</h1>
        <p className="page-desc">Convert HTML code to PDF documents instantly.</p>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="flex gap-4 justify-center mb-8">
          <button
            onClick={() => setMode("paste")}
            className={`px-6 py-3 rounded-xl text-base font-semibold border-2 transition ${mode === "paste" ? "bg-red-500 text-white border-red-500" : "bg-white text-gray-700 border-gray-200 hover:border-red-200"}`}
          >
            Paste HTML
          </button>
          <button
            onClick={() => setMode("file")}
            className={`px-6 py-3 rounded-xl text-base font-semibold border-2 transition ${mode === "file" ? "bg-red-500 text-white border-red-500" : "bg-white text-gray-700 border-gray-200 hover:border-red-200"}`}
          >
            Upload HTML File
          </button>
        </div>

        {mode === "file" ? (
          <div className="text-center mb-6">
            <input
              ref={fileInputRef}
              type="file"
              accept=".html,.htm"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-secondary"
            >
              Select HTML File
            </button>
            {htmlContent && (
              <p className="text-base text-green-600 mt-3 font-medium">File loaded ({htmlContent.length} characters)</p>
            )}
          </div>
        ) : (
          <textarea
            value={htmlContent}
            onChange={(e) => setHtmlContent(e.target.value)}
            className="w-full h-72 p-5 border-2 border-gray-200 rounded-2xl font-mono text-base mb-8 resize-y focus:border-red-300 focus:outline-none transition"
            placeholder="<html>
<head><title>My Page</title></head>
<body>
  <h1>Hello World</h1>
  <p>Paste your HTML content here...</p>
</body>
</html>"
          />
        )}

        <div className="text-center">
          <button
            onClick={convertToPDF}
            disabled={processing || !htmlContent.trim()}
            className="btn-primary disabled:opacity-50"
          >
            {processing ? "Converting..." : "Convert to PDF"}
          </button>
        </div>

        {done && (
          <div className="success-msg mt-6">
            <p className="text-green-700 font-bold text-lg">Converted and downloaded!</p>
          </div>
        )}
      </div>
    </div>
  );
}
