"use client";

import { useState, useRef, useEffect } from "react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

interface PlacedSignature {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function SignRequest() {
  const [pdfBytes, setPdfBytes] = useState<ArrayBuffer | null>(null);
  const [pageImages, setPageImages] = useState<string[]>([]);
  const [signatureAreas, setSignatureAreas] = useState<{ page: number; x: number; y: number; width: number; height: number }[]>([]);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [signerName, setSignerName] = useState("");
  const [signerEmail, setSignerEmail] = useState("");
  const [signMode, setSignMode] = useState<"draw" | "type">("draw");
  const [typedName, setTypedName] = useState("");
  const [step, setStep] = useState<"loading" | "info" | "signature" | "place" | "done" | "error">("loading");
  const [currentPage, setCurrentPage] = useState(0);
  const [placedSignatures, setPlacedSignatures] = useState<PlacedSignature[]>([]);
  const [processing, setProcessing] = useState(false);
  const [senderName, setSenderName] = useState("");
  const [docTitle, setDocTitle] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const data = params.get("data");

      if (!data) {
        setErrorMsg("No signing request data found. Please use the link sent to your email.");
        setStep("error");
        return;
      }

      try {
        const decoded = JSON.parse(atob(data));
        setSenderName(decoded.senderName || "Someone");
        setDocTitle(decoded.docTitle || "Document");
        setSignatureAreas(decoded.signatureAreas || []);

      if (decoded.pdfBase64) {
        const binary = atob(decoded.pdfBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        setPdfBytes(bytes.buffer as ArrayBuffer);
        loadPdfPages(bytes.buffer as ArrayBuffer);
      }
      setStep("info");
    } catch {
      setErrorMsg("Invalid signing request. The link may be corrupted or expired.");
      setStep("error");
    }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const loadPdfPages = async (ab: ArrayBuffer) => {
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
      ctx.fillText(typedName || signerName, 10, 65);
      setSignatureData(canvas.toDataURL());
    }
    setStep("place");
  };

  const placeSignature = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setPlacedSignatures((prev) => [
      ...prev,
      { page: currentPage, x, y, width: 150, height: 50 },
    ]);
  };

  const applyAndDownload = async () => {
    if (!pdfBytes || !signatureData || placedSignatures.length === 0) return;
    setProcessing(true);
    try {
      const pdf = await PDFDocument.load(pdfBytes);
      const pages = pdf.getPages();
      const font = await pdf.embedFont(StandardFonts.Helvetica);

      for (const sig of placedSignatures) {
        const page = pages[sig.page];
        const { height: pageHeight } = page.getSize();
        const tempImg = new Image();
        tempImg.src = pageImages[sig.page];
        await new Promise((r) => (tempImg.onload = r));
        const scaleX = page.getWidth() / tempImg.width;
        const scaleY = pageHeight / tempImg.height;

        const sigBytes = await fetch(signatureData).then((r) => r.arrayBuffer());
        const sigImage = await pdf.embedPng(new Uint8Array(sigBytes));
        page.drawImage(sigImage, {
          x: sig.x * scaleX,
          y: pageHeight - (sig.y + sig.height) * scaleY,
          width: sig.width * scaleX,
          height: sig.height * scaleY,
        });
      }

      // Add signer info at bottom of last page
      const lastPage = pages[pages.length - 1];
      const { height: lh } = lastPage.getSize();
      lastPage.drawText(`Signed by: ${signerName} (${signerEmail}) on ${new Date().toLocaleDateString("en-GB")}`, {
        x: 50,
        y: 30,
        size: 9,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });

      const bytes = await pdf.save();
      const blob = new Blob([bytes.slice().buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `signed-${docTitle || "document"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setStep("done");
    } catch (err) {
      alert("Error: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setProcessing(false);
    }
  };

  if (step === "error") {
    return (
      <div className="tool-container text-center py-20">
        <div className="text-6xl mb-6">❌</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Invalid Signing Request</h1>
        <p className="text-gray-500 text-lg">{errorMsg}</p>
      </div>
    );
  }

  if (step === "loading") {
    return (
      <div className="tool-container text-center py-20">
        <div className="text-6xl mb-6 animate-pulse">📄</div>
        <p className="text-xl text-gray-600">Loading signing request...</p>
      </div>
    );
  }

  return (
    <div className="tool-container" style={{ maxWidth: 1000 }}>
      <div className="text-center mb-10">
        <h1 className="page-title mb-3">Sign Document</h1>
        <p className="page-desc">
          <strong>{senderName}</strong> has requested your signature on &quot;{docTitle}&quot;
        </p>
      </div>

      {step === "info" && (
        <div className="max-w-lg mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-center">Your Details</h2>
          <div className="space-y-4 mb-6">
            <div>
              <label className="setting-label">Full Name *</label>
              <input
                type="text"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                className="input-field"
                placeholder="Your full name"
              />
            </div>
            <div>
              <label className="setting-label">Email *</label>
              <input
                type="email"
                value={signerEmail}
                onChange={(e) => setSignerEmail(e.target.value)}
                className="input-field"
                placeholder="your@email.com"
              />
            </div>
          </div>
          <div className="text-center">
            <button
              onClick={() => {
                if (!signerName || !signerEmail) { alert("Please enter your name and email"); return; }
                setStep("signature");
              }}
              className="btn-primary"
            >
              Continue to Sign
            </button>
          </div>
        </div>
      )}

      {step === "signature" && (
        <div className="max-w-lg mx-auto">
          <h2 className="text-2xl font-bold mb-2 text-center">Create Your Signature</h2>
          <p className="text-center text-gray-500 mb-6">Signing as: <strong>{signerName}</strong></p>

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
            <button onClick={() => setStep("info")} className="btn-secondary">Back</button>
            <button onClick={saveSignature} className="btn-primary">Use This Signature</button>
          </div>
        </div>
      )}

      {step === "place" && pageImages.length > 0 && (
        <div>
          <div className="bg-white border-2 border-gray-100 rounded-2xl p-4 mb-6 shadow-sm">
            <div className="flex items-center gap-4">
              <span className="text-base font-semibold text-gray-700">Click on the document to place your signature</span>
              <div className="ml-auto">
                <img src={signatureData!} alt="Your signature" className="h-10 border rounded-lg p-1" />
              </div>
            </div>
          </div>

          {pageImages.length > 1 && (
            <div className="flex gap-2 justify-center mb-4">
              {pageImages.map((_, i) => (
                <button key={i} onClick={() => setCurrentPage(i)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 ${currentPage === i ? "bg-red-500 text-white border-red-500" : "bg-white text-gray-700 border-gray-200"}`}>
                  Page {i + 1}
                </button>
              ))}
            </div>
          )}

          <div className="relative border-2 rounded-2xl overflow-hidden cursor-crosshair mb-6" onClick={placeSignature}>
            <img src={pageImages[currentPage]} alt={`Page ${currentPage + 1}`} className="w-full" />

            {/* Show signature areas marked by sender */}
            {signatureAreas
              .filter((a) => a.page === currentPage)
              .map((area, i) => (
                <div key={`area-${i}`} className="absolute border-2 border-dashed border-blue-400 bg-blue-50/30 rounded-lg flex items-center justify-center"
                  style={{ left: area.x, top: area.y, width: area.width, height: area.height }}>
                  <span className="text-xs text-blue-500 font-semibold">Sign Here</span>
                </div>
              ))}

            {/* Placed signatures */}
            {placedSignatures
              .filter((s) => s.page === currentPage)
              .map((sig, i) => (
                <div key={i} className="absolute group" style={{ left: sig.x, top: sig.y, width: sig.width, height: sig.height }}>
                  <img src={signatureData!} alt="sig" className="w-full h-full object-contain" />
                  <button onClick={(e) => { e.stopPropagation(); setPlacedSignatures((prev) => prev.filter((_, idx) => idx !== i)); }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs font-bold opacity-0 group-hover:opacity-100 transition shadow">
                    x
                  </button>
                </div>
              ))}
          </div>

          <div className="text-center">
            <button onClick={applyAndDownload} disabled={processing || placedSignatures.length === 0} className="btn-success disabled:opacity-50">
              {processing ? "Signing..." : `Sign & Download (${placedSignatures.length} signature(s))`}
            </button>
          </div>
        </div>
      )}

      {step === "done" && (
        <div className="text-center py-16">
          <div className="text-6xl mb-6">✅</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Document Signed Successfully!</h2>
          <p className="text-gray-500 text-lg mb-6">
            The signed PDF has been downloaded. You can send it back to <strong>{senderName}</strong>.
          </p>
        </div>
      )}
    </div>
  );
}
