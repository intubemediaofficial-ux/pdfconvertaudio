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

interface SignatureArea {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
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
  const [step, setStep] = useState<"upload" | "choose-mode" | "signer" | "signature" | "place" | "send-setup" | "send-place" | "send-confirm">("upload");
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [placingType, setPlacingType] = useState<"signature" | "name" | "date" | "email">("signature");
  const [savedSigners, setSavedSigners] = useState<SignerInfo[]>([]);
  const [, setMode] = useState<"self" | "send">("self");

  // Send for signature state
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [senderName, setSenderName] = useState("");
  const [docTitle, setDocTitle] = useState("");
  const [signatureAreas, setSignatureAreas] = useState<SignatureArea[]>([]);
  const [sendStatus, setSendStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const saved = localStorage.getItem("pdf-signers");
        if (saved) setSavedSigners(JSON.parse(saved));
      } catch { /* ignore */ }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const saveSigner = (info: SignerInfo) => {
    const updated = [...savedSigners.filter((s) => s.email !== info.email), info];
    setSavedSigners(updated);
    try { localStorage.setItem("pdf-signers", JSON.stringify(updated)); } catch { /* ignore */ }
  };

  const handleFileSelected = async (files: File[]) => {
    const f = files[0];
    setFile(f);
    setDocTitle(f.name.replace(/\.pdf$/i, ""));
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
    setStep("choose-mode");
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

  // --- Send for Signature ---
  const placeSignatureArea = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setSignatureAreas((prev) => [
      ...prev,
      { page: currentPage, x, y, width: 180, height: 60 },
    ]);
  };

  const removeSignatureArea = (index: number) => {
    setSignatureAreas((prev) => prev.filter((_, i) => i !== index));
  };

  const sendForSignature = async () => {
    if (!pdfBytes || !recipientEmail || !senderName) return;
    setSendStatus("sending");

    try {
      // Encode PDF to base64 for the signing link
      const uint8 = new Uint8Array(pdfBytes);
      let binary = "";
      for (let i = 0; i < uint8.length; i++) {
        binary += String.fromCharCode(uint8[i]);
      }
      const pdfBase64 = btoa(binary);

      const signingData = {
        senderName,
        docTitle,
        signatureAreas,
        pdfBase64,
      };

      const encoded = btoa(JSON.stringify(signingData));
      const signingUrl = `${window.location.origin}/sign-request?data=${encoded}`;

      // Send email via Brevo
      const emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #dc2626;">📄 PDF Tools</h1>
          </div>
          <h2 style="color: #1f2937;">Signature Request</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            <strong>${senderName}</strong> has sent you a document "<strong>${docTitle}</strong>" to sign.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${signingUrl}" style="background-color: #dc2626; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
              Review & Sign Document
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            Click the button above to open the document and add your signature. The process is quick and secure — all signing happens in your browser.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            Sent via PDF Tools — Free Online PDF Tools. All processing happens in your browser.
          </p>
        </div>
      `;

      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": process.env.NEXT_PUBLIC_BREVO_API_KEY || "",
        },
        body: JSON.stringify({
          sender: { name: "PDF Tools", email: "noreply@intubemedia.com" },
          to: [{ email: recipientEmail, name: recipientName }],
          subject: `${senderName} has requested your signature on "${docTitle}"`,
          htmlContent: emailBody,
        }),
      });

      if (response.ok) {
        setSendStatus("sent");
        setStep("send-confirm");
      } else {
        // Fallback: open mailto link
        const mailtoLink = `mailto:${recipientEmail}?subject=${encodeURIComponent(`Please sign: ${docTitle}`)}&body=${encodeURIComponent(`Hi ${recipientName},\n\n${senderName} has sent you a document to sign.\n\nPlease click this link to review and sign:\n${signingUrl}\n\nThank you!`)}`;
        window.open(mailtoLink, "_blank");
        setSendStatus("sent");
        setStep("send-confirm");
      }
    } catch {
      // Fallback to mailto
      const signingData = { senderName, docTitle, signatureAreas, pdfBase64: "" };
      const mailtoLink = `mailto:${recipientEmail}?subject=${encodeURIComponent(`Please sign: ${docTitle}`)}&body=${encodeURIComponent(`Hi ${recipientName},\n\n${senderName} has requested your signature on "${docTitle}".\n\nPlease open the attached PDF in PDF Tools to sign it.\n\nThank you!`)}`;
      window.open(mailtoLink, "_blank");
      setSendStatus("sent");
      setStep("send-confirm");
    }
  };

  return (
    <div className="tool-container" style={{ maxWidth: 1000 }}>
      <div className="text-center mb-10">
        <h1 className="page-title mb-3">Sign PDF</h1>
        <p className="page-desc">Sign yourself or send documents to others for electronic signature.</p>
      </div>

      {step === "upload" && (
        <FileUpload accept=".pdf" onFilesSelected={handleFileSelected} label="Select PDF file" />
      )}

      {step === "choose-mode" && (
        <div className="max-w-2xl mx-auto">
          <div className="file-card mb-8 text-center">
            <p className="file-name">📄 {file?.name}</p>
            <p className="file-size">{((file?.size || 0) / 1024).toFixed(1)} KB</p>
          </div>

          <h2 className="text-2xl font-bold text-center mb-8">What would you like to do?</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => { setMode("self"); setStep("signer"); }}
              className="p-8 border-2 border-gray-200 rounded-2xl hover:border-red-400 hover:shadow-lg transition text-left bg-white"
            >
              <div className="text-4xl mb-4">✍️</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Sign Myself</h3>
              <p className="text-gray-500">Add your own signature, name, email & date to this PDF document.</p>
            </button>

            <button
              onClick={() => { setMode("send"); setStep("send-setup"); }}
              className="p-8 border-2 border-gray-200 rounded-2xl hover:border-blue-400 hover:shadow-lg transition text-left bg-white"
            >
              <div className="text-4xl mb-4">📧</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Send for Signature</h3>
              <p className="text-gray-500">Send this document to someone else for their electronic signature via email.</p>
            </button>
          </div>
        </div>
      )}

      {/* === SELF SIGN FLOW === */}
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

          <div className="flex gap-4 justify-center">
            <button onClick={() => setStep("choose-mode")} className="btn-secondary">Back</button>
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

      {/* === SEND FOR SIGNATURE FLOW === */}
      {step === "send-setup" && (
        <div className="max-w-lg mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-center">Send for Signature</h2>
          <p className="text-center text-gray-500 mb-8">Send this document to someone for their electronic signature</p>

          <div className="space-y-4 mb-6">
            <div>
              <label className="setting-label">Your Name (Sender) *</label>
              <input type="text" value={senderName} onChange={(e) => setSenderName(e.target.value)}
                className="input-field" placeholder="Your name" />
            </div>
            <div>
              <label className="setting-label">Document Title</label>
              <input type="text" value={docTitle} onChange={(e) => setDocTitle(e.target.value)}
                className="input-field" placeholder="Contract Agreement" />
            </div>
            <hr className="my-4" />
            <div>
              <label className="setting-label">Recipient Name *</label>
              <input type="text" value={recipientName} onChange={(e) => setRecipientName(e.target.value)}
                className="input-field" placeholder="Recipient's name" />
            </div>
            <div>
              <label className="setting-label">Recipient Email *</label>
              <input type="email" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)}
                className="input-field" placeholder="recipient@email.com" />
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <button onClick={() => setStep("choose-mode")} className="btn-secondary">Back</button>
            <button onClick={() => {
              if (!senderName || !recipientName || !recipientEmail) {
                alert("Please fill all required fields");
                return;
              }
              setStep("send-place");
            }} className="btn-primary">
              Mark Signature Areas
            </button>
          </div>
        </div>
      )}

      {step === "send-place" && (
        <div>
          <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 mb-6">
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-base font-semibold text-blue-800">
                Click on the document to mark where <strong>{recipientName}</strong> should sign:
              </span>
              <div className="ml-auto flex items-center gap-3">
                <span className="text-sm text-blue-600">
                  {signatureAreas.length} area(s) marked
                </span>
                {signatureAreas.length > 0 && (
                  <button onClick={() => setSignatureAreas([])}
                    className="text-sm text-red-500 hover:underline font-semibold">Clear All</button>
                )}
              </div>
            </div>
          </div>

          {pageImages.length > 1 && (
            <div className="flex gap-2 justify-center mb-4">
              {pageImages.map((_, i) => (
                <button key={i} onClick={() => setCurrentPage(i)}
                  className={`px-5 py-2 rounded-xl text-base font-semibold border-2 transition ${currentPage === i ? "bg-blue-500 text-white border-blue-500" : "bg-white text-gray-700 border-gray-200"}`}>
                  Page {i + 1}
                </button>
              ))}
            </div>
          )}

          <div className="relative border-2 rounded-2xl overflow-hidden cursor-crosshair mb-6" onClick={placeSignatureArea}>
            <img src={pageImages[currentPage]} alt={`Page ${currentPage + 1}`} className="w-full" />
            {signatureAreas
              .filter((a) => a.page === currentPage)
              .map((area, i) => (
                <div key={i} className="absolute group border-2 border-dashed border-blue-500 bg-blue-100/40 rounded-lg flex items-center justify-center"
                  style={{ left: area.x, top: area.y, width: area.width, height: area.height }}>
                  <span className="text-sm text-blue-600 font-bold">Sign Here</span>
                  <button onClick={(e) => { e.stopPropagation(); removeSignatureArea(signatureAreas.indexOf(area)); }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs font-bold opacity-0 group-hover:opacity-100 transition shadow">
                    x
                  </button>
                </div>
              ))}
          </div>

          <div className="flex gap-4 justify-center">
            <button onClick={() => setStep("send-setup")} className="btn-secondary">Back</button>
            <button onClick={sendForSignature} disabled={sendStatus === "sending" || signatureAreas.length === 0}
              className="btn-primary disabled:opacity-50">
              {sendStatus === "sending" ? "Sending..." : `Send to ${recipientName}`}
            </button>
          </div>
        </div>
      )}

      {step === "send-confirm" && (
        <div className="text-center py-16 max-w-lg mx-auto">
          <div className="text-6xl mb-6">✅</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Signature Request Sent!</h2>
          <p className="text-gray-500 text-lg mb-4">
            An email has been sent to <strong>{recipientName}</strong> ({recipientEmail}) with a link to sign the document.
          </p>
          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
            <p className="text-sm text-gray-600"><strong>Document:</strong> {docTitle}</p>
            <p className="text-sm text-gray-600"><strong>Sent to:</strong> {recipientEmail}</p>
            <p className="text-sm text-gray-600"><strong>Signature areas:</strong> {signatureAreas.length}</p>
          </div>
          <p className="text-sm text-gray-400 mb-6">
            Once they sign, the completed document will be downloaded on their end. They can email it back to you.
          </p>
          <button onClick={() => {
            setStep("upload");
            setFile(null);
            setPdfBytes(null);
            setPageImages([]);
            setSignatureAreas([]);
            setSendStatus("idle");
          }} className="btn-primary">
            Sign Another Document
          </button>
        </div>
      )}
    </div>
  );
}
