"use client";

import Link from "next/link";
import { useState } from "react";
import { tools, categories, type Category } from "@/lib/tools";
import { creatorTools } from "@/lib/creator/registry";

export default function HomeClient() {
  const [activeCategory, setActiveCategory] = useState<Category>("All");

  const audioExtras = creatorTools
    .filter((t) => t.category === "Audio & Sound Tools")
    .map((t) => ({ id: t.slug, name: t.name, description: t.description, href: `/creator-tools/${t.slug}`, icon: t.icon, color: "bg-purple-50 border-purple-200", category: "Audio Converter" }));
  const allTools = [...tools, ...audioExtras];
  const filteredTools =
    activeCategory === "All"
      ? allTools
      : allTools.filter((t) => t.category === activeCategory);

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-red-50 via-white to-orange-50 py-20 text-center">
        <div className="max-w-5xl mx-auto px-4">
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
            Every tool you need to<br />work with PDFs & Audio
          </h1>
          <p className="text-xl text-gray-500 max-w-3xl mx-auto leading-relaxed">
            PDF tools, audio converters — all 100% FREE and easy to use!
            Merge, split, compress, convert PDFs. Extract audio from videos.
            Everything runs in your browser.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-6 py-3">
            <span className="text-green-600 text-lg">🔒</span>
            <span className="text-green-700 font-semibold text-base">
              PDF &amp; audio processing happens in your browser — those files never
              leave your device
            </span>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <Link
          href="/creator-tools"
          className="tool-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-600 to-red-500 text-white p-6 sm:p-8"
        >
          <div>
            <div className="text-sm font-bold uppercase tracking-wider opacity-90">New · {creatorTools.length} free tools</div>
            <h2 className="text-2xl sm:text-3xl font-extrabold mt-1">Creator Tools</h2>
            <p className="opacity-90 mt-1">YouTube tags, titles, keywords, channel stats, thumbnail downloader, comment picker, audio cutter, pitch &amp; BPM changer, 8D audio and more.</p>
          </div>
          <span className="shrink-0 bg-white text-red-600 font-bold rounded-full px-6 py-3">Open Creator Tools →</span>
        </Link>
      </section>

      {/* Category Filter */}
      <section id="all-tools" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-wrap gap-3 justify-center mb-10">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-3 rounded-full text-base font-semibold transition-all ${
                activeCategory === cat
                  ? "bg-red-500 text-white shadow-lg shadow-red-200"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {filteredTools.map((tool) => (
            <Link
              key={tool.id}
              href={tool.href}
              className={`tool-card block p-6 border-2 bg-white ${tool.color} hover:shadow-xl`}
            >
              <div className="text-4xl mb-4">{tool.icon}</div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">{tool.name}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                {tool.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-20 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-extrabold text-center text-gray-900 mb-14">
            Why Choose PDF Tools?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="text-center p-8 rounded-2xl bg-blue-50">
              <div className="text-5xl mb-5">🔒</div>
              <h3 className="font-bold text-xl mb-3">100% Private & Secure</h3>
              <p className="text-gray-600 text-base leading-relaxed">
                All PDF processing happens directly in your browser. Your files
                are never uploaded to any server.
              </p>
            </div>
            <div className="text-center p-8 rounded-2xl bg-yellow-50">
              <div className="text-5xl mb-5">⚡</div>
              <h3 className="font-bold text-xl mb-3">Lightning Fast</h3>
              <p className="text-gray-600 text-base leading-relaxed">
                No waiting for uploads or server processing. Everything runs
                instantly on your device.
              </p>
            </div>
            <div className="text-center p-8 rounded-2xl bg-green-50">
              <div className="text-5xl mb-5">🆓</div>
              <h3 className="font-bold text-xl mb-3">Completely Free</h3>
              <p className="text-gray-600 text-base leading-relaxed">
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
