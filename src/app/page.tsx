"use client";

import Link from "next/link";
import { useState } from "react";
import { tools, categories, type Category } from "@/lib/tools";

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<Category>("All");

  const filteredTools =
    activeCategory === "All"
      ? tools
      : tools.filter((t) => t.category === activeCategory);

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-16 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Every tool you need to work with PDFs in one place
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Every tool you need to use PDFs, at your fingertips. All are 100%
            FREE and easy to use! Merge, split, compress, convert, rotate,
            unlock and watermark PDFs with just a few clicks.
          </p>
          <p className="text-sm text-green-600 mt-3 font-medium">
            All processing happens in your browser — your files never leave your
            device
          </p>
        </div>
      </section>

      {/* Category Filter */}
      <section id="all-tools" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                activeCategory === cat
                  ? "bg-red-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredTools.map((tool) => (
            <Link
              key={tool.id}
              href={tool.href}
              className={`tool-card block p-5 rounded-xl border ${tool.color} hover:shadow-lg`}
            >
              <div className="text-3xl mb-3">{tool.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-1">{tool.name}</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                {tool.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Choose PDF Tools?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="font-semibold text-lg mb-2">100% Private & Secure</h3>
              <p className="text-gray-600 text-sm">
                All PDF processing happens directly in your browser. Your files
                are never uploaded to any server.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="font-semibold text-lg mb-2">Lightning Fast</h3>
              <p className="text-gray-600 text-sm">
                No waiting for uploads or server processing. Everything runs
                instantly on your device.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="text-4xl mb-4">🆓</div>
              <h3 className="font-semibold text-lg mb-2">Completely Free</h3>
              <p className="text-gray-600 text-sm">
                No sign-up required, no limits, no watermarks. Use all tools as
                many times as you want.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
