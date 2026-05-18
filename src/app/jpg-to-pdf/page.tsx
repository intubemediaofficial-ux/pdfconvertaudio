"use client";

import { useState, useCallback } from "react";
import { PDFDocument } from "pdf-lib";
import FileUpload from "@/components/FileUpload";

export default function JPGToPDF() {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);

  const handleFilesSelected = useCallback((newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const convertToPDF = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    try {
      const pdf = await PDFDocument.create();

      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const type = file.type;

        let image;
        if (type === "image/png") {
          image = await pdf.embedPng(arrayBuffer);
        } else {
          image = await pdf.embedJpg(arrayBuffer);
        }

        const page = pdf.addPage([image.width, image.height]);
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: image.width,
          height: image.height,
        });
      }

      const bytes = await pdf.save();
      const blob = new Blob([bytes.slice().buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "images.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Error: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="tool-container">
      <div className="text-center mb-10">
        <h1 className="page-title mb-3">JPG to PDF</h1>
        <p className="page-desc">Convert JPG images to PDF in seconds.</p>
      </div>

      {files.length === 0 ? (
        <FileUpload
          accept="image/jpeg,image/png,image/jpg"
          multiple
          onFilesSelected={handleFilesSelected}
          label="Select images"
          description="or drop JPG/PNG images here"
        />
      ) : (
        <div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 mb-8">
            {files.map((file, index) => (
              <div key={`${file.name}-${index}`} className="relative border-2 border-gray-100 rounded-2xl overflow-hidden shadow-sm bg-white">
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="w-full h-36 object-cover"
                />
                <button
                  onClick={() => removeFile(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 text-sm font-bold shadow"
                >
                  ✕
                </button>
                <p className="p-2 text-sm text-center truncate font-medium">{file.name}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={() =>
                document.querySelector<HTMLInputElement>("#add-more-img")?.click()
              }
              className="btn-secondary"
            >
              + Add more images
            </button>
            <input
              id="add-more-img"
              type="file"
              accept="image/jpeg,image/png,image/jpg"
              multiple
              className="hidden"
              onChange={(e) => {
                handleFilesSelected(Array.from(e.target.files || []));
                e.target.value = "";
              }}
            />
            <button
              onClick={convertToPDF}
              disabled={processing}
              className="btn-primary disabled:opacity-50"
            >
              {processing ? "Converting..." : "Convert to PDF"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
