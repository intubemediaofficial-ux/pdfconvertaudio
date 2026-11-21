"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getCreatorTool } from "@/lib/creator/registry";
import { tools } from "@/lib/tools";
import { downloaderPage } from "@/lib/downloader-pages";

type Crumb = { href: string; label: string };

function trail(path: string): Crumb[] | null {
  const p = path.replace(/\/+$/, "") || "/";
  if (p === "/") return null;
  if (p === "/creator-tools") return [{ href: "/creator-tools", label: "Creator Tools" }];
  if (p === "/audio-tools") return [{ href: "/audio-tools", label: "Audio Tools" }];
  const dl = !p.startsWith("/creator-tools/") && downloaderPage(p);
  if (dl) return [{ href: "/creator-tools", label: "Creator Tools" }, { href: p, label: dl.name }];
  if (p.startsWith("/creator-tools/")) {
    const t = getCreatorTool(p.split("/")[2]);
    if (!t) return null;
    const section = t.category === "Audio & Sound Tools" ? { href: "/audio-tools", label: "Audio Tools" } : { href: "/creator-tools", label: "Creator Tools" };
    return [section, { href: p, label: t.name }];
  }
  const tool = tools.find((t) => t.href === p);
  if (tool?.category === "Audio Converter") return [{ href: "/audio-tools", label: "Audio Tools" }, { href: p, label: tool.name }];
  if (tool) return [{ href: "/#all-tools", label: "All Tools" }, { href: p, label: tool.name }];
  if (p === "/sign-request") return [{ href: "/sign-pdf", label: "Sign PDF" }, { href: p, label: "Sign Document" }];
  return null;
}

export default function BackBar() {
  const path = usePathname() || "/";
  const router = useRouter();
  useEffect(() => {
    const n = Number(sessionStorage.getItem("navDepth") || "0");
    sessionStorage.setItem("navDepth", String(n + 1));
  }, [path]);
  const crumbs = trail(path);
  if (!crumbs) return null;
  const parent = crumbs.length > 1 ? crumbs[crumbs.length - 2].href : "/";
  const goBack = () => {
    const visitedInApp = Number(sessionStorage.getItem("navDepth") || "0") > 1 || document.referrer.startsWith(window.location.origin);
    if (visitedInApp && window.history.length > 1) router.back();
    else router.push(parent);
  };
  return (
    <div className="bg-white/70 backdrop-blur-xl border-b border-gray-200/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center gap-3 text-sm">
        <button type="button" onClick={goBack} className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3.5 py-1.5 font-semibold text-gray-700 shadow-sm hover:border-pink-300 hover:text-pink-600 transition shrink-0">
          ← Back
        </button>
        <nav aria-label="Breadcrumb" className="min-w-0 truncate text-gray-500">
          <Link href="/" className="hover:text-red-500">Home</Link>
          {crumbs.map((c, i) => (
            <span key={c.href}>
              <span className="mx-1.5">›</span>
              {i === crumbs.length - 1 ? <span className="text-gray-800 font-medium">{c.label}</span> : <Link href={c.href} className="hover:text-red-500">{c.label}</Link>}
            </span>
          ))}
        </nav>
      </div>
    </div>
  );
}
