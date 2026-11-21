import type { Metadata } from "next";
import { seoData, type SeoEntry, type SeoKind } from "./seo-data";

export const SITE_URL = "https://tools.bainslamusic.com";
export const SITE_NAME = "Bainsla Tools";

export function seoFor(path: string): SeoEntry | undefined {
  return seoData[path];
}

export function seoPaths(): string[] {
  return Object.keys(seoData);
}

const OG_IMAGE = "/opengraph-image.png";

export function pageMetadata(path: string): Metadata {
  const e = seoData[path];
  if (!e) return {};
  const title = `${e.title} | ${SITE_NAME}`;
  return {
    title: { absolute: title },
    description: e.description,
    keywords: e.keywords,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      url: path,
      title,
      description: e.description,
      images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: e.title }],
    },
    twitter: { card: "summary_large_image", title, description: e.description, images: [OG_IMAGE] },
  };
}

const privacyFaq: Record<SeoKind, [string, string] | null> = {
  pdf: ["Are my files uploaded to a server?", "No. All processing happens in your browser, so your PDF never leaves your device."],
  audio: ["Are my audio files uploaded?", "No. Audio is processed in your browser with no upload, so it stays private."],
  image: ["Is my image uploaded?", "No. The image is processed in your browser and never leaves your device."],
  "image-server": ["Are my photos stored?", "Photos are sent securely to our server only to remove the background and are never stored."],
  youtube: ["Do I need to sign in to YouTube?", "No. Just paste a public video, channel or playlist link. No login or API key is needed."],
  ai: ["Do I need an account?", "No. The AI runs on our server and is free to use without sign-up."],
  calc: null,
  hub: null,
};

export function faqsFor(e: SeoEntry): [string, string][] {
  const list = [...(e.faqs ?? [])];
  const p = privacyFaq[e.kind];
  if (p) list.push(p);
  list.push(["Is it free?", "Yes. It is 100% free with no sign-up, no watermark and no daily limit."]);
  const seen = new Set<string>();
  return list.filter(([q]) => (seen.has(q) ? false : (seen.add(q), true)));
}

export function stepsFor(name: string, e: SeoEntry): string[] {
  if (e.steps?.length) return e.steps;
  switch (e.kind) {
    case "youtube":
      return ["Paste a YouTube video, channel or playlist link (or @handle).", `Click the button to run ${name}.`, "Copy or download the results."];
    case "ai":
      return ["Enter your topic, niche or keywords.", "Click Generate to get AI suggestions.", "Copy the ideas you like."];
    case "audio":
      return ["Choose an audio file from your device.", "Adjust the settings and preview the result.", "Download the processed audio."];
    case "image":
      return ["Choose an image.", "Pick the quality and size.", "Download the result."];
    default:
      return ["Enter your values.", "See the result instantly.", "Copy or share the result."];
  }
}

export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
