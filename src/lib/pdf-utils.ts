export function pdfBytesToBlob(bytes: Uint8Array): Blob {
  return new Blob([bytes.slice().buffer as ArrayBuffer], { type: "application/pdf" });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadPdfBytes(bytes: Uint8Array, filename: string) {
  const blob = pdfBytesToBlob(bytes);
  downloadBlob(blob, filename);
}
