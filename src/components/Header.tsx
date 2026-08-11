"use client";

import Link from "next/link";
import { useState } from "react";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          <Link href="/" className="flex items-center gap-2 font-extrabold text-2xl">
            <span className="text-3xl">📄</span>
            <span className="text-red-500">PDF</span>
            <span className="text-gray-800">Tools</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-base font-semibold text-gray-600">
            <Link href="/merge-pdf" className="hover:text-red-500 transition">
              Merge
            </Link>
            <Link href="/split-pdf" className="hover:text-red-500 transition">
              Split
            </Link>
            <Link href="/compress-pdf" className="hover:text-red-500 transition">
              Compress
            </Link>
            <Link href="/edit-pdf" className="hover:text-red-500 transition">
              Edit
            </Link>
            <Link href="/audio-converter" className="hover:text-purple-500 transition">
              Audio
            </Link>
            <Link href="/remove-background" className="hover:text-emerald-500 transition">
              Background
            </Link>
            <Link href="/#all-tools" className="bg-red-500 text-white px-5 py-2 rounded-full hover:bg-red-600 transition text-sm">
              All Tools
            </Link>
          </div>

          <button
            className="md:hidden p-2"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden pb-4 space-y-1">
            {[
              { href: "/merge-pdf", label: "Merge PDF" },
              { href: "/split-pdf", label: "Split PDF" },
              { href: "/compress-pdf", label: "Compress PDF" },
              { href: "/edit-pdf", label: "Edit PDF" },
              { href: "/sign-pdf", label: "Sign PDF" },
              { href: "/rotate-pdf", label: "Rotate PDF" },
              { href: "/pdf-to-jpg", label: "PDF to JPG" },
              { href: "/remove-background", label: "Remove Background" },
              { href: "/audio-converter", label: "Audio Converter" },
              { href: "/mp4-to-mp3", label: "MP4 to MP3" },
              { href: "/mp3-to-wav", label: "MP3 to WAV" },
              { href: "/wav-to-mp3", label: "WAV to MP3" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block py-3 px-4 text-gray-700 hover:text-red-500 hover:bg-red-50 rounded-lg text-base font-medium"
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </nav>
    </header>
  );
}
