"use client";

import { useMemo, useState } from "react";
import { apiGet, compact, fmtDate, fmtDuration, fmtNum, videoIdOf, type YTChannel, type YTVideo } from "@/lib/creator/api";
import { Card, CopyBox, CopyButton, ErrorBox, ExportButtons, Field, SearchForm, Select, Spinner, Stat, Toggle, useAsync } from "../ui";

function ChannelHeader({ c }: { c: YTChannel }) {
  return (
    <div className="flex items-center gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={c.thumbnail} alt="" className="w-14 h-14 rounded-full shrink-0" />
      <div className="min-w-0">
        <a href={c.url} target="_blank" rel="noreferrer" className="font-bold text-gray-900 hover:text-red-600 break-words">{c.title}</a>
        <p className="text-sm text-gray-500">{c.handle} · {c.hiddenSubscribers ? "hidden" : fmtNum(c.subscribers)} subscribers · {fmtNum(c.videos)} videos</p>
      </div>
    </div>
  );
}

export function ChannelIdFinder() {
  const s = useAsync<YTChannel>();
  return (
    <Card>
      <SearchForm placeholder="Channel link, @handle, /c/ name or any video link" button="Find ID" loading={s.loading} onSubmit={(v) => s.run(() => apiGet<YTChannel>("/yt/channel", { url: v }))} />
      <ErrorBox error={s.error} />
      {s.loading && <Spinner />}
      {s.data && (
        <div className="mt-6 space-y-4">
          <ChannelHeader c={s.data} />
          <div className="rounded-xl bg-gray-900 text-white p-4 flex flex-wrap items-center justify-between gap-3">
            <code className="text-lg sm:text-xl font-bold break-all">{s.data.id}</code>
            <CopyButton text={s.data.id} label="Copy ID" />
          </div>
          <CopyBox title="Channel URL" text={s.data.url} rows={1} />
          {s.data.uploads && <CopyBox title="Uploads playlist ID" text={s.data.uploads} rows={1} />}
          <CopyBox title="RSS feed" text={`https://www.youtube.com/feeds/videos.xml?channel_id=${s.data.id}`} rows={1} />
        </div>
      )}
    </Card>
  );
}

export function SubscribeLink() {
  const s = useAsync<YTChannel>();
  const link = s.data ? `https://www.youtube.com/channel/${s.data.id}?sub_confirmation=1` : "";
  const handleLink = s.data?.handle ? `https://www.youtube.com/${s.data.handle}?sub_confirmation=1` : "";
  const html = `<a href="${link}" target="_blank" rel="noopener" style="display:inline-block;background:#ff0000;color:#fff;padding:10px 18px;border-radius:6px;font:600 15px Arial,sans-serif;text-decoration:none">▶ Subscribe</a>`;
  return (
    <Card>
      <SearchForm placeholder="Channel link, @handle or video link" button="Create link" loading={s.loading} onSubmit={(v) => s.run(() => apiGet<YTChannel>("/yt/channel", { url: v }))} />
      <ErrorBox error={s.error} />
      {s.loading && <Spinner />}
      {s.data && (
        <div className="mt-6 space-y-4">
          <ChannelHeader c={s.data} />
          <CopyBox title="Subscribe link" text={link} rows={1} />
          {handleLink && <CopyBox title="Subscribe link (@handle)" text={handleLink} rows={1} />}
          <CopyBox title="Button HTML for websites" text={html} rows={3} />
          <div className="flex flex-wrap gap-3 items-center">
            <span dangerouslySetInnerHTML={{ __html: html }} />
            <a href={link} target="_blank" rel="noreferrer" className="text-blue-600 text-sm hover:underline">Test the link ↗</a>
          </div>
        </div>
      )}
    </Card>
  );
}

function toSec(t: string) {
  const p = t.trim().split(":").map(Number);
  if (p.some((x) => Number.isNaN(x))) return 0;
  return p.reduce((acc, x) => acc * 60 + x, 0);
}

export function VideoEmbedder() {
  const [url, setUrl] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [o, setO] = useState({ autoplay: false, mute: false, loop: false, controls: true, privacy: true, cc: false, responsive: true });
  const [w, setW] = useState(560);
  const id = videoIdOf(url);
  const code = useMemo(() => {
    if (!id) return "";
    const p = new URLSearchParams();
    if (o.autoplay) p.set("autoplay", "1");
    if (o.mute || o.autoplay) p.set("mute", "1");
    if (o.loop) { p.set("loop", "1"); p.set("playlist", id); }
    if (!o.controls) p.set("controls", "0");
    if (o.cc) p.set("cc_load_policy", "1");
    if (start) p.set("start", String(toSec(start)));
    if (end) p.set("end", String(toSec(end)));
    p.set("rel", "0");
    const src = `https://www.youtube${o.privacy ? "-nocookie" : ""}.com/embed/${id}?${p.toString()}`;
    const iframe = `<iframe ${o.responsive ? 'style="position:absolute;top:0;left:0;width:100%;height:100%;border:0"' : `width="${w}" height="${Math.round((w * 9) / 16)}" style="border:0"`} src="${src}" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
    return { src, html: o.responsive ? `<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden">${iframe}</div>` : iframe };
  }, [id, o, start, end, w]);
  return (
    <Card className="space-y-5">
      <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Paste a YouTube video link" className="input-field" />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Field label="Start at (m:ss)"><input value={start} onChange={(e) => setStart(e.target.value)} placeholder="0:30" className="input-field" /></Field>
        <Field label="End at (m:ss)"><input value={end} onChange={(e) => setEnd(e.target.value)} placeholder="2:00" className="input-field" /></Field>
        {!o.responsive && <Field label="Width (px)"><input type="number" value={w} onChange={(e) => setW(Number(e.target.value) || 560)} className="input-field" /></Field>}
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {(Object.keys(o) as (keyof typeof o)[]).map((k) => (
          <Toggle key={k} label={{ autoplay: "Autoplay", mute: "Mute", loop: "Loop", controls: "Show controls", privacy: "Privacy-enhanced", cc: "Captions on", responsive: "Responsive" }[k]} checked={o[k]} onChange={(v) => setO({ ...o, [k]: v })} />
        ))}
      </div>
      {url && !id && <ErrorBox error="That doesn't look like a YouTube video link." />}
      {code && (
        <>
          <CopyBox title="Embed code" text={code.html} rows={4} />
          <div className="relative w-full overflow-hidden rounded-xl" style={{ paddingBottom: "56.25%" }}>
            <iframe className="absolute inset-0 w-full h-full" src={code.src} title="Preview" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
          </div>
        </>
      )}
    </Card>
  );
}

export function ChannelSearch() {
  const s = useAsync<{ items: YTChannel[] }>();
  const [sort, setSort] = useState("relevance");
  const items = useMemo(() => {
    const l = [...(s.data?.items || [])];
    if (sort !== "relevance") l.sort((a, b) => (b[sort as "subscribers"] as number) - (a[sort as "subscribers"] as number));
    return l;
  }, [s.data, sort]);
  const rows = items.map((c) => ({ Channel: c.title, Handle: c.handle, ID: c.id, Subscribers: c.subscribers, Views: c.views, Videos: c.videos, Country: c.country, URL: c.url }));
  return (
    <Card>
      <SearchForm placeholder="Search channels, e.g. rasiya" button="Search" loading={s.loading} onSubmit={(v) => s.run(() => apiGet("/yt/search-channels", { q: v, limit: 25 }))} />
      <ErrorBox error={s.error} />
      {s.loading && <Spinner />}
      {s.data && (
        <div className="mt-6 space-y-3">
          <div className="flex flex-wrap gap-3 justify-between items-center">
            <div className="w-56"><Select value={sort} onChange={setSort} options={[["relevance", "Most relevant"], ["subscribers", "Most subscribers"], ["views", "Most views"], ["videos", "Most videos"]]} /></div>
            <ExportButtons rows={rows} name="channel-search" />
          </div>
          {items.length === 0 && <p className="text-gray-500">No channels found.</p>}
          {items.map((c) => (
            <div key={c.id} className="flex flex-wrap sm:flex-nowrap items-center gap-3 rounded-xl border border-gray-200 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.thumbnails.default || c.thumbnail} alt="" className="w-12 h-12 rounded-full" loading="lazy" />
              <div className="min-w-0 flex-1">
                <a href={c.url} target="_blank" rel="noreferrer" className="font-bold text-gray-900 hover:text-red-600 break-words">{c.title}</a>
                <p className="text-xs text-gray-500 break-all">{c.handle} · {c.id}</p>
              </div>
              <div className="flex gap-4 text-sm text-right ml-auto">
                <div><div className="font-bold">{c.hiddenSubscribers ? "—" : compact(c.subscribers)}</div><div className="text-xs text-gray-500">subs</div></div>
                <div><div className="font-bold">{compact(c.views)}</div><div className="text-xs text-gray-500">views</div></div>
                <div><div className="font-bold">{fmtNum(c.videos)}</div><div className="text-xs text-gray-500">videos</div></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export function TimestampGenerator() {
  const [url, setUrl] = useState("");
  const [lines, setLines] = useState("0:00 Intro\n");
  const [one, setOne] = useState("");
  const id = videoIdOf(url);
  const parsed = lines.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
    const m = l.match(/^\(?(\d{1,2}(?::\d{1,2}){1,2})\)?\s*[-–:]?\s*(.*)$/);
    return m ? { t: m[1], sec: toSec(m[1]), label: m[2] } : null;
  }).filter(Boolean) as { t: string; sec: number; label: string }[];
  const chapters = parsed.map((p) => `${p.t} ${p.label}`).join("\n");
  const links = id ? parsed.map((p) => `${p.label || p.t}: https://youtu.be/${id}?t=${p.sec}`).join("\n") : "";
  const warn = parsed.length && (parsed[0].sec !== 0 ? "YouTube chapters must start at 0:00." : parsed.length < 3 ? "YouTube needs at least 3 chapters." : parsed.some((p, i) => i && p.sec - parsed[i - 1].sec < 10) ? "Each chapter must be at least 10 seconds long." : "");
  return (
    <Card className="space-y-5">
      <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="YouTube video link (for clickable links)" className="input-field" />
      <div className="flex flex-col sm:flex-row gap-3">
        <input value={one} onChange={(e) => setOne(e.target.value)} placeholder="Single timestamp, e.g. 1:23" className="input-field flex-1" />
        {id && one && <CopyBox title="Link" text={`https://youtu.be/${id}?t=${toSec(one)}`} rows={1} />}
      </div>
      <Field label="Chapters (one per line: time + title)">
        <textarea value={lines} onChange={(e) => setLines(e.target.value)} rows={8} className="input-field font-mono text-sm" placeholder={"0:00 Intro\n1:15 Verse\n3:40 Chorus"} />
      </Field>
      {warn && <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">{warn}</p>}
      {parsed.length > 0 && <CopyBox title="Chapters for your description" text={chapters} rows={Math.min(10, parsed.length + 1)} />}
      {links && <CopyBox title="Timestamp links" text={links} rows={Math.min(10, parsed.length + 1)} />}
    </Card>
  );
}

type PlaylistRes = { playlist: { id: string; title: string; channelTitle: string; description: string; thumbnail: string; itemCount: number }; items: YTVideo[]; unavailable: number };

export function PlaylistLength() {
  const s = useAsync<PlaylistRes>();
  const [from, setFrom] = useState(1);
  const [to, setTo] = useState(0);
  const d = s.data;
  const range = d ? d.items.slice(Math.max(0, from - 1), to > 0 ? to : undefined) : [];
  const total = range.reduce((t, v) => t + v.duration, 0);
  return (
    <Card>
      <SearchForm placeholder="Paste a playlist link" button="Calculate" loading={s.loading} onSubmit={(v) => { setFrom(1); setTo(0); s.run(() => apiGet("/yt/playlist", { url: v, limit: 2000 })); }} />
      <ErrorBox error={s.error} />
      {s.loading && <Spinner label="Reading the playlist…" />}
      {d && (
        <div className="mt-6 space-y-5">
          <div>
            <h2 className="text-xl font-extrabold text-gray-900 break-words">{d.playlist.title}</h2>
            <p className="text-sm text-gray-500">{d.playlist.channelTitle} · {d.items.length} videos{d.unavailable ? ` · ${d.unavailable} private/deleted skipped` : ""}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 max-w-sm">
            <Field label="From video #"><input type="number" min={1} value={from} onChange={(e) => setFrom(Math.max(1, Number(e.target.value)))} className="input-field" /></Field>
            <Field label="To video # (0 = end)"><input type="number" min={0} value={to} onChange={(e) => setTo(Math.max(0, Number(e.target.value)))} className="input-field" /></Field>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Stat label="Videos" value={range.length} />
            <Stat label="Total length" value={fmtDuration(total)} />
            <Stat label="Average video" value={fmtDuration(total / Math.max(1, range.length))} />
            {[1.25, 1.5, 1.75, 2].map((sp) => <Stat key={sp} label={`At ${sp}x`} value={fmtDuration(total / sp)} />)}
          </div>
        </div>
      )}
    </Card>
  );
}

export function PlaylistToText() {
  const s = useAsync<PlaylistRes>();
  const [fields, setFields] = useState({ num: true, title: true, url: true, channel: false, duration: false, views: false, date: false, description: false });
  const d = s.data;
  const rows = (d?.items || []).map((v, i) => {
    const r: Record<string, string | number> = {};
    if (fields.num) r["#"] = i + 1;
    if (fields.title) r.Title = v.title;
    if (fields.url) r.URL = v.url;
    if (fields.channel) r.Channel = v.channelTitle;
    if (fields.duration) r.Duration = fmtDuration(v.duration);
    if (fields.views) r.Views = v.views;
    if (fields.date) r.Published = v.publishedAt.slice(0, 10);
    if (fields.description) r.Description = v.description || "";
    return r;
  });
  const txt = rows.map((r) => Object.values(r).join(fields.description ? "\n" : " | ")).join(fields.description ? "\n\n" : "\n");
  return (
    <Card>
      <SearchForm placeholder="Paste a playlist link" button="Convert" loading={s.loading} onSubmit={(v) => s.run(() => apiGet("/yt/playlist", { url: v, limit: 2000 }))}>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {(Object.keys(fields) as (keyof typeof fields)[]).map((k) => (
            <Toggle key={k} label={{ num: "Number", title: "Title", url: "Link", channel: "Channel", duration: "Duration", views: "Views", date: "Date", description: "Description" }[k]} checked={fields[k]} onChange={(v) => setFields({ ...fields, [k]: v })} />
          ))}
        </div>
      </SearchForm>
      <ErrorBox error={s.error} />
      {s.loading && <Spinner label="Reading the playlist…" />}
      {d && (
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-bold text-gray-900 break-words">{d.playlist.title} · {d.items.length} videos</p>
            <ExportButtons rows={rows} name={d.playlist.title || "playlist"} txt={txt} />
          </div>
          <CopyBox title="Text" text={txt} rows={14} />
        </div>
      )}
    </Card>
  );
}

export function CategoryChecker() {
  const [mode, setMode] = useState("videos");
  const s = useAsync<{ items: YTVideo[]; channel?: YTChannel }>();
  const items = s.data?.items || [];
  const counts = items.reduce<Record<string, number>>((m, v) => ((m[v.category] = (m[v.category] || 0) + 1), m), {});
  const rows = items.map((v) => ({ Title: v.title, Category: v.category, "Category ID": v.categoryId, URL: v.url }));
  return (
    <Card>
      <div className="flex gap-2 mb-4">
        {[["videos", "Video links"], ["channel", "Whole channel"]].map(([k, l]) => (
          <button key={k} type="button" onClick={() => { setMode(k); s.setData(null); }} className={`px-4 py-2 rounded-lg font-semibold text-sm border ${mode === k ? "bg-red-500 text-white border-red-500" : "bg-white border-gray-300"}`}>{l}</button>
        ))}
      </div>
      <SearchForm
        key={mode}
        multiline={mode === "videos"}
        placeholder={mode === "videos" ? "Paste one or more video links (one per line, up to 200)" : "Channel link or @handle"}
        button="Check categories"
        loading={s.loading}
        onSubmit={(v) => s.run(() => (mode === "videos" ? apiGet("/yt/videos", { urls: v }) : apiGet("/yt/channel-videos", { url: v, limit: 200 })))}
      />
      <ErrorBox error={s.error} />
      {s.loading && <Spinner />}
      {s.data && (
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            {Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([c, n]) => (
              <span key={c} className="rounded-full bg-blue-50 border border-blue-100 px-3 py-1 text-sm font-semibold text-blue-800">{c}: {n}</span>
            ))}
          </div>
          <div className="flex justify-end"><ExportButtons rows={rows} name="video-categories" /></div>
          <div className="divide-y divide-gray-100">
            {items.map((v) => (
              <div key={v.id} className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 py-2">
                <a href={v.url} target="_blank" rel="noreferrer" className="text-sm text-gray-900 hover:text-red-600 min-w-0 break-words">{v.title}</a>
                <span className="text-sm font-bold text-blue-700 shrink-0">{v.category}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

export function ChannelVideoList() {
  const s = useAsync<{ channel: YTChannel; items: YTVideo[] }>();
  const [limit, setLimit] = useState("500");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("date");
  const items = useMemo(() => {
    const l = (s.data?.items || []).filter((v) => !q || v.title.toLowerCase().includes(q.toLowerCase()));
    if (sort === "views") l.sort((a, b) => b.views - a.views);
    if (sort === "likes") l.sort((a, b) => b.likes - a.likes);
    if (sort === "oldest") l.sort((a, b) => a.publishedAt.localeCompare(b.publishedAt));
    return l;
  }, [s.data, q, sort]);
  const rows = items.map((v, i) => ({ "#": i + 1, Title: v.title, Published: v.publishedAt.slice(0, 10), Duration: fmtDuration(v.duration), Views: v.views, Likes: v.likes, Comments: v.comments, Category: v.category, URL: v.url }));
  return (
    <Card>
      <SearchForm placeholder="Channel link, @handle or video link" button="Extract videos" loading={s.loading} onSubmit={(v) => s.run(() => apiGet("/yt/channel-videos", { url: v, limit }))}>
        <div className="max-w-xs"><Field label="Maximum videos"><Select value={limit} onChange={setLimit} options={[["100", "100"], ["500", "500"], ["1000", "1,000"], ["2000", "2,000"]]} /></Field></div>
      </SearchForm>
      <ErrorBox error={s.error} />
      {s.loading && <Spinner label="Collecting all videos… big channels take a few seconds" />}
      {s.data && (
        <div className="mt-6 space-y-4">
          <ChannelHeader c={s.data.channel} />
          {s.data.items.length === 0 && <p className="text-gray-600 font-medium">This channel has no public videos yet.</p>}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by title" className="input-field sm:col-span-2" />
            <Select value={sort} onChange={setSort} options={[["date", "Newest first"], ["oldest", "Oldest first"], ["views", "Most viewed"], ["likes", "Most liked"]]} />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-gray-500">{items.length} videos</p>
            <ExportButtons rows={rows} name={`${s.data.channel.title}-videos`} txt={rows.map((r) => `${r.Title} | ${r.URL}`).join("\n")} />
          </div>
          <div className="overflow-x-auto -mx-5 sm:mx-0 max-h-[600px]">
            <table className="w-full text-sm min-w-[600px]">
              <thead className="sticky top-0 bg-white"><tr className="text-left text-gray-500 border-b"><th className="py-2 px-2">#</th><th className="px-2">Title</th><th className="px-2">Date</th><th className="px-2 text-right">Views</th><th className="px-2 text-right">Length</th></tr></thead>
              <tbody>
                {items.map((v, i) => (
                  <tr key={v.id} className="border-b border-gray-100">
                    <td className="py-1.5 px-2 text-gray-400">{i + 1}</td>
                    <td className="px-2"><a href={v.url} target="_blank" rel="noreferrer" className="hover:text-red-600">{v.title}</a></td>
                    <td className="px-2 whitespace-nowrap">{fmtDate(v.publishedAt)}</td>
                    <td className="px-2 text-right">{fmtNum(v.views)}</td>
                    <td className="px-2 text-right">{fmtDuration(v.duration)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Card>
  );
}
