"use client";

import { useState } from "react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import FileUpload from "@/components/FileUpload";

export default function ExcelToPDF() {
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
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(arrayBuffer, { type: "array" });

      const pdf = await PDFDocument.create();
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);
      const fontSize = 10;
      const margin = 40;
      const rowHeight = 20;

      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const data: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        if (data.length === 0) continue;

        const maxCols = Math.max(...data.map((r) => r.length));
        const colWidth = (595 - margin * 2) / Math.max(maxCols, 1);

        let page = pdf.addPage([595, 842]);
        let y = 842 - margin;

        page.drawText(`Sheet: ${sheetName}`, {
          x: margin,
          y,
          size: 14,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
        y -= 25;

        for (let rowIdx = 0; rowIdx < data.length; rowIdx++) {
          if (y < margin + rowHeight) {
            page = pdf.addPage([595, 842]);
            y = 842 - margin;
          }

          const row = data[rowIdx];
          const isHeader = rowIdx === 0;
          const currentFont = isHeader ? boldFont : font;

          if (isHeader) {
            page.drawRectangle({
              x: margin,
              y: y - 5,
              width: 595 - margin * 2,
              height: rowHeight,
              color: rgb(0.9, 0.9, 0.95),
            });
          }

          for (let colIdx = 0; colIdx < maxCols; colIdx++) {
            const cellText = String(row[colIdx] ?? "");
            const truncated = cellText.length > 20 ? cellText.slice(0, 18) + ".." : cellText;
            page.drawText(truncated, {
              x: margin + colIdx * colWidth + 4,
              y: y,
              size: fontSize,
              font: currentFont,
              color: rgb(0, 0, 0),
            });
          }

          page.drawLine({
            start: { x: margin, y: y - 5 },
            end: { x: 595 - margin, y: y - 5 },
            thickness: 0.5,
            color: rgb(0.8, 0.8, 0.8),
          });

          y -= rowHeight;
        }
      }

      const bytes = await pdf.save();
      const blob = new Blob([bytes.slice().buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name.replace(/\.(xlsx?|csv)$/i, ".pdf");
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
        <h1 className="page-title mb-3">Excel to PDF</h1>
        <p className="page-desc">Make EXCEL spreadsheets easy to read by converting them to PDF.</p>
      </div>

      {!file ? (
        <FileUpload
          accept=".xls,.xlsx,.csv"
          onFilesSelected={handleFileSelected}
          label="Select Excel file"
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
