import type { MetadataRoute } from "next";
import { SITE_URL, seoPaths } from "@/lib/seo";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return seoPaths().map((p) => ({
    url: `${SITE_URL}${p === "/" ? "" : p}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: p === "/" ? 1 : p === "/audio-tools" || p === "/creator-tools" || p === "/youtube-downloader" || p === "/youtube-to-mp3" || p === "/yt-downloader" ? 0.9 : 0.8,
  }));
}
