"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const nav = [
  { href: "/#pdf", label: "PDF Tools" },
  { href: "/audio-tools", label: "Audio" },
  { href: "/remove-background", label: "Background" },
  { href: "/creator-tools", label: "Creator Tools" },
  { href: "/sign-pdf", label: "e-Sign" },
];

const mobileGroups = [
  {
    title: "PDF",
    links: [
      { href: "/merge-pdf", label: "Merge PDF" },
      { href: "/split-pdf", label: "Split PDF" },
      { href: "/compress-pdf", label: "Compress PDF" },
      { href: "/edit-pdf", label: "Edit PDF" },
      { href: "/pdf-to-word", label: "PDF to Word" },
      { href: "/pdf-to-jpg", label: "PDF to JPG" },
      { href: "/sign-pdf", label: "Sign PDF" },
      { href: "/#pdf", label: "All PDF tools" },
    ],
  },
  {
    title: "Audio & Image",
    links: [
      { href: "/audio-tools", label: "All audio tools" },
      { href: "/audio-converter", label: "Audio Converter" },
      { href: "/mp4-to-mp3", label: "MP4 to MP3" },
      { href: "/mp3-to-wav", label: "MP3 to WAV" },
      { href: "/remove-background", label: "Remove Background" },
    ],
  },
  {
    title: "YouTube",
    links: [
      { href: "/creator-tools", label: "All creator tools" },
      { href: "/creator-tools/youtube-tags-generator", label: "Tags Generator" },
      { href: "/creator-tools/youtube-title-generator", label: "Title Generator" },
      { href: "/creator-tools/youtube-channel-id-finder", label: "Channel ID Finder" },
    ],
  },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled || menuOpen ? "bg-[#0b0b1a]/90 shadow-lg shadow-black/20" : "bg-[#0b0b1a]"} backdrop-blur-xl border-b border-white/10`}>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Main">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5 font-extrabold text-xl text-white" aria-label="Bainsla Tools home">
            <img src="/icon.png" alt="" width={34} height={34} className="rounded-[10px] shadow-lg shadow-pink-500/30" />
            <span>
              Bainsla<span className="gradient-text">Tools</span>
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-1 text-[15px] font-semibold text-white/75">
            {nav.map((n) => {
              const on = n.href !== "/#pdf" && pathname.startsWith(n.href);
              return (
                <Link key={n.href} href={n.href} className={`px-3.5 py-2 rounded-full transition hover:text-white hover:bg-white/10 ${on ? "text-white bg-white/10" : ""}`}>
                  {n.label}
                </Link>
              );
            })}
            <Link href="/#pdf" className="ml-3 btn-primary !text-sm !px-5 !py-2.5">
              All Tools
            </Link>
          </div>

          <button
            className="lg:hidden p-2 text-white rounded-lg hover:bg-white/10"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
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
          <div className="lg:hidden pb-5 max-h-[calc(100vh-4rem)] overflow-y-auto">
            {mobileGroups.map((g) => (
              <div key={g.title} className="mt-3">
                <div className="px-3 text-xs font-bold uppercase tracking-widest text-white/40 mb-1">{g.title}</div>
                <div className="grid grid-cols-2 gap-1">
                  {g.links.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block py-2.5 px-3 text-white/85 hover:text-white hover:bg-white/10 rounded-lg text-[15px] font-medium"
                      onClick={() => setMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </nav>
    </header>
  );
}
