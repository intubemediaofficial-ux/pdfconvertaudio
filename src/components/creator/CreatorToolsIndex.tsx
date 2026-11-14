"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { creatorCategories, creatorTools, categoryIcons } from "@/lib/creator/registry";

export default function CreatorToolsIndex() {
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? creatorTools.filter((t) => `${t.name} ${t.description} ${t.category}`.toLowerCase().includes(s)) : creatorTools;
  }, [q]);
  return (
    <div>
      <section className="bg-gradient-to-br from-blue-50 via-white to-red-50 py-14 sm:py-20 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">Free Creator Tools</h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            {creatorTools.length} tools for YouTubers, musicians and podcasters. No sign-up, no watermark. Audio and image tools run in your browser.
          </p>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder='Search tools, e.g. "tags", "thumbnail", "pitch"'
            className="input-field mt-8 max-w-xl mx-auto block"
            aria-label="Search tools"
          />
          <div className="flex flex-wrap justify-center gap-2 mt-5">
            {creatorCategories.map((c) => (
              <a key={c} href={`#${c.replace(/\W+/g, "-").toLowerCase()}`} className="px-3 py-1.5 rounded-full bg-white border border-gray-200 text-sm font-semibold text-gray-600 hover:border-red-300">
                {categoryIcons[c]} {c}
              </a>
            ))}
          </div>
        </div>
      </section>
      <div className="max-w-7xl mx-auto px-4 py-10 space-y-12">
        {q && <p className="text-center text-gray-500">Showing {list.length} of {creatorTools.length} tools</p>}
        {creatorCategories.map((c) => {
          const items = list.filter((t) => t.category === c);
          if (!items.length) return null;
          return (
            <section key={c} id={c.replace(/\W+/g, "-").toLowerCase()} className="scroll-mt-24">
              <h2 className="text-2xl font-extrabold text-gray-900 mb-5">
                {categoryIcons[c]} {c}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {items.map((t) => (
                  <Link key={t.slug} href={`/creator-tools/${t.slug}`} className="tool-card relative block bg-white border-2 border-gray-100 p-5 hover:border-red-200">
                    {t.badge && (
                      <span className={`absolute top-3 right-3 text-xs font-bold px-2 py-0.5 rounded-full ${t.badge === "New" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>{t.badge}</span>
                    )}
                    <div className="text-3xl mb-3">{t.icon}</div>
                    <h3 className="font-bold text-gray-900 text-lg mb-1 pr-12">{t.name}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{t.description}</p>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
