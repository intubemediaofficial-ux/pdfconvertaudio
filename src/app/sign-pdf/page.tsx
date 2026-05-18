"use client";

import { useState, useRef, useEffect } from "react";
import { PDFDocument } from "pdf-lib";
import FileUpload from "@/components/FileUpload";

export default function SignPDF() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfBytes, setPdfBytes] = useState<ArrayBuffer | null>(null);
  const [pageImages, setPageImages] = useState<string[]>([]);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [signMode, setSignMode] = useState<"draw" | "type">("draw");
  const [typedName, setTypedName] = useState("");
  const [signatures, setSignatures] = useState<
    { page: number; x: number; y: number; width: number; height: number; data: string }[]
  >([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [processing, setProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);

  const handleFileSelected = async (files: File[]) => {
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
  };

  const startDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";

    const getPos = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const onDown = (e: MouseEvent | TouchEvent) => {
      drawingRef.current = true;
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    };
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!drawingRef.current) return;
      e.preventDefault();
      const pos = getPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    };
    const onUp = () => { drawingRef.current = false; };

    canvas.onmousedown = onDown;
    canvas.onmousemove = onMove;
    canvas.onmouseup = onUp;
    canvas.ontouchstart = onDown;
    canvas.ontouchmove = onMove;
    canvas.ontouchend = onUp;
  };

  useEffect(() => {
    if (signMode === "draw" && canvasRef.current) {
      startDrawing();
    }
  }, [signMode, file]);

  const saveSignature = () => {
    if (signMode === "draw") {
      const canvas = canvasRef.current;
      if (!canvas) return;
      setSignatureData(canvas.toDataURL());
    } else {
      const canvas = document.createElement("canvas");
      canvas.width = 300;
      canvas.height = 80;
      const ctx = canvas.getContext("2d")!;
      ctx.font = "italic 36px 'Georgia', serif";
      ctx.fillStyle = "#000";
      ctx.fillText(typedName, 10, 55);
      setSignatureData(canvas.toDataURL());
    }
  };

  const placeSignature = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!signatureData) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setSignatures((prev) => [
      ...prev,
      { page: currentPage, x, y, width: 150, height: 50, data: signatureData },
    ]);
  };

  const applySignatures = async () => {
    if (!pdfBytes || signatures.length === 0) return;
    setProcessing(true);
    try {
      const pdf = await PDFDocument.load(pdfBytes);
      const pages = pdf.getPages();

      for (const sig of signatures) {
        const page = pages[sig.page];
        const { height: pageHeight } = page.getSize();
        const tempImg = new Image();
        tempImg.src = pageImages[sig.page];
        await new Promise((r) => (tempImg.onload = r));
        const scaleX = page.getWidth() / tempImg.width;
        const scaleY = pageHeight / tempImg.height;

        const sigBytes = await fetch(sig.data).then((r) => r.arrayBuffer());
        const sigImage = await pdf.embedPng(new Uint8Array(sigBytes));
        page.drawImage(sigImage, {
          x: sig.x * scaleX,
          y: pageHeight - (sig.y + sig.height) * scaleY,
          width: sig.width * scaleX,
          height: sig.height * scaleY,
        });
      }

      const bytes = await pdf.save();
      const blob = new Blob([bytes.slice().buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `signed-${file?.name || "document.pdf"}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Error: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="tool-container" style={{ maxWidth: 1000 }}>
      <div className="text-center mb-10">
        <h1 className="page-title mb-3">Sign PDF</h1>
        <p className="page-desc">Sign your PDF documents electronically.</p>
      </div>

      {!file ? (
        <FileUpload accept=".pdf" onFilesSelected={handleFileSelected} label="Select PDF file" />
      ) : !signatureData ? (
        <div className="max-w-lg mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-center">Create Your Signature</h2>
          <div className="flex gap-4 justify-center mb-6">
            <button onClick={() => setSignMode("draw")}
              className={`px-6 py-3 rounded-xl text-base font-semibold border-2 transition ${signMode === "draw" ? "bg-red-500 text-white border-red-500" : "bg-white text-gray-700 border-gray-200"}`}>
              Draw
            </button>
            <button onClick={() => setSignMode("type")}
              className={`px-6 py-3 rounded-xl text-base font-semibold border-2 transition ${signMode === "type" ? "bg-red-500 text-white border-red-500" : "bg-white text-gray-700 border-gray-200"}`}>
              Type
            </button>
          </div>

          {signMode === "draw" ? (
            <div className="border-3 border-gray-200 rounded-2xl mb-6 bg-white overflow-hidden">
              <canvas ref={canvasRef} width={400} height={150} className="w-full cursor-crosshair" />
            </div>
          ) : (
            <input
              type="text"
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              className="w-full p-4 border-2 border-gray-200 rounded-2xl text-3xl italic font-serif mb-6"
              placeholder="Type your name"
            />
          )}

          <div className="text-center">
            <button onClick={saveSignature} className="btn-primary">Use This Signature</button>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
            <div className="flex gap-3 items-center">
              <span className="text-base text-gray-500 font-medium">Your signature:</span>
              <img src={signatureData} alt="Signature" className="h-12 border-2 rounded-xl p-1" />
              <button onClick={() => setSignatureData(null)} className="text-base text-red-500 hover:underline font-semibold">Change</button>
            </div>
            <p className="text-base text-gray-400">Click on the PDF to place signature</p>
          </div>

          {pageImages.length > 1 && (
            <div className="flex gap-2 justify-center mb-6">
              {pageImages.map((_, i) => (
                <button key={i} onClick={() => setCurrentPage(i)}
                  className={`px-5 py-2 rounded-xl text-base font-semibold border-2 transition ${currentPage === i ? "bg-red-500 text-white border-red-500" : "bg-white text-gray-700 border-gray-200"}`}>
                  Page {i + 1}
                </button>
              ))}
            </div>
          )}

          <div className="relative border-2 rounded-2xl overflow-hidden cursor-crosshair mb-8" onClick={placeSignature}>
            <img src={pageImages[currentPage]} alt={`Page ${currentPage + 1}`} className="w-full" />
            {signatures
              .filter((s) => s.page === currentPage)
              .map((sig, i) => (
                <img key={i} src={sig.data} alt="sig" className="absolute pointer-events-none"
                  style={{ left: sig.x, top: sig.y, width: sig.width, height: sig.height }} />
              ))}
          </div>

          <div className="text-center">
            <button onClick={applySignatures} disabled={processing || signatures.length === 0} className="btn-success disabled:opacity-50">
              {processing ? "Applying..." : "Apply Signatures & Download"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
