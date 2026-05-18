"use client";

import { useState } from "react";
import FileUpload from "@/components/FileUpload";

export default function PDFToWord() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  const handleFileSelected = (files: File[]) => {
    setFile(files[0]);
    setDone(false);
  };

  const convertToWord = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();

      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const paragraphs: { text: string; fontSize: number }[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        let pageText = "";
        let lastY: number | null = null;
        let currentFontSize = 12;

        for (const item of textContent.items) {
          if ("str" in item) {
            const y = item.transform[5];
            if (lastY !== null && Math.abs(y - lastY) > 5) {
              if (pageText.trim()) {
                paragraphs.push({ text: pageText.trim(), fontSize: currentFontSize });
              }
              pageText = "";
            }
            pageText += item.str;
            if (item.height) currentFontSize = Math.round(item.height);
            lastY = y;
          }
        }
        if (pageText.trim()) {
          paragraphs.push({ text: pageText.trim(), fontSize: currentFontSize });
        }
        if (i < pdf.numPages) {
          paragraphs.push({ text: "---PAGE BREAK---", fontSize: 12 });
        }
      }

      const docx = await import("docx");
      const children: (typeof docx.Paragraph.prototype)[] = [];

      for (const para of paragraphs) {
        if (para.text === "---PAGE BREAK---") {
          children.push(
            new docx.Paragraph({
              children: [],
              pageBreakBefore: true,
            })
          );
          continue;
        }

        const heading = para.fontSize >= 20
          ? docx.HeadingLevel.HEADING_1
          : para.fontSize >= 16
          ? docx.HeadingLevel.HEADING_2
          : para.fontSize >= 14
          ? docx.HeadingLevel.HEADING_3
          : undefined;

        children.push(
          new docx.Paragraph({
            heading,
            children: [
              new docx.TextRun({
                text: para.text,
                size: para.fontSize * 2,
              }),
            ],
          })
        );
      }

      const doc = new docx.Document({
        sections: [{ children }],
      });

      const blob = await docx.Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name.replace(/\.pdf$/i, ".docx");
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
        <h1 className="page-title mb-3">PDF to Word</h1>
        <p className="page-desc">Easily convert your PDF files into easy to edit DOC and DOCX documents.</p>
      </div>

      {!file ? (
        <FileUpload accept=".pdf" onFilesSelected={handleFileSelected} label="Select PDF file" />
      ) : (
        <div className="max-w-lg mx-auto text-center">
          <div className="file-card mb-8">
            <p className="file-name">📄 {file.name}</p>
            <p className="file-size">{(file.size / 1024).toFixed(1)} KB</p>
          </div>

          <button
            onClick={convertToWord}
            disabled={processing}
            className="btn-primary disabled:opacity-50"
          >
            {processing ? "Converting..." : "Convert to Word"}
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
