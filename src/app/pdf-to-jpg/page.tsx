"use client";

import { useState } from "react";
import FileUpload from "@/components/FileUpload";

export default function PDFToJPG() {
  const [file, setFile] = useState<File | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [quality, setQuality] = useState(1.5);

  const handleFileSelected = (files: File[]) => {
    setFile(files[0]);
    setImages([]);
  };

  const convertToJPG = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const newImages: string[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: quality });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d")!;
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: context, viewport, canvas } as Parameters<typeof page.render>[0]).promise;
        newImages.push(canvas.toDataURL("image/jpeg", 0.92));
      }

      setImages(newImages);
    } catch (err) {
      alert("Error converting PDF: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setProcessing(false);
    }
  };

  const downloadImage = (dataUrl: string, index: number) => {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `page-${index + 1}.jpg`;
    a.click();
  };

  const downloadAll = () => {
    images.forEach((img, i) => downloadImage(img, i));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">PDF to JPG</h1>
        <p className="text-gray-600">
          Convert each PDF page into a JPG image.
        </p>
      </div>

      {!file ? (
        <FileUpload accept=".pdf" onFilesSelected={handleFileSelected} label="Select PDF file" />
      ) : images.length === 0 ? (
        <div className="text-center">
          <div className="p-4 bg-white rounded-lg border shadow-sm mb-6 inline-block">
            <p className="font-medium">📄 {file.name}</p>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quality: {quality === 1 ? "Normal" : quality === 1.5 ? "High" : "Ultra"}
            </label>
            <div className="flex gap-3 justify-center">
              {[1, 1.5, 2].map((q) => (
                <button
                  key={q}
                  onClick={() => setQuality(q)}
                  className={`px-4 py-2 rounded text-sm ${
                    quality === q
                      ? "bg-red-500 text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {q === 1 ? "Normal" : q === 1.5 ? "High" : "Ultra"}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={convertToJPG}
            disabled={processing}
            className="btn-primary disabled:opacity-50"
          >
            {processing ? "Converting..." : "Convert to JPG"}
          </button>
        </div>
      ) : (
        <div>
          <div className="text-center mb-6">
            <button onClick={downloadAll} className="btn-success">
              Download All Images
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((img, i) => (
              <div key={i} className="border rounded-lg overflow-hidden">
                <img src={img} alt={`Page ${i + 1}`} className="w-full" />
                <div className="p-2 text-center">
                  <button
                    onClick={() => downloadImage(img, i)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Download Page {i + 1}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
