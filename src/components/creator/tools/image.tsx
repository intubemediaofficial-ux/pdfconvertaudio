"use client";

import { useRef, useState } from "react";
import JSZip from "jszip";
import { downloadBlob, safeName } from "@/lib/creator/export";
import { Card, Field, Range, Select, Toggle } from "../ui";

interface Item { file: File; out?: Blob; w?: number; h?: number; ow?: number; oh?: number; error?: string }

async function compress(file: File, o: { quality: number; format: string; maxW: number; maxH: number; keep: boolean }) {
  const bmp = await createImageBitmap(file);
  let w = bmp.width, h = bmp.height;
  const scale = Math.min(1, o.maxW ? o.maxW / w : 1, o.maxH ? o.maxH / h : 1);
  w = Math.round(w * scale);
  h = Math.round(h * scale);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  const type = o.format === "original" ? (file.type === "image/png" ? "image/png" : file.type === "image/webp" ? "image/webp" : "image/jpeg") : o.format;
  if (type === "image/jpeg") {
    g.fillStyle = "#fff";
    g.fillRect(0, 0, w, h);
  }
  g.drawImage(bmp, 0, 0, w, h);
  let blob = await new Promise<Blob>((r) => c.toBlob((b) => r(b!), type, o.quality / 100));
  if (o.keep && blob.size > file.size && scale === 1 && o.format === "original") blob = file;
  return { blob, w: bmp.width, h: bmp.height, ow: w, oh: h };
}

export function CompressImage() {
  const [items, setItems] = useState<Item[]>([]);
  const [quality, setQuality] = useState(75);
  const [format, setFormat] = useState("original");
  const [maxW, setMaxW] = useState(0);
  const [maxH, setMaxH] = useState(0);
  const [keep, setKeep] = useState(true);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const run = async (list: Item[]) => {
    setBusy(true);
    const out: Item[] = [];
    for (const it of list) {
      try {
        const r = await compress(it.file, { quality, format, maxW, maxH, keep });
        out.push({ file: it.file, out: r.blob, w: r.w, h: r.h, ow: r.ow, oh: r.oh });
      } catch {
        out.push({ file: it.file, error: "Could not read this image" });
      }
      setItems([...out, ...list.slice(out.length)]);
    }
    setBusy(false);
  };
  const ext = (b: Blob) => (b.type === "image/png" ? "png" : b.type === "image/webp" ? "webp" : "jpg");
  const name = (it: Item) => `${safeName(it.file.name.replace(/\.[^.]+$/, ""))}-compressed.${ext(it.out!)}`;
  const totalIn = items.reduce((t, i) => t + i.file.size, 0);
  const totalOut = items.reduce((t, i) => t + (i.out?.size || 0), 0);
  const kb = (n: number) => (n > 1048576 ? `${(n / 1048576).toFixed(2)} MB` : `${Math.round(n / 1024)} KB`);
  return (
    <Card className="space-y-5">
      <div className="upload-zone p-8 text-center cursor-pointer" onClick={() => ref.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const f = Array.from(e.dataTransfer.files).filter((x) => x.type.startsWith("image/")); if (f.length) setItems(f.map((file) => ({ file }))); }}>
        <div className="text-5xl mb-3">🖼️</div>
        <button type="button" className="btn-primary !px-8 !py-3 !text-lg">Select images</button>
        <p className="text-sm text-gray-500 mt-3">JPG, PNG, WEBP · many at once · never uploaded</p>
        <input ref={ref} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { const f = Array.from(e.target.files || []); if (f.length) setItems(f.map((file) => ({ file }))); e.target.value = ""; }} />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Range label="Quality" value={quality} onChange={setQuality} min={10} max={100} suffix="%" />
        <Field label="Output format"><Select value={format} onChange={setFormat} options={[["original", "Same as original"], ["image/jpeg", "JPG"], ["image/webp", "WEBP (smallest)"], ["image/png", "PNG (lossless)"]]} /></Field>
        <Field label="Max width (px, 0 = keep)"><input type="number" min={0} value={maxW} onChange={(e) => setMaxW(Math.max(0, Number(e.target.value)))} className="input-field" /></Field>
        <Field label="Max height (px, 0 = keep)"><input type="number" min={0} value={maxH} onChange={(e) => setMaxH(Math.max(0, Number(e.target.value)))} className="input-field" /></Field>
      </div>
      <Toggle label="Keep the original if compression makes it bigger" checked={keep} onChange={setKeep} />
      {items.length > 0 && (
        <>
          <div className="text-center"><button type="button" disabled={busy} onClick={() => run(items.map((i) => ({ file: i.file })))} className="btn-primary disabled:opacity-50">{busy ? "Compressing…" : `Compress ${items.length} image${items.length > 1 ? "s" : ""}`}</button></div>
          <div className="space-y-2">
            {items.map((it, i) => (
              <div key={i} className="file-card flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="file-name truncate">{it.file.name}</div>
                  <div className="file-size">
                    {kb(it.file.size)}
                    {it.out && <> → <b className="text-green-700">{kb(it.out.size)}</b> ({Math.round((1 - it.out.size / it.file.size) * 100)}% smaller) · {it.ow}×{it.oh}</>}
                    {it.error && <span className="text-red-600"> {it.error}</span>}
                  </div>
                </div>
                {it.out && <button type="button" onClick={() => downloadBlob(it.out!, name(it))} className="btn-success !px-4 !py-2 !text-sm ml-auto">⬇ Download</button>}
              </div>
            ))}
          </div>
          {totalOut > 0 && items.length > 1 && (
            <div className="success-msg flex flex-wrap items-center justify-between gap-3 !text-left">
              <p className="!m-0 font-bold">Total {kb(totalIn)} → {kb(totalOut)} ({Math.round((1 - totalOut / totalIn) * 100)}% saved)</p>
              <button type="button" className="btn-success !px-5 !py-2 !text-base" onClick={async () => { const z = new JSZip(); items.forEach((it) => it.out && z.file(name(it), it.out)); downloadBlob(await z.generateAsync({ type: "blob" }), "compressed-images.zip"); }}>⬇ Download all (ZIP)</button>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
