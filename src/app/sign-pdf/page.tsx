"use client";

import { useState, useRef, useEffect } from "react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import FileUpload from "@/components/FileUpload";

interface SignerInfo {
  name: string;
  email: string;
  date: string;
}

interface PlacedItem {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: "signature" | "name" | "date" | "email";
  data: string;
}

export default function SignPDF() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfBytes, setPdfBytes] = useState<ArrayBuffer | null>(null);
  const [pageImages, setPageImages] = useState<string[]>([]);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [signMode, setSignMode] = useState<"draw" | "type">("draw");
  const [typedName, setTypedName] = useState("");
  const [signerInfo, setSignerInfo] = useState<SignerInfo>({
    name: "",
    email: "",
    date: new Date().toLocaleDateString("en-GB"),
  });
  const [step, setStep] = useState<"upload" | "signer" | "signature" | "place">("upload");
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [placingType, setPlacingType] = useState<"signature" | "name" | "date" | "email">("signature");
  const [savedSigners, setSavedSigners] = useState<SignerInfo[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("pdf-signers");
      if (saved) setSavedSigners(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  const saveSigner = (info: SignerInfo) => {
    const updated = [...savedSigners.filter((s) => s.email !== info.email), info];
    setSavedSigners(updated);
    try { localStorage.setItem("pdf-signers", JSON.stringify(updated)); } catch { /* ignore */ }
  };

  const handleFileSelected = async (files: File[]) => {
    const f = files[0];
    setFile(f);
    const ab = await f.arrayBuffer();
    setPdfBytes(ab);

    const pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
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
    setStep("signer");
  };

  const startDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#1a1a2e";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const getPos = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
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
    if (signMode === "draw" && canvasRef.current && step === "signature") {
      startDrawing();
    }
  }, [signMode, step]);

  const saveSignature = () => {
    if (signMode === "draw") {
      const canvas = canvasRef.current;
      if (!canvas) return;
      setSignatureData(canvas.toDataURL());
    } else {
      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 100;
      const ctx = canvas.getContext("2d")!;
      ctx.font = "italic 40px 'Georgia', serif";
      ctx.fillStyle = "#1a1a2e";
      ctx.fillText(typedName, 10, 65);
      setSignatureData(canvas.toDataURL());
    }
    setStep("place");
  };

  const placeItem = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let data = "";
    let width = 150;
    let height = 50;

    if (placingType === "signature" && signatureData) {
      data = signatureData;
    } else if (placingType === "name") {
      data = signerInfo.name;
      width = 200;
      height = 28;
    } else if (placingType === "date") {
      data = signerInfo.date;
      width = 120;
      height = 24;
    } else if (placingType === "email") {
      data = signerInfo.email;
      width = 200;
      height = 24;
    } else {
      return;
    }

    setPlacedItems((prev) => [
      ...prev,
      { page: currentPage, x, y, width, height, type: placingType, data },
    ]);
  };

  const removeItem = (index: number) => {
    setPlacedItems((prev) => prev.filter((_, i) => i !== index));
  };

  const applySignatures = async () => {
    if (!pdfBytes || placedItems.length === 0) return;
    setProcessing(true);
    try {
      const pdf = await PDFDocument.load(pdfBytes);
      const pages = pdf.getPages();
      const font = await pdf.embedFont(StandardFonts.Helvetica);

      for (const item of placedItems) {
        const page = pages[item.page];
        const { height: pageHeight } = page.getSize();
        const tempImg = new Image();
        tempImg.src = pageImages[item.page];
        await new Promise((r) => (tempImg.onload = r));
        const scaleX = page.getWidth() / tempImg.width;
        const scaleY = pageHeight / tempImg.height;

        if (item.type === "signature") {
          const sigBytes = await fetch(item.data).then((r) => r.arrayBuffer());
          const sigImage = await pdf.embedPng(new Uint8Array(sigBytes));
          page.drawImage(sigImage, {
            x: item.x * scaleX,
            y: pageHeight - (item.y + item.height) * scaleY,
            width: item.width * scaleX,
            height: item.height * scaleY,
          });
        } else {
          const fontSize = item.type === "name" ? 14 : 11;
          page.drawText(item.data, {
            x: item.x * scaleX,
            y: pageHeight - (item.y + item.height * 0.7) * scaleY,
            size: fontSize,
            font,
            color: rgb(0.1, 0.1, 0.12),
          });
        }
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
        <p className="page-desc">Add your signature, name, email & date to PDF documents.</p>
      </div>

      {step === "upload" && (
        <FileUpload accept=".pdf" onFilesSelected={handleFileSelected} label="Select PDF file" />
      )}

      {step === "signer" && (
        <div className="max-w-lg mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-center">Signer Details</h2>

          {savedSigners.length > 0 && (
            <div className="mb-6">
              <label className="setting-label">Saved Signers:</label>
              <div className="flex flex-wrap gap-3">
                {savedSigners.map((s, i) => (
                  <button key={i} onClick={() => setSignerInfo({ ...s, date: new Date().toLocaleDateString("en-GB") })}
                    className={`px-4 py-3 rounded-xl border-2 text-left transition ${
                      signerInfo.email === s.email ? "border-red-500 bg-red-50" : "border-gray-200 bg-white hover:border-red-200"
                    }`}>
                    <p className="font-semibold text-base">{s.name}</p>
                    <p className="text-sm text-gray-500">{s.email}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4 mb-6">
            <div>
              <label className="setting-label">Full Name *</label>
              <input type="text" value={signerInfo.name} onChange={(e) => setSignerInfo({ ...signerInfo, name: e.target.value })}
                className="input-field" placeholder="Ajeet Kumar" />
            </div>
            <div>
              <label className="setting-label">Email *</label>
              <input type="email" value={signerInfo.email} onChange={(e) => setSignerInfo({ ...signerInfo, email: e.target.value })}
                className="input-field" placeholder="ajeet@example.com" />
            </div>
            <div>
              <label className="setting-label">Date</label>
              <input type="text" value={signerInfo.date} onChange={(e) => setSignerInfo({ ...signerInfo, date: e.target.value })}
                className="input-field" placeholder="18/05/2026" />
            </div>
          </div>

          <div className="flex gap-3 items-center mb-4">
            <input type="checkbox" id="save-signer" className="w-5 h-5 accent-red-500" />
            <label htmlFor="save-signer" className="text-base text-gray-600">Save signer for future use</label>
          </div>

          <div className="text-center">
            <button onClick={() => {
              if (!signerInfo.name || !signerInfo.email) { alert("Please enter name and email"); return; }
              const checkbox = document.getElementById("save-signer") as HTMLInputElement;
              if (checkbox?.checked) saveSigner(signerInfo);
              setStep("signature");
            }} className="btn-primary">
              Continue to Signature
            </button>
          </div>
        </div>
      )}

      {step === "signature" && (
        <div className="max-w-lg mx-auto">
          <h2 className="text-2xl font-bold mb-2 text-center">Create Your Signature</h2>
          <p className="text-center text-gray-500 mb-6 text-base">Signing as: <strong>{signerInfo.name}</strong> ({signerInfo.email})</p>

          <div className="flex gap-4 justify-center mb-6">
            <button onClick={() => setSignMode("draw")}
              className={`px-6 py-3 rounded-xl text-base font-semibold border-2 transition ${signMode === "draw" ? "bg-red-500 text-white border-red-500" : "bg-white text-gray-700 border-gray-200"}`}>
              Draw Signature
            </button>
            <button onClick={() => setSignMode("type")}
              className={`px-6 py-3 rounded-xl text-base font-semibold border-2 transition ${signMode === "type" ? "bg-red-500 text-white border-red-500" : "bg-white text-gray-700 border-gray-200"}`}>
              Type Signature
            </button>
          </div>

          {signMode === "draw" ? (
            <div className="border-3 border-gray-200 rounded-2xl mb-6 bg-white overflow-hidden">
              <canvas ref={canvasRef} width={400} height={150} className="w-full cursor-crosshair" style={{ touchAction: "none" }} />
              <div className="text-center py-2 border-t border-gray-100">
                <button onClick={() => { const c = canvasRef.current; if (c) c.getContext("2d")!.clearRect(0, 0, c.width, c.height); }}
                  className="text-sm text-red-500 hover:underline font-semibold">Clear</button>
              </div>
            </div>
          ) : (
            <input type="text" value={typedName} onChange={(e) => setTypedName(e.target.value)}
              className="w-full p-4 border-2 border-gray-200 rounded-2xl text-3xl italic font-serif mb-6 text-center"
              placeholder="Type your signature" />
          )}

          <div className="flex gap-4 justify-center">
            <button onClick={() => setStep("signer")} className="btn-secondary">Back</button>
            <button onClick={saveSignature} className="btn-primary">Use This Signature</button>
          </div>
        </div>
      )}

      {step === "place" && (
        <div>
          <div className="bg-white border-2 border-gray-100 rounded-2xl p-4 mb-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-base font-semibold text-gray-700">Place on PDF:</span>
              {(["signature", "name", "date", "email"] as const).map((type) => (
                <button key={type} onClick={() => setPlacingType(type)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition capitalize ${
                    placingType === type ? "bg-red-500 text-white border-red-500" : "bg-white text-gray-600 border-gray-200 hover:border-red-200"
                  }`}>
                  {type === "signature" ? "Signature" : type === "name" ? `Name (${signerInfo.name})` : type === "date" ? `Date (${signerInfo.date})` : `Email (${signerInfo.email})`}
                </button>
              ))}
              <div className="ml-auto flex items-center gap-2">
                <img src={signatureData!} alt="Sig" className="h-10 border rounded-lg p-1" />
                <button onClick={() => { setStep("signature"); setSignatureData(null); }} className="text-sm text-red-500 hover:underline font-semibold">Change</button>
              </div>
            </div>
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

          <div className="relative border-2 rounded-2xl overflow-hidden cursor-crosshair mb-6" onClick={placeItem}>
            <img src={pageImages[currentPage]} alt={`Page ${currentPage + 1}`} className="w-full" />
            {placedItems
              .filter((s) => s.page === currentPage)
              .map((item, i) => (
                <div key={i} className="absolute group" style={{ left: item.x, top: item.y, width: item.width, height: item.height }}>
                  {item.type === "signature" ? (
                    <img src={item.data} alt="sig" className="w-full h-full object-contain pointer-events-none" />
                  ) : (
                    <div className="bg-white/90 border border-blue-300 rounded px-2 py-1 text-sm font-medium text-gray-800 pointer-events-none whitespace-nowrap">
                      {item.data}
                    </div>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); removeItem(placedItems.indexOf(item)); }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs font-bold opacity-0 group-hover:opacity-100 transition pointer-events-auto shadow">
                    x
                  </button>
                </div>
              ))}
          </div>

          <div className="text-center">
            <button onClick={applySignatures} disabled={processing || placedItems.length === 0} className="btn-success disabled:opacity-50">
              {processing ? "Applying..." : `Apply & Download (${placedItems.length} items)`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
