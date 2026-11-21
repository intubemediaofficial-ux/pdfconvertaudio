const BASE = "/api/creator";

async function parse<T>(res: Response): Promise<T> {
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON */
  }
  if (!res.ok) {
    const d = data as { detail?: string; error?: string } | null;
    throw new Error(d?.detail || d?.error || `Request failed (${res.status}). Please try again.`);
  }
  return data as T;
}

export async function apiGet<T>(path: string, params: Record<string, string | number | boolean> = {}): Promise<T> {
  const qs = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString();
  return parse<T>(await fetch(`${BASE}${path}${qs ? `?${qs}` : ""}`));
}

export async function aiGenerate<T = { items: unknown[] }>(body: Record<string, unknown>): Promise<T> {
  return parse<T>(
    await fetch(`${BASE}/ai/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  );
}

export async function apiPost<T>(path: string, body: Record<string, unknown>): Promise<T> {
  return parse<T>(
    await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  );
}

export function apiUrl(path: string) {
  return `${BASE}${path}`;
}

export function imgProxy(url: string, name?: string) {
  const qs = new URLSearchParams({ url, ...(name ? { name } : {}) });
  return `${BASE}/img?${qs.toString()}`;
}

export interface YTVideo {
  id: string;
  url: string;
  title: string;
  description?: string;
  channelId: string;
  channelTitle: string;
  publishedAt: string;
  tags: string[];
  categoryId: string;
  category: string;
  defaultLanguage: string;
  liveBroadcastContent: string;
  thumbnails: Record<string, string>;
  thumbnail: string;
  duration: number;
  definition: string;
  caption: boolean;
  licensedContent: boolean;
  dimension: string;
  privacyStatus: string;
  embeddable: boolean;
  madeForKids: boolean;
  license: string;
  views: number;
  likes: number;
  comments: number;
  topics: string[];
}

export interface YTChannel {
  id: string;
  url: string;
  title: string;
  handle: string;
  description?: string;
  publishedAt: string;
  country: string;
  thumbnail: string;
  thumbnails: Record<string, string>;
  banner: string;
  keywords?: string[];
  keywordsRaw?: string;
  subscribers: number;
  hiddenSubscribers: boolean;
  views: number;
  videos: number;
  uploads: string;
  madeForKids: boolean;
  topics: string[];
  rank?: number;
  prev?: { rank: number; subscribers: number; views: number; videos: number } | null;
}

export interface YTComment {
  id: string;
  parentId: string | null;
  author: string;
  authorChannelId: string;
  authorImage: string;
  text: string;
  likes: number;
  publishedAt: string;
  replyCount?: number;
}

export function fmtNum(n: number) {
  return new Intl.NumberFormat("en-IN").format(n);
}

export function compact(n: number) {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

export function fmtDuration(total: number) {
  const s = Math.round(total);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (x: number) => String(x).padStart(2, "0");
  if (d) return `${d}d ${h}h ${pad(m)}m ${pad(sec)}s`;
  if (h) return `${h}:${pad(m)}:${pad(sec)}`;
  return `${m}:${pad(sec)}`;
}

export function fmtDate(iso: string) {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return iso || "";
  return new Date(t).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function videoIdOf(raw: string): string | null {
  const s = raw.trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  const m =
    s.match(/[?&]v=([\w-]{11})/) ||
    s.match(/(?:youtu\.be\/|\/shorts\/|\/embed\/|\/live\/|\/v\/)([\w-]{11})/);
  return m ? m[1] : null;
}
