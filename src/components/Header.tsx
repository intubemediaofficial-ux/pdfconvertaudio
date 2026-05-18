"use client";

import Link from "next/link";
import { useState } from "react";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <span className="text-2xl">📄</span>
            <span className="text-red-500">PDF</span>
            <span className="text-gray-800">Tools</span>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-700">
            <Link href="/merge-pdf" className="hover:text-red-500 transition">
              Merge PDF
            </Link>
            <Link href="/split-pdf" className="hover:text-red-500 transition">
              Split PDF
            </Link>
            <Link
              href="/compress-pdf"
              className="hover:text-red-500 transition"
            >
              Compress PDF
            </Link>
            <Link href="/edit-pdf" className="hover:text-red-500 transition">
              Edit PDF
            </Link>
            <Link href="/#all-tools" className="hover:text-red-500 transition">
              All PDF Tools
            </Link>
          </div>

          <button
            className="md:hidden p-2"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {menuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <Link
              href="/merge-pdf"
              className="block py-2 text-gray-700 hover:text-red-500"
              onClick={() => setMenuOpen(false)}
            >
              Merge PDF
            </Link>
            <Link
              href="/split-pdf"
              className="block py-2 text-gray-700 hover:text-red-500"
              onClick={() => setMenuOpen(false)}
            >
              Split PDF
            </Link>
            <Link
              href="/compress-pdf"
              className="block py-2 text-gray-700 hover:text-red-500"
              onClick={() => setMenuOpen(false)}
            >
              Compress PDF
            </Link>
            <Link
              href="/edit-pdf"
              className="block py-2 text-gray-700 hover:text-red-500"
              onClick={() => setMenuOpen(false)}
            >
              Edit PDF
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}
