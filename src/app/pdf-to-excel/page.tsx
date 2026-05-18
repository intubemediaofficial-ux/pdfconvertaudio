"use client";

import { useState } from "react";
import FileUpload from "@/components/FileUpload";

export default function PDFToExcel() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  const handleFileSelected = (files: File[]) => {
    setFile(files[0]);
    setDone(false);
  };

  const convertToExcel = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();

      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const XLSX = await import("xlsx");

      const workbook = XLSX.utils.book_new();

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        const items = textContent.items.filter(
          (item): item is Extract<typeof item, { str: string; transform: number[] }> =>
            "str" in item && "transform" in item
        );

        const rows: { y: number; items: { x: number; text: string }[] }[] = [];
        for (const item of items) {
          const y = Math.round(item.transform[5]);
          const x = Math.round(item.transform[4]);
          let row = rows.find((r) => Math.abs(r.y - y) < 5);
          if (!row) {
            row = { y, items: [] };
            rows.push(row);
          }
          row.items.push({ x, text: item.str });
        }

        rows.sort((a, b) => b.y - a.y);
        rows.forEach((row) => row.items.sort((a, b) => a.x - b.x));

        const data: string[][] = rows.map((row) => {
          const cols: string[] = [];
          let lastX = -1;
          for (const item of row.items) {
            if (lastX >= 0 && item.x - lastX > 50) {
              while (cols.length < Math.floor((item.x - lastX) / 80) + cols.length) {
                cols.push("");
                break;
              }
            }
            cols.push(item.text);
            lastX = item.x;
          }
          return cols;
        });

        const ws = XLSX.utils.aoa_to_sheet(data);
        XLSX.utils.book_append_sheet(workbook, ws, `Page ${i}`);
      }

      const xlsxBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const blob = new Blob([xlsxBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name.replace(/\.pdf$/i, ".xlsx");
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
        <h1 className="page-title mb-3">PDF to Excel</h1>
        <p className="page-desc">Pull data straight from PDFs into Excel spreadsheets in a few short seconds.</p>
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
            onClick={convertToExcel}
            disabled={processing}
            className="btn-primary disabled:opacity-50"
          >
            {processing ? "Converting..." : "Convert to Excel"}
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
