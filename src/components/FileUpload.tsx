"use client";

import { useCallback, useState, useRef } from "react";

interface FileUploadProps {
  accept: string;
  multiple?: boolean;
  onFilesSelected: (files: File[]) => void;
  label?: string;
  description?: string;
}

export default function FileUpload({
  accept,
  multiple = false,
  onFilesSelected,
  label = "Select PDF files",
  description = "or drop files here",
}: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        onFilesSelected(files);
      }
    },
    [onFilesSelected]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        onFilesSelected(files);
      }
    },
    [onFilesSelected]
  );

  return (
    <div className="flex flex-col items-center gap-6 py-12">
      <div
        className={`upload-zone p-20 text-center cursor-pointer w-full max-w-2xl ${
          dragOver ? "drag-over" : ""
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <div className="text-6xl mb-6">
          {accept.includes("image") ? "🖼️" : accept.includes(".ppt") ? "📊" : accept.includes(".xls") || accept.includes(".csv") ? "📋" : accept.includes(".doc") ? "📝" : accept.includes(".htm") ? "🌐" : "📄"}
        </div>
        <button type="button" className="btn-primary mb-4">
          {label}
        </button>
        <p className="text-gray-400 text-lg mt-2">{description}</p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          className="hidden"
        />
      </div>
    </div>
  );
}
