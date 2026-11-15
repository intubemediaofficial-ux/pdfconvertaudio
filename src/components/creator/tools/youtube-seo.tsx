"use client";

import { useState } from "react";
import { aiGenerate, apiGet, fmtDate, fmtNum, type YTChannel, type YTVideo } from "@/lib/creator/api";
import { Card, Chips, CopyBox, CopyButton, ErrorBox, Field, SearchForm, Select, Spinner, Stat, useAsync } from "../ui";

const LANGS: [string, string][] = [["", "Any language"], ["English", "English"], ["Hindi", "Hindi"], ["Hinglish (Hindi in Roman script)", "Hinglish"], ["Rajasthani", "Rajasthani"], ["Punjabi", "Punjabi"], ["Spanish", "Spanish"]];

function LangPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Field label="Language">
      <Select value={value} onChange={onChange} options={LANGS} />
    </Field>
  );
}

async function suggestTags(topic: string) {
  const [kw, ai] = await Promise.allSettled([
    apiGet<{ suggestions: string[] }>("/yt/keywords", { q: topic, depth: "short" }),
    aiGenerate<{ items: string[] }>({ task: "tags", input: topic, n: 25 }),
  ]);
  const out: string[] = [topic.toLowerCase()];
  if (kw.status === "fulfilled") out.push(...kw.value.suggestions.slice(0, 25));
  if (ai.status === "fulfilled") out.push(...ai.value.items.map((t) => String(t)));
  const seen = new Set<string>();
  return out
    .map((t) => t.replace(/^#/, "").replace(/[<>,]/g, "").trim())
    .filter((t) => t && t.length <= 100 && !seen.has(t.toLowerCase()) && seen.add(t.toLowerCase()));
}

function packTags(tags: string[], limit = 500) {
  const used: string[] = [];
  let len = 0;
  for (const t of tags) {
    const add = t.length + (used.length ? 1 : 0) + (t.includes(" ") ? 2 : 0);
    if (len + add > limit) continue;
    used.push(t);
    len += add;
  }
  return used;
}

export function TagsGenerator() {
  const s = useAsync<string[]>();
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const tags = (s.data || []).filter((t) => !removed.has(t));
  const packed = packTags(tags);
  const text = packed.join(", ");
  return (
    <Card>
      <SearchForm placeholder="Video topic or title, e.g. gurjar rasiya new song" button="Generate tags" loading={s.loading} onSubmit={(v) => { setRemoved(new Set()); s.run(() => suggestTags(v)); }} />
      <ErrorBox error={s.error} />
      {s.loading && <Spinner label="Finding tags from YouTube searches…" />}
      {s.data && (
        <div className="mt-6 space-y-4">
          <p className="text-sm text-gray-500">{tags.length} tags found · {packed.length} fit in YouTube&apos;s 500-character limit ({text.length} chars). Click × to remove a tag.</p>
          <Chips items={tags} onRemove={(i) => setRemoved(new Set([...removed, tags[i]]))} />
          <CopyBox title="Ready to paste (500 characters)" text={text} />
        </div>
      )}
    </Card>
  );
}

function VideoLookup({ button, render }: { button: string; render: (v: YTVideo) => React.ReactNode }) {
  const s = useAsync<YTVideo>();
  return (
    <Card>
      <SearchForm placeholder="Paste a YouTube video link" button={button} loading={s.loading} onSubmit={(v) => s.run(() => apiGet<YTVideo>("/yt/video", { url: v }))} />
      <ErrorBox error={s.error} />
      {s.loading && <Spinner />}
      {s.data && (
        <div className="mt-6 space-y-4">
          <div className="flex gap-4 items-start">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.data.thumbnails.medium || s.data.thumbnail} alt="" className="w-32 sm:w-40 rounded-lg shrink-0" />
            <div className="min-w-0">
              <a href={s.data.url} target="_blank" rel="noreferrer" className="font-bold text-gray-900 hover:text-red-600 break-words">{s.data.title}</a>
              <p className="text-sm text-gray-500">{s.data.channelTitle} · {fmtDate(s.data.publishedAt)} · {fmtNum(s.data.views)} views</p>
            </div>
          </div>
          {render(s.data)}
        </div>
      )}
    </Card>
  );
}

export function TagsExtractor() {
  return (
    <VideoLookup
      button="Get tags"
      render={(v) =>
        v.tags.length ? (
          <>
            <p className="text-sm text-gray-500">{v.tags.length} tags · {v.tags.join(", ").length} characters</p>
            <Chips items={v.tags} />
            <CopyBox title="All tags" text={v.tags.join(", ")} />
          </>
        ) : (
          <p className="text-gray-600 font-medium">This video has no tags.</p>
        )
      }
    />
  );
}

export function HashtagsExtractor() {
  return (
    <VideoLookup
      button="Extract hashtags"
      render={(v) => {
        const all = `${v.title}\n${v.description || ""}`.match(/#[\p{L}\p{N}_]+/gu) || [];
        const uniq = [...new Set(all)];
        return uniq.length ? (
          <>
            <p className="text-sm text-gray-500">{uniq.length} hashtags. YouTube shows the first 3 above the title.</p>
            <Chips items={uniq} />
            <CopyBox title="Hashtags" text={uniq.join(" ")} rows={3} />
          </>
        ) : (
          <p className="text-gray-600 font-medium">No hashtags in the title or description.</p>
        );
      }}
    />
  );
}

export function DescriptionCopy() {
  return (
    <VideoLookup
      button="Get description"
      render={(v) => {
        const d = v.description || "";
        const links = d.match(/https?:\/\/\S+/g) || [];
        const tags = d.match(/#[\p{L}\p{N}_]+/gu) || [];
        const stamps = d.match(/^\s*\(?\d{1,2}:\d{2}(?::\d{2})?\)?.*$/gm) || [];
        return (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Stat label="Characters" value={fmtNum(d.length)} sub="limit 5,000" />
              <Stat label="Words" value={fmtNum(d.split(/\s+/).filter(Boolean).length)} />
              <Stat label="Links" value={links.length} />
              <Stat label="Hashtags" value={tags.length} />
            </div>
            <CopyBox title="Description" text={d} rows={12} />
            {stamps.length > 0 && <CopyBox title={`Chapters / timestamps (${stamps.length})`} text={stamps.map((x) => x.trim()).join("\n")} />}
            {links.length > 0 && <CopyBox title="Links" text={links.join("\n")} />}
          </>
        );
      }}
    />
  );
}

export function ChannelKeywords() {
  const s = useAsync<YTChannel>();
  return (
    <Card>
      <SearchForm placeholder="Channel link, @handle or any video link" button="Get keywords" loading={s.loading} onSubmit={(v) => s.run(() => apiGet<YTChannel>("/yt/channel", { url: v }))} />
      <ErrorBox error={s.error} />
      {s.loading && <Spinner />}
      {s.data && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.data.thumbnail} alt="" className="w-14 h-14 rounded-full" />
            <div className="min-w-0">
              <a href={s.data.url} target="_blank" rel="noreferrer" className="font-bold text-gray-900 hover:text-red-600">{s.data.title}</a>
              <p className="text-sm text-gray-500">{s.data.handle} · {fmtNum(s.data.subscribers)} subscribers</p>
            </div>
          </div>
          {s.data.keywords?.length ? (
            <>
              <Chips items={s.data.keywords} />
              <CopyBox title="Keywords (comma separated)" text={s.data.keywords.join(", ")} rows={3} />
              <CopyBox title="Keywords (YouTube settings format)" text={s.data.keywordsRaw || ""} rows={3} />
            </>
          ) : (
            <p className="text-gray-600 font-medium">This channel has not set any channel keywords.</p>
          )}
        </div>
      )}
    </Card>
  );
}

export function KeywordGenerator() {
  const s = useAsync<{ suggestions: string[]; questions: string[]; prepositions: string[] }>();
  const [gl, setGl] = useState("IN");
  const groups = s.data ? ([["Keyword ideas", s.data.suggestions], ["Questions", s.data.questions], ["Prepositions & comparisons", s.data.prepositions]] as [string, string[]][]) : [];
  return (
    <Card>
      <SearchForm placeholder="Seed keyword, e.g. haryanvi song" button="Find keywords" loading={s.loading} onSubmit={(v) => s.run(() => apiGet("/yt/keywords", { q: v, gl }))}>
        <div className="max-w-xs">
          <Field label="Country">
            <Select value={gl} onChange={setGl} options={[["IN", "India"], ["US", "United States"], ["GB", "United Kingdom"], ["PK", "Pakistan"], ["NP", "Nepal"], ["AE", "UAE"], ["CA", "Canada"], ["AU", "Australia"]]} />
          </Field>
        </div>
      </SearchForm>
      <ErrorBox error={s.error} />
      {s.loading && <Spinner label="Collecting YouTube search suggestions…" />}
      {s.data && (
        <div className="mt-6 space-y-6">
          {groups.map(([title, items]) => (
            <div key={title}>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <h3 className="font-bold text-gray-900">{title} ({items.length})</h3>
                {items.length > 0 && <CopyButton text={items.join("\n")} label="Copy all" />}
              </div>
              {items.length ? <Chips items={items} /> : <p className="text-sm text-gray-500">No suggestions.</p>}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function AiList({ task, placeholder, button, n = 20, render }: { task: string; placeholder: string; button: string; n?: number; render: (items: unknown[], raw: Record<string, unknown>) => React.ReactNode }) {
  const s = useAsync<Record<string, unknown>>();
  const [lang, setLang] = useState("");
  return (
    <Card>
      <SearchForm placeholder={placeholder} button={button} loading={s.loading} onSubmit={(v) => s.run(() => aiGenerate({ task, input: v, n, language: lang }))}>
        <div className="max-w-xs">
          <LangPicker value={lang} onChange={setLang} />
        </div>
      </SearchForm>
      <ErrorBox error={s.error} />
      {s.loading && <Spinner label="Generating with AI…" />}
      {s.data && <div className="mt-6">{render((s.data.items as unknown[]) || [], s.data)}</div>}
    </Card>
  );
}

export function VideoIdeas() {
  return (
    <AiList
      task="video_ideas"
      placeholder="Your channel niche, e.g. Rajasthani folk music"
      button="Get ideas"
      render={(items) => {
        const list = items as { title: string; angle: string }[];
        return (
          <div className="space-y-3">
            <div className="flex justify-end"><CopyButton text={list.map((x, i) => `${i + 1}. ${x.title} — ${x.angle}`).join("\n")} label="Copy all" /></div>
            {list.map((x, i) => (
              <div key={i} className="rounded-xl border border-gray-200 p-4">
                <div className="font-bold text-gray-900">{i + 1}. {x.title}</div>
                <p className="text-sm text-gray-600 mt-1">{x.angle}</p>
              </div>
            ))}
          </div>
        );
      }}
    />
  );
}

export function HashtagsGenerator() {
  return (
    <AiList
      task="hashtags"
      placeholder="Video topic, e.g. desi wedding dance"
      button="Generate hashtags"
      n={30}
      render={(items) => {
        const tags = [...new Set((items as string[]).map((t) => "#" + String(t).replace(/^#+/, "").replace(/\s+/g, "")))];
        return (
          <div className="space-y-4">
            <Chips items={tags} />
            <CopyBox title="All hashtags" text={tags.join(" ")} rows={3} />
            <CopyBox title="Top 3 (shown above the title)" text={tags.slice(0, 3).join(" ")} rows={1} />
          </div>
        );
      }}
    />
  );
}

export function scoreTitle(title: string, keyword = "") {
  const t = title.trim();
  let s = 40;
  const notes: string[] = [];
  if (t.length >= 30 && t.length <= 70) s += 20; else notes.push(t.length > 70 ? "Too long, may be cut off" : "A bit short");
  if (keyword && t.toLowerCase().includes(keyword.toLowerCase().split(" ")[0])) s += 15;
  if (/\d/.test(t)) s += 8;
  if (/[?!]/.test(t)) s += 5;
  if (/\b(how|why|best|top|new|secret|easy|guide|official|live|full)\b/i.test(t)) s += 7;
  if (/[|:–-]/.test(t)) s += 5;
  if (t === t.toUpperCase() && /[A-Z]/.test(t)) { s -= 15; notes.push("Avoid ALL CAPS"); }
  return { score: Math.max(0, Math.min(100, s)), notes };
}

function ScoreBadge({ score }: { score: number }) {
  const c = score >= 80 ? "bg-green-100 text-green-700" : score >= 60 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700";
  return <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${c}`}>{score}/100</span>;
}

export function TitleGenerator() {
  const [kw, setKw] = useState("");
  return (
    <AiList
      task="titles"
      placeholder="What is your video about?"
      button="Generate titles"
      render={(items) => (
        <div className="space-y-2">
          <input value={kw} onChange={(e) => setKw(e.target.value)} placeholder="Main keyword (optional, improves the score)" className="input-field mb-2" />
          {(items as string[]).map((t, i) => {
            const sc = scoreTitle(String(t), kw);
            return (
              <div key={i} className="flex flex-wrap sm:flex-nowrap items-center gap-3 rounded-xl border border-gray-200 p-3">
                <ScoreBadge score={sc.score} />
                <span className="flex-1 min-w-0 font-medium text-gray-900 break-words">{String(t)}</span>
                <span className="text-xs text-gray-400 shrink-0">{String(t).length} chars</span>
                <CopyButton text={String(t)} />
              </div>
            );
          })}
        </div>
      )}
    />
  );
}

export function ChannelNames() {
  return (
    <AiList
      task="channel_names"
      placeholder="Describe your channel, e.g. Haryanvi comedy shorts"
      button="Generate names"
      n={24}
      render={(items) => (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(items as { name: string; why: string }[]).map((x, i) => (
            <div key={i} className="rounded-xl border border-gray-200 p-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-extrabold text-gray-900 text-lg break-words">{x.name}</div>
                <p className="text-sm text-gray-500">{x.why}</p>
                <a className="text-xs text-blue-600 hover:underline" href={`https://www.youtube.com/@${x.name.replace(/\s+/g, "")}`} target="_blank" rel="noreferrer">Check @{x.name.replace(/\s+/g, "")}</a>
              </div>
              <CopyButton text={x.name} />
            </div>
          ))}
        </div>
      )}
    />
  );
}
