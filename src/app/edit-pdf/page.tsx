"use client";

import { useState, useRef, useCallback } from "react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import FileUpload from "@/components/FileUpload";

interface TextAnnotation {
  page: number;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  color: string;
  bold: boolean;
}

interface ShapeAnnotation {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: "rect" | "circle";
  strokeColor: string;
  fillColor: string;
}

type ActiveTool = "text" | "shape" | "highlight" | "whiteout";

export default function EditPDF() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfBytes, setPdfBytes] = useState<ArrayBuffer | null>(null);
  const [pageImages, setPageImages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [activeTool, setActiveTool] = useState<ActiveTool>("text");
  const [textAnnotations, setTextAnnotations] = useState<TextAnnotation[]>([]);
  const [shapeAnnotations, setShapeAnnotations] = useState<ShapeAnnotation[]>([]);
  const [fontSize, setFontSize] = useState(16);
  const [textColor, setTextColor] = useState("#000000");
  const [isBold, setIsBold] = useState(false);
  const [shapeType, setShapeType] = useState<"rect" | "circle">("rect");
  const [processing, setProcessing] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  const handleFileSelected = useCallback(async (files: File[]) => {
    const f = files[0];
    setFile(f);
    const ab = await f.arrayBuffer();
    setPdfBytes(ab);

    const pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
    const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
    const imgs: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: ctx, viewport, canvas } as Parameters<typeof page.render>[0]).promise;
      imgs.push(canvas.toDataURL());
    }
    setPageImages(imgs);
  }, []);

  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (editingIndex !== null) {
      setEditingIndex(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === "text") {
      const newAnnotation: TextAnnotation = {
        page: currentPage,
        x,
        y,
        text: "Type here...",
        fontSize,
        color: textColor,
        bold: isBold,
      };
      setTextAnnotations((prev) => [...prev, newAnnotation]);
      setEditingIndex(textAnnotations.length);
    } else if (activeTool === "shape") {
      setShapeAnnotations((prev) => [
        ...prev,
        {
          page: currentPage,
          x,
          y,
          width: 120,
          height: 80,
          type: shapeType,
          strokeColor: textColor,
          fillColor: "transparent",
        },
      ]);
    } else if (activeTool === "whiteout") {
      setShapeAnnotations((prev) => [
        ...prev,
        {
          page: currentPage,
          x,
          y,
          width: 120,
          height: 30,
          type: "rect",
          strokeColor: "#ffffff",
          fillColor: "#ffffff",
        },
      ]);
    }
  };

  const updateTextAnnotation = (index: number, field: string, value: string | number | boolean) => {
    setTextAnnotations((prev) =>
      prev.map((a, i) => (i === index ? { ...a, [field]: value } : a))
    );
  };

  const deleteTextAnnotation = (index: number) => {
    setTextAnnotations((prev) => prev.filter((_, i) => i !== index));
    setEditingIndex(null);
  };

  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return { r, g, b };
  };

  const applyChanges = async () => {
    if (!pdfBytes) return;
    setProcessing(true);
    try {
      const pdf = await PDFDocument.load(pdfBytes);
      const fontRegular = await pdf.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
      const pages = pdf.getPages();

      for (const ann of textAnnotations) {
        const page = pages[ann.page];
        const { height: pageHeight } = page.getSize();

        const tempImg = new Image();
        tempImg.src = pageImages[ann.page];
        await new Promise((r) => (tempImg.onload = r));
        const scaleX = page.getWidth() / tempImg.width;
        const scaleY = pageHeight / tempImg.height;

        const c = hexToRgb(ann.color);
        page.drawText(ann.text, {
          x: ann.x * scaleX,
          y: pageHeight - ann.y * scaleY,
          size: ann.fontSize,
          font: ann.bold ? fontBold : fontRegular,
          color: rgb(c.r, c.g, c.b),
        });
      }

      for (const shape of shapeAnnotations) {
        const page = pages[shape.page];
        const { height: pageHeight } = page.getSize();

        const tempImg = new Image();
        tempImg.src = pageImages[shape.page];
        await new Promise((r) => (tempImg.onload = r));
        const scaleX = page.getWidth() / tempImg.width;
        const scaleY = pageHeight / tempImg.height;

        const sc = hexToRgb(shape.strokeColor);
        const fc = hexToRgb(shape.fillColor === "transparent" ? "#ffffff" : shape.fillColor);
        const isFilled = shape.fillColor !== "transparent";

        if (shape.type === "rect") {
          page.drawRectangle({
            x: shape.x * scaleX,
            y: pageHeight - (shape.y + shape.height) * scaleY,
            width: shape.width * scaleX,
            height: shape.height * scaleY,
            borderColor: rgb(sc.r, sc.g, sc.b),
            borderWidth: 1,
            color: isFilled ? rgb(fc.r, fc.g, fc.b) : undefined,
            opacity: isFilled ? 1 : 0,
          });
        } else {
          page.drawEllipse({
            x: (shape.x + shape.width / 2) * scaleX,
            y: pageHeight - (shape.y + shape.height / 2) * scaleY,
            xScale: (shape.width / 2) * scaleX,
            yScale: (shape.height / 2) * scaleY,
            borderColor: rgb(sc.r, sc.g, sc.b),
            borderWidth: 1,
            color: isFilled ? rgb(fc.r, fc.g, fc.b) : undefined,
            opacity: isFilled ? 1 : 0,
          });
        }
      }

      const bytes = await pdf.save();
      const blob = new Blob([bytes.slice().buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `edited-${file?.name || "document.pdf"}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Error: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">PDF Editor</h1>
        <p className="text-gray-600">
          Add text, images, shapes or freehand annotations to a PDF document.
        </p>
      </div>

      {!file ? (
        <FileUpload accept=".pdf" onFilesSelected={handleFileSelected} label="Select PDF file" />
      ) : (
        <div>
          {/* Toolbar */}
          <div className="sticky top-16 z-40 bg-white border rounded-lg p-3 mb-4 flex flex-wrap items-center gap-3 shadow-sm">
            <div className="flex gap-1">
              {(["text", "shape", "highlight", "whiteout"] as ActiveTool[]).map((tool) => (
                <button key={tool} onClick={() => setActiveTool(tool)}
                  className={`px-3 py-1.5 rounded text-sm font-medium capitalize ${
                    activeTool === tool ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}>
                  {tool === "text" ? "✏️ Text" : tool === "shape" ? "⬜ Shape" : tool === "highlight" ? "🖍️ Highlight" : "⬜ Whiteout"}
                </button>
              ))}
            </div>

            <div className="h-6 w-px bg-gray-300" />

            {activeTool === "text" && (
              <>
                <select value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))}
                  className="border rounded px-2 py-1 text-sm">
                  {[10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48].map((s) => (
                    <option key={s} value={s}>{s}px</option>
                  ))}
                </select>
                <button onClick={() => setIsBold(!isBold)}
                  className={`px-2 py-1 rounded font-bold text-sm ${isBold ? "bg-gray-800 text-white" : "bg-gray-100"}`}>
                  B
                </button>
              </>
            )}

            {activeTool === "shape" && (
              <div className="flex gap-1">
                <button onClick={() => setShapeType("rect")}
                  className={`px-2 py-1 rounded text-sm ${shapeType === "rect" ? "bg-blue-500 text-white" : "bg-gray-100"}`}>
                  Rectangle
                </button>
                <button onClick={() => setShapeType("circle")}
                  className={`px-2 py-1 rounded text-sm ${shapeType === "circle" ? "bg-blue-500 text-white" : "bg-gray-100"}`}>
                  Circle
                </button>
              </div>
            )}

            <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer" />

            <div className="ml-auto">
              <button onClick={applyChanges} disabled={processing}
                className="btn-success text-sm py-2 px-6 disabled:opacity-50">
                {processing ? "Applying..." : "Apply Changes"}
              </button>
            </div>
          </div>

          {/* Page Navigation */}
          {pageImages.length > 1 && (
            <div className="flex gap-2 justify-center mb-4 flex-wrap">
              {pageImages.map((_, i) => (
                <button key={i} onClick={() => setCurrentPage(i)}
                  className={`px-3 py-1 rounded text-sm ${currentPage === i ? "bg-red-500 text-white" : "bg-gray-100"}`}>
                  {i + 1}
                </button>
              ))}
            </div>
          )}

          {/* PDF Page with annotations */}
          <div ref={pageRef} className="relative border rounded-lg overflow-hidden cursor-crosshair shadow-lg"
            onClick={handlePageClick}>
            <img src={pageImages[currentPage]} alt={`Page ${currentPage + 1}`} className="w-full" />

            {/* Text annotations */}
            {textAnnotations
              .filter((a) => a.page === currentPage)
              .map((ann, idx) => {
                const globalIdx = textAnnotations.indexOf(ann);
                return (
                  <div key={`text-${idx}`} className="absolute" style={{ left: ann.x, top: ann.y - ann.fontSize }}
                    onClick={(e) => { e.stopPropagation(); setEditingIndex(globalIdx); }}>
                    {editingIndex === globalIdx ? (
                      <div className="bg-white border-2 border-blue-500 rounded p-1 shadow-lg">
                        <input
                          type="text"
                          value={ann.text}
                          onChange={(e) => updateTextAnnotation(globalIdx, "text", e.target.value)}
                          className="outline-none bg-transparent"
                          style={{
                            fontSize: ann.fontSize,
                            color: ann.color,
                            fontWeight: ann.bold ? "bold" : "normal",
                            minWidth: "100px",
                          }}
                          autoFocus
                        />
                        <button onClick={() => deleteTextAnnotation(globalIdx)}
                          className="ml-2 text-red-500 text-xs">Delete</button>
                      </div>
                    ) : (
                      <span className="cursor-pointer hover:bg-blue-50 hover:bg-opacity-50 px-1 rounded"
                        style={{
                          fontSize: ann.fontSize,
                          color: ann.color,
                          fontWeight: ann.bold ? "bold" : "normal",
                        }}>
                        {ann.text}
                      </span>
                    )}
                  </div>
                );
              })}

            {/* Shape annotations */}
            {shapeAnnotations
              .filter((s) => s.page === currentPage)
              .map((shape, idx) => (
                <div key={`shape-${idx}`} className="absolute pointer-events-none"
                  style={{
                    left: shape.x,
                    top: shape.y,
                    width: shape.width,
                    height: shape.height,
                    border: shape.fillColor === "#ffffff" ? "none" : `2px solid ${shape.strokeColor}`,
                    borderRadius: shape.type === "circle" ? "50%" : "0",
                    backgroundColor: shape.fillColor === "transparent" ? "transparent" : shape.fillColor,
                  }}
                />
              ))}
          </div>

          <p className="text-center text-sm text-gray-500 mt-4">
            Click anywhere on the PDF to add {activeTool}. Click on text to edit it.
          </p>
        </div>
      )}
    </div>
  );
}
