"use client";

import { useState, useRef, useEffect } from "react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

interface Box {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

const API = "/api/creator/sign/requests";

export default function SignRequest() {
  const [requestId, setRequestId] = useState("");
  const [pdfBytes, setPdfBytes] = useState<ArrayBuffer | null>(null);
  const [pageImages, setPageImages] = useState<string[]>([]);
  const [signatureAreas, setSignatureAreas] = useState<Box[]>([]);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [signerName, setSignerName] = useState("");
  const [signerEmail, setSignerEmail] = useState("");
  const [signMode, setSignMode] = useState<"draw" | "type">("draw");
  const [typedName, setTypedName] = useState("");
  const [step, setStep] = useState<"loading" | "info" | "signature" | "place" | "done" | "error" | "already">("loading");
  const [currentPage, setCurrentPage] = useState(0);
  const [placedSignatures, setPlacedSignatures] = useState<Box[]>([]);
  const [processing, setProcessing] = useState(false);
  const [senderName, setSenderName] = useState("");
  const [docTitle, setDocTitle] = useState("");
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState<{ download: string; emailed: { sender: boolean; signer: boolean } } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);

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

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id") || "";
    const fail = (msg: string) => {
      setErrorMsg(msg);
      setStep("error");
    };
    if (!id) {
      Promise.resolve().then(() => fail("No signing request found. Please use the link from your email."));
      return;
    }
    (async () => {
      try {
        const res = await fetch(`${API}/${encodeURIComponent(id)}`);
        const meta = await res.json().catch(() => ({}));
        if (!res.ok) return fail(meta.detail || "This signing link is invalid.");
        setRequestId(id);
        setSenderName(meta.senderName || "Someone");
        setDocTitle(meta.docTitle || "Document");
        setMessage(meta.message || "");
        setSignatureAreas(meta.areas || []);
        setSignerName(meta.recipientName || "");
        if (meta.status === "signed") {
          setResult({ download: `${API}/${id}/pdf?signed=true`, emailed: { sender: true, signer: true } });
          setStep("already");
          return;
        }
        const pdfRes = await fetch(`${API}/${encodeURIComponent(id)}/pdf`);
        if (!pdfRes.ok) return fail("Could not load the document.");
        const ab = await pdfRes.arrayBuffer();
        setPdfBytes(ab);
        await loadPdfPages(ab.slice(0));
        setStep("info");
      } catch {
        fail("Could not load the signing request. Check your internet and try again.");
      }
    })();
  }, []);

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
    const fx = (e.clientX - rect.left) / rect.width;
    const fy = (e.clientY - rect.top) / rect.height;
    const area = signatureAreas.find((a) => a.page === currentPage && fx >= a.x && fx <= a.x + a.width && fy >= a.y && fy <= a.y + a.height);
    const width = Math.min(150 / rect.width, 0.45);
    const height = Math.min(50 / rect.height, 0.2);
    const box = area ? { ...area } : { page: currentPage, x: Math.min(fx, 1 - width), y: Math.min(fy, 1 - height), width, height };
    setPlacedSignatures((prev) => [...prev, box]);
  };

  const signAll = () => {
    setPlacedSignatures(signatureAreas.map((a) => ({ ...a })));
  };

  const applyAndSubmit = async () => {
    if (!pdfBytes || !signatureData || placedSignatures.length === 0) return;
    setProcessing(true);
    try {
      const pdf = await PDFDocument.load(pdfBytes);
      const pages = pdf.getPages();
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      const sigBytes = await fetch(signatureData).then((r) => r.arrayBuffer());
      const sigImage = await pdf.embedPng(new Uint8Array(sigBytes));
      for (const sig of placedSignatures) {
        const page = pages[sig.page];
        const { width: pw, height: ph } = page.getSize();
        const boxW = sig.width * pw, boxH = sig.height * ph;
        const scale = Math.min(boxW / sigImage.width, boxH / sigImage.height);
        const w = sigImage.width * scale, h = sigImage.height * scale;
        page.drawImage(sigImage, {
          x: sig.x * pw + (boxW - w) / 2,
          y: ph - sig.y * ph - boxH + (boxH - h) / 2,
          width: w,
          height: h,
        });
      }
      const lastPage = pages[pages.length - 1];
      lastPage.drawText(`Signed electronically by ${signerName} (${signerEmail}) on ${new Date().toLocaleString("en-GB")} · tools.bainslamusic.com`, {
        x: 30,
        y: 18,
        size: 8,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });
      const bytes = await pdf.save();
      const form = new FormData();
      form.append("pdf", new Blob([bytes.slice().buffer as ArrayBuffer], { type: "application/pdf" }), "signed.pdf");
      form.append("signerName", signerName);
      form.append("signerEmail", signerEmail);
      const res = await fetch(`${API}/${encodeURIComponent(requestId)}/complete`, { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Could not submit the signed document.");
      setResult({ download: data.download, emailed: data.emailed });
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
        {message && <p className="mt-3 inline-block bg-gray-50 border rounded-xl px-4 py-2 text-gray-600 italic">&ldquo;{message}&rdquo;</p>}
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
              <span className="text-base font-semibold text-gray-700">Tap a blue &quot;Sign Here&quot; box (or anywhere) to place your signature</span>
              {signatureAreas.length > 0 && (
                <button onClick={signAll} className="text-sm font-semibold text-blue-600 hover:underline">Sign all {signatureAreas.length} boxes</button>
              )}
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
                  style={{ left: `${area.x * 100}%`, top: `${area.y * 100}%`, width: `${area.width * 100}%`, height: `${area.height * 100}%` }}>
                  <span className="text-xs text-blue-500 font-semibold">Sign Here</span>
                </div>
              ))}

            {/* Placed signatures */}
            {placedSignatures
              .filter((s) => s.page === currentPage)
              .map((sig, i) => (
                <div key={i} className="absolute group" style={{ left: `${sig.x * 100}%`, top: `${sig.y * 100}%`, width: `${sig.width * 100}%`, height: `${sig.height * 100}%` }}>
                  <img src={signatureData!} alt="sig" className="w-full h-full object-contain" />
                  <button onClick={(e) => { e.stopPropagation(); setPlacedSignatures((prev) => prev.filter((p) => p !== sig)); }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs font-bold opacity-0 group-hover:opacity-100 transition shadow">
                    x
                  </button>
                </div>
              ))}
          </div>

          <div className="text-center">
            <button onClick={applyAndSubmit} disabled={processing || placedSignatures.length === 0} className="btn-success disabled:opacity-50">
              {processing ? "Submitting..." : `Finish & Send (${placedSignatures.length} signature(s))`}
            </button>
          </div>
        </div>
      )}

      {(step === "done" || step === "already") && result && (
        <div className="text-center py-16 max-w-lg mx-auto">
          <div className="text-6xl mb-6">✅</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">{step === "done" ? "Document Signed Successfully!" : "This document is already signed"}</h2>
          {step === "done" && (
            <p className="text-gray-500 text-lg mb-6">
              {result.emailed.sender ? <>The signed PDF was emailed to <strong>{senderName}</strong>.</> : <>The signed PDF is saved. Please download it and send it to <strong>{senderName}</strong>.</>}
              {result.emailed.signer && <> A copy was sent to {signerEmail}.</>}
            </p>
          )}
          <a href={result.download} target="_blank" rel="noreferrer" className="btn-primary">Download signed PDF</a>
        </div>
      )}
    </div>
  );
}
