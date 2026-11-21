"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { tools } from "@/lib/tools";
import { creatorTools, categoryIcons, type CreatorCategory } from "@/lib/creator/registry";

type Item = { name: string; description: string; href: string; icon: string; group: string; badge?: string };

const fromTool = (t: (typeof tools)[number]): Item => ({ name: t.name, description: t.description, href: t.href, icon: t.icon, group: t.category });
const fromCreator = (t: (typeof creatorTools)[number]): Item => ({
  name: t.name,
  description: t.description,
  href: `/creator-tools/${t.slug}`,
  icon: t.icon,
  group: t.category,
  badge: t.badge,
});

const pdfGroups = ["Organize PDF", "Optimize PDF", "Convert PDF", "Edit PDF", "PDF Security", "PDF Intelligence"];
const ytGroups: CreatorCategory[] = [
  "YouTube SEO & Optimization",
  "YouTube Analytics & Monetization",
  "YouTube Video & Channel Utilities",
  "YouTube Media Downloaders",
  "Engagement & Interaction",
];

const sections = [
  { id: "pdf", label: "PDF Tools" },
  { id: "audio", label: "Audio" },
  { id: "background", label: "Background Remover" },
  { id: "creator", label: "YouTube Creator" },
  { id: "image-podcast", label: "Image & Podcast" },
  { id: "esign", label: "e-Signature" },
  { id: "why", label: "Why us" },
  { id: "faq", label: "FAQ" },
];

function Card({ t }: { t: Item }) {
  return (
    <Link href={t.href} className="p-card group">
      <div className="flex items-center justify-between">
        <span className="p-icon" aria-hidden>{t.icon}</span>
        {t.badge && <span className="text-[11px] font-bold uppercase tracking-wider rounded-full px-2.5 py-1 bg-gradient-to-r from-orange-400 to-pink-500 text-white">{t.badge}</span>}
      </div>
      <h3 className="font-bold text-[17px] leading-snug">{t.name}</h3>
      <p className="text-sm opacity-70 leading-relaxed line-clamp-2">{t.description}</p>
      <span className="mt-auto text-sm font-semibold gradient-text opacity-0 group-hover:opacity-100 transition">Open tool →</span>
    </Link>
  );
}

function SectionHead({ eyebrow, title, desc, href, cta }: { eyebrow: string; title: string; desc: string; href?: string; cta?: string }) {
  return (
    <div className="reveal flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
      <div className="max-w-2xl">
        <div className="text-xs font-bold uppercase tracking-[0.2em] gradient-text mb-3">{eyebrow}</div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">{title}</h2>
        <p className="mt-3 text-base sm:text-lg opacity-70 leading-relaxed">{desc}</p>
      </div>
      {href && (
        <Link href={href} className="shrink-0 inline-flex items-center gap-2 rounded-full border border-current/20 px-5 py-2.5 font-semibold hover:bg-black/5 transition">
          {cta} <span aria-hidden>→</span>
        </Link>
      )}
    </div>
  );
}

function Group({ title, icon, items }: { title: string; icon?: string; items: Item[] }) {
  if (!items.length) return null;
  return (
    <div className="reveal mb-10">
      <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest opacity-60 mb-4">
        {icon && <span aria-hidden>{icon}</span>}
        {title} <span className="opacity-60">· {items.length}</span>
      </h3>
      <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {items.map((t) => <Card key={t.href} t={t} />)}
      </div>
    </div>
  );
}

export default function HomeClient({ h1, faqs }: { h1: string; faqs: [string, string][] }) {
  const [q, setQ] = useState("");
  const [active, setActive] = useState("pdf");

  const pdf = tools.filter((t) => pdfGroups.includes(t.category)).map(fromTool);
  const audioBase = tools.filter((t) => t.category === "Audio Converter").map(fromTool);
  const audioCreator = creatorTools.filter((t) => t.category === "Audio & Sound Tools").map(fromCreator);
  const imageTools = [
    ...tools.filter((t) => t.category === "Image Tools").map(fromTool),
    ...creatorTools.filter((t) => t.category === "Image Tools").map(fromCreator),
  ];
  const podcast = creatorTools.filter((t) => t.category === "Podcast Tools").map(fromCreator);
  const yt = creatorTools.filter((t) => ytGroups.includes(t.category)).map(fromCreator);

  const all = useMemo(() => {
    const seen = new Set<string>();
    return [...tools.map(fromTool), ...creatorTools.map(fromCreator), { name: "Sign PDF", description: "Sign PDFs yourself or send for e-signature", href: "/sign-pdf", icon: "✍️", group: "e-Signature" }].filter((t) =>
      seen.has(t.href) ? false : (seen.add(t.href), true),
    );
  }, []);
  const results = q.trim()
    ? all.filter((t) => `${t.name} ${t.description} ${t.group}`.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 8)
    : [];
  const half = Math.ceil(all.length / 2);
  const rowA = all.slice(0, half);
  const rowB = all.slice(half);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("reveal-ready");
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && (e.target.classList.add("in"), io.unobserve(e.target))),
      { rootMargin: "0px 0px -8% 0px" },
    );
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
    const spy = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) spy.observe(el);
    });
    return () => {
      io.disconnect();
      spy.disconnect();
      root.classList.remove("reveal-ready");
    };
  }, []);

  useEffect(() => {
    const chip = document.getElementById(`chip-${active}`);
    const bar = chip?.parentElement;
    if (chip && bar) bar.scrollTo({ left: chip.offsetLeft - bar.clientWidth / 2 + chip.clientWidth / 2, behavior: "smooth" });
  }, [active]);

  const stats = [
    { n: `${all.length}+`, l: "Free tools" },
    { n: "0", l: "Sign-ups needed" },
    { n: "100%", l: "Private PDF & audio" },
    { n: "4K", l: "Background removal" },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="surface-dark pt-16 pb-14 sm:pt-24 sm:pb-20">
        <div className="aurora" />
        <div className="grid-overlay" />
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="reveal inline-flex items-center gap-2 glass-dark rounded-full px-4 py-1.5 text-xs sm:text-sm font-semibold text-white/90">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> {all.length}+ free tools · No sign-up · No watermark
          </div>
          <h1 className="reveal mt-6 text-[2.4rem] leading-[1.05] sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white">
            {h1.split(" ").slice(0, -3).join(" ")} <span className="gradient-text">{h1.split(" ").slice(-3).join(" ")}</span>
          </h1>
          <p className="reveal mt-6 text-base sm:text-xl text-white/70 max-w-3xl mx-auto leading-relaxed">
            Merge, compress and convert PDFs, convert and edit audio, remove image backgrounds, sign documents and grow your YouTube channel — all in one premium, private workspace.
          </p>

          <div className="reveal relative mt-8 max-w-2xl mx-auto text-left">
            <label htmlFor="tool-search" className="sr-only">Search tools</label>
            <div className="glass-dark flex items-center gap-3 px-5 py-4 rounded-2xl focus-within:border-white/40">
              <svg className="w-5 h-5 text-white/60 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
              <input
                id="tool-search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search a tool — e.g. compress PDF, channel ID, MP3 to WAV"
                className="w-full bg-transparent outline-none text-white placeholder:text-white/45 text-base"
                autoComplete="off"
              />
            </div>
            {q.trim() && (
              <div className="absolute z-20 mt-2 w-full rounded-2xl bg-white text-gray-900 shadow-2xl overflow-hidden border border-gray-100">
                {results.length ? (
                  results.map((t) => (
                    <Link key={t.href} href={t.href} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0">
                      <span className="text-xl" aria-hidden>{t.icon}</span>
                      <span className="min-w-0">
                        <span className="block font-semibold truncate">{t.name}</span>
                        <span className="block text-xs text-gray-500 truncate">{t.group}</span>
                      </span>
                    </Link>
                  ))
                ) : (
                  <div className="px-4 py-4 text-sm text-gray-500">No tool found. Try another word.</div>
                )}
              </div>
            )}
          </div>

          <div className="reveal mt-8 flex flex-col min-[420px]:flex-row gap-3 justify-center">
            <a href="#pdf" className="btn-primary !text-base !px-8 !py-3.5">Explore all tools</a>
            <Link href="/creator-tools" className="inline-flex items-center justify-center rounded-full glass-dark px-8 py-3.5 font-bold text-white">YouTube Creator Tools →</Link>
          </div>

          <div className="reveal mt-12 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
            {stats.map((s) => (
              <div key={s.l} className="glass-dark px-4 py-5">
                <div className="text-2xl sm:text-3xl font-extrabold text-white">{s.n}</div>
                <div className="text-xs sm:text-sm text-white/60 mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 space-y-3" aria-label="All tools">
          {[rowA, rowB].map((row, i) => (
            <div key={i} className="marquee">
              <div className={`marquee-track ${i ? "reverse" : ""}`}>
                {[...row, ...row].map((t, j) => (
                  <Link key={`${t.href}-${j}`} href={t.href} tabIndex={j >= row.length ? -1 : undefined} aria-hidden={j >= row.length || undefined} className="glass-dark shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold text-white/85 hover:text-white">
                    <span aria-hidden>{t.icon}</span>{t.name}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section navigation */}
      <nav aria-label="Sections" className="sticky top-16 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200/70">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex gap-1 overflow-x-auto no-scrollbar">
          {sections.map((s) => (
            <a key={s.id} id={`chip-${s.id}`} href={`#${s.id}`} className={`section-chip ${active === s.id ? "active" : ""}`}>
              {s.label}
            </a>
          ))}
        </div>
      </nav>

      <div id="all-tools" />

      {/* PDF */}
      <section id="pdf" className="home-section max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-gray-900">
        <SectionHead eyebrow="PDF Tools" title="Every PDF tool, right in your browser" desc="Merge, split, compress, convert, edit, protect and sign PDFs. Files are processed on your device and never uploaded." />
        {pdfGroups.map((g) => (
          <Group key={g} title={g} items={pdf.filter((t) => t.group === g)} />
        ))}
      </section>

      {/* Audio */}
      <section id="audio" className="home-section surface-dark py-20">
        <div className="aurora opacity-60" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-white">
          <SectionHead eyebrow="Audio Studio" title="Convert, cut and transform audio" desc="MP3, WAV, MP4 converters plus cutter, joiner, pitch, BPM, 8D, voice changer and more. Runs locally with no upload." href="/audio-tools" cta="All audio tools" />
          <Group title="Converters" icon="🎵" items={audioBase} />
          <Group title="Edit & effects" icon="🎛️" items={audioCreator} />
        </div>
      </section>

      {/* Background remover */}
      <section id="background" className="home-section max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-gray-900">
        <div className="reveal glass-panel overflow-hidden grid md:grid-cols-2">
          <div className="p-8 sm:p-12">
            <div className="text-xs font-bold uppercase tracking-[0.2em] gradient-text mb-3">AI Background Remover</div>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">Remove image backgrounds in seconds</h2>
            <p className="mt-4 text-gray-600 text-lg leading-relaxed">Turbo AI engine cuts out people, products and logos with clean edges. Keeps full 4K resolution and exports transparent PNG.</p>
            <ul className="mt-6 space-y-2 text-gray-700">
              {["Full-resolution transparent PNG", "Works for people, products and logos", "Photos are never stored"].map((x) => (
                <li key={x} className="flex gap-2"><span className="gradient-text font-extrabold">✓</span>{x}</li>
              ))}
            </ul>
            <Link href="/remove-background" className="btn-primary !text-base !px-8 !py-3.5 mt-8">Remove background now</Link>
          </div>
          <div className="relative min-h-[260px] surface-dark grid place-items-center p-10">
            <div className="aurora" />
            <div className="relative grid grid-cols-2 gap-4 w-full max-w-sm">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-sky-300 to-emerald-300 grid place-items-center text-6xl shadow-2xl">🧑</div>
              <div className="aspect-square rounded-2xl grid place-items-center text-6xl shadow-2xl" style={{ backgroundImage: "repeating-conic-gradient(#e5e7eb 0 25%, #fff 0 50%)", backgroundSize: "20px 20px" }}>🧑</div>
              <div className="col-span-2 text-center text-white/70 text-sm">Original → Transparent PNG</div>
            </div>
          </div>
        </div>
      </section>

      {/* Creator */}
      <section id="creator" className="home-section surface-dark py-20">
        <div className="aurora opacity-70" />
        <div className="grid-overlay" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-white">
          <SectionHead eyebrow="YouTube Creator Tools" title="Grow your channel with smart YouTube tools" desc="Tags, titles, keywords, hashtags, channel ID finder, analytics, money calculator, thumbnail downloader, comment picker and more." href="/creator-tools" cta="All creator tools" />
          {ytGroups.map((g) => (
            <Group key={g} title={g} icon={categoryIcons[g]} items={yt.filter((t) => t.group === g)} />
          ))}
        </div>
      </section>

      {/* Image & Podcast */}
      <section id="image-podcast" className="home-section max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-gray-900">
        <SectionHead eyebrow="Image & Podcast" title="Images and podcasts, handled" desc="Compress images, remove backgrounds and plan podcasts with name generators, cover checks and more." />
        <Group title="Image tools" icon="🖼️" items={imageTools} />
        <Group title="Podcast tools" icon="🎤" items={podcast} />
      </section>

      {/* e-Signature */}
      <section id="esign" className="home-section max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 text-gray-900">
        <div className="reveal surface-dark rounded-[28px] p-8 sm:p-14">
          <div className="aurora" />
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em] gradient-text mb-3">e-Signature</div>
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">Sign PDFs or send them for signature</h2>
              <p className="mt-4 text-white/70 text-lg leading-relaxed">Draw, type or upload your signature. Or email a signing link — the signed PDF comes back to your inbox automatically.</p>
              <Link href="/sign-pdf" className="btn-primary !text-base !px-8 !py-3.5 mt-8">Sign a PDF</Link>
            </div>
            <ol className="space-y-3">
              {["Upload your PDF and mark where to sign", "Sign yourself or email the signer a secure link", "Get the signed PDF back by email"].map((s, i) => (
                <li key={s} className="glass-dark flex items-center gap-4 p-4 text-white/90">
                  <span className="step-dot">{i + 1}</span>{s}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Why */}
      <section id="why" className="home-section max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 text-gray-900">
        <SectionHead eyebrow="Why Bainsla Tools" title="Premium tools. Zero cost." desc="Built for speed and privacy, with no accounts, limits or watermarks." />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            ["🔒", "Private by design", "PDF, audio and image tools run in your browser. Files never leave your device."],
            ["⚡", "Lightning fast", "No upload queues. Results appear instantly on your device."],
            ["🆓", "Completely free", "No sign-up, no daily limits and no watermarks on any tool."],
            ["📱", "Works everywhere", "Desktop, tablet and phone — any modern browser."],
          ].map(([i, t, d]) => (
            <div key={t} className="reveal glass-panel p-6">
              <div className="p-icon w-12 h-12 rounded-2xl grid place-items-center text-2xl bg-gradient-to-br from-orange-50 to-violet-50">{i}</div>
              <h3 className="mt-4 font-bold text-lg">{t}</h3>
              <p className="mt-2 text-gray-600 leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="home-section max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 text-gray-900">
        <SectionHead eyebrow="FAQ" title="Questions, answered" desc="Everything you need to know about our free online tools." />
        <div className="reveal glass-panel p-6 sm:p-8">
          {faqs.map(([qq, a]) => (
            <details key={qq} className="faq-item">
              <summary className="cursor-pointer font-semibold text-gray-800 py-4 list-none flex justify-between gap-3">
                <span>{qq}</span>
                <span className="faq-plus">+</span>
              </summary>
              <p className="text-gray-600 pb-4 leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
