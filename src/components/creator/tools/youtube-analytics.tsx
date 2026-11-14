"use client";

import { useEffect, useMemo, useState } from "react";
import { apiGet, compact, fmtDate, fmtDuration, fmtNum, type YTChannel, type YTVideo } from "@/lib/creator/api";
import { Card, Chips, CopyBox, ErrorBox, ExportButtons, Field, Range, SearchForm, Select, Spinner, Stat, useAsync } from "../ui";

export function Top100() {
  const s = useAsync<{ updated: number; comparedTo: string | null; items: YTChannel[] }>();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("subscribers");
  useEffect(() => {
    s.run(() => apiGet("/yt/top100"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const items = useMemo(() => {
    const list = (s.data?.items || []).filter((c) => !q || c.title.toLowerCase().includes(q.toLowerCase()));
    const key = sort as "subscribers" | "views" | "videos";
    return [...list].sort((a, b) => (sort === "growth" ? (b.subscribers - (b.prev?.subscribers ?? b.subscribers)) - (a.subscribers - (a.prev?.subscribers ?? a.subscribers)) : b[key] - a[key]));
  }, [s.data, q, sort]);
  const rows = items.map((c) => ({ Rank: c.rank ?? "", Channel: c.title, Handle: c.handle, Country: c.country, Subscribers: c.subscribers, Views: c.views, Videos: c.videos, URL: c.url }));
  return (
    <Card>
      {s.loading && <Spinner label="Loading the top channels…" />}
      <ErrorBox error={s.error} />
      {s.data && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 items-end justify-between">
            <p className="text-sm text-gray-500">Updated {new Date(s.data.updated * 1000).toLocaleString()} {s.data.comparedTo ? `· changes vs ${s.data.comparedTo}` : "· daily changes appear from tomorrow"}</p>
            <ExportButtons rows={rows} name="top-100-youtube-channels" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by name" className="input-field" />
            <Select value={sort} onChange={setSort} options={[["subscribers", "Sort by subscribers"], ["views", "Sort by views"], ["videos", "Sort by videos"], ["growth", "Sort by subscriber growth"]]} />
          </div>
          <div className="overflow-x-auto -mx-5 sm:mx-0">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-2 px-2">#</th><th className="px-2">Channel</th><th className="px-2 text-right">Subscribers</th><th className="px-2 text-right">Views</th><th className="px-2 text-right">Videos</th><th className="px-2 text-right">Change</th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => {
                  const dSubs = c.prev ? c.subscribers - c.prev.subscribers : null;
                  const dRank = c.prev ? c.prev.rank - (c.rank ?? 0) : null;
                  return (
                    <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 px-2 font-bold text-gray-700">{c.rank}</td>
                      <td className="px-2">
                        <a href={c.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 font-semibold text-gray-900 hover:text-red-600">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={c.thumbnails.default || c.thumbnail} alt="" className="w-8 h-8 rounded-full" loading="lazy" />
                          <span className="truncate max-w-[220px]">{c.title}</span>
                          {c.country && <span className="text-xs text-gray-400">{c.country}</span>}
                        </a>
                      </td>
                      <td className="px-2 text-right font-semibold">{compact(c.subscribers)}</td>
                      <td className="px-2 text-right">{compact(c.views)}</td>
                      <td className="px-2 text-right">{fmtNum(c.videos)}</td>
                      <td className="px-2 text-right text-xs">
                        {dSubs === null ? "—" : <span className={dSubs >= 0 ? "text-green-600" : "text-red-600"}>{dSubs >= 0 ? "+" : ""}{compact(dSubs)}</span>}
                        {dRank ? <span className={`ml-1 ${dRank > 0 ? "text-green-600" : "text-red-600"}`}>{dRank > 0 ? "▲" : "▼"}{Math.abs(dRank)}</span> : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Card>
  );
}

const NICHES: [string, string, number][] = [
  ["general", "General / Entertainment", 1],
  ["music", "Music", 0.6],
  ["gaming", "Gaming", 0.8],
  ["education", "Education", 1.6],
  ["tech", "Tech & Reviews", 2],
  ["finance", "Finance & Business", 3.5],
  ["comedy", "Comedy / Vlogs", 0.9],
  ["kids", "Kids (made for kids)", 0.4],
  ["news", "News & Politics", 0.9],
  ["devotional", "Devotional / Bhajan", 0.6],
];
const COUNTRIES: [string, string, number][] = [
  ["IN", "India", 0.25],
  ["US", "United States", 2.5],
  ["GB", "United Kingdom", 2],
  ["CA", "Canada", 2],
  ["AU", "Australia", 2.2],
  ["DE", "Germany", 1.8],
  ["AE", "UAE", 1.2],
  ["PK", "Pakistan", 0.15],
  ["BD", "Bangladesh", 0.15],
  ["BR", "Brazil", 0.5],
  ["MIX", "Worldwide mix", 0.8],
];

export function AdMoney() {
  const [views, setViews] = useState(10000);
  const [niche, setNiche] = useState("general");
  const [country, setCountry] = useState("IN");
  const [monetized, setMonetized] = useState(55);
  const nm = NICHES.find((n) => n[0] === niche)![2];
  const cm = COUNTRIES.find((c) => c[0] === country)![2];
  const baseRpm = 2.2 * nm * cm;
  const low = baseRpm * 0.6, high = baseRpm * 1.5;
  const daily = (rpm: number) => (views * (monetized / 100) * rpm) / 1000;
  const usd = (v: number) => `$${v.toLocaleString("en-US", { maximumFractionDigits: v < 100 ? 2 : 0 })}`;
  const inr = (v: number) => `₹${Math.round(v * 84).toLocaleString("en-IN")}`;
  const rows: [string, number][] = [["Daily", 1], ["Monthly", 30], ["Yearly", 365]];
  return (
    <Card className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Daily views">
          <input type="number" min={0} value={views} onChange={(e) => setViews(Math.max(0, Number(e.target.value)))} className="input-field" />
        </Field>
        <Field label="Niche"><Select value={niche} onChange={setNiche} options={NICHES.map(([v, l]) => [v, l])} /></Field>
        <Field label="Main audience"><Select value={country} onChange={setCountry} options={COUNTRIES.map(([v, l]) => [v, l])} /></Field>
        <Range label="Views that show ads" value={monetized} onChange={setMonetized} min={10} max={100} suffix="%" />
      </div>
      <p className="text-sm text-gray-500">Estimated RPM (your earnings per 1,000 views after YouTube&apos;s 45% share): <b>{usd(low)} – {usd(high)}</b></p>
      <div className="grid sm:grid-cols-3 gap-3">
        {rows.map(([l, m]) => (
          <Stat key={l} label={`${l} earnings`} value={`${usd(daily(low) * m)} – ${usd(daily(high) * m)}`} sub={`${inr(daily(low) * m)} – ${inr(daily(high) * m)}`} />
        ))}
      </div>
      <p className="text-xs text-gray-400">Estimates only. Real earnings depend on watch time, ad formats, season, Shorts vs long videos and advertiser demand.</p>
    </Card>
  );
}

export function ChannelStats() {
  const s = useAsync<{ channel: YTChannel; items: YTVideo[] }>();
  const [limit, setLimit] = useState("50");
  const d = s.data;
  const avg = (f: (v: YTVideo) => number) => (d && d.items.length ? d.items.reduce((t, v) => t + f(v), 0) / d.items.length : 0);
  const rows = (d?.items || []).map((v) => ({ Title: v.title, Published: v.publishedAt.slice(0, 10), Duration: fmtDuration(v.duration), Views: v.views, Likes: v.likes, Comments: v.comments, Category: v.category, URL: v.url }));
  return (
    <Card>
      <SearchForm placeholder="Channel link, @handle or video link" button="Check stats" loading={s.loading} onSubmit={(v) => s.run(() => apiGet("/yt/channel-videos", { url: v, limit }))}>
        <div className="max-w-xs"><Field label="Recent videos to analyse"><Select value={limit} onChange={setLimit} options={[["25", "25"], ["50", "50"], ["100", "100"], ["200", "200"]]} /></Field></div>
      </SearchForm>
      <ErrorBox error={s.error} />
      {s.loading && <Spinner />}
      {d && (
        <div className="mt-6 space-y-5">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={d.channel.thumbnail} alt="" className="w-16 h-16 rounded-full" />
            <div className="min-w-0">
              <a href={d.channel.url} target="_blank" rel="noreferrer" className="text-xl font-extrabold text-gray-900 hover:text-red-600">{d.channel.title}</a>
              <p className="text-sm text-gray-500">{d.channel.handle} · joined {fmtDate(d.channel.publishedAt)} {d.channel.country && `· ${d.channel.country}`}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="Subscribers" value={d.channel.hiddenSubscribers ? "Hidden" : compact(d.channel.subscribers)} sub={fmtNum(d.channel.subscribers)} />
            <Stat label="Total views" value={compact(d.channel.views)} sub={fmtNum(d.channel.views)} />
            <Stat label="Videos" value={fmtNum(d.channel.videos)} />
            <Stat label="Views / video" value={compact(d.channel.views / Math.max(1, d.channel.videos))} />
            <Stat label={`Avg views (last ${d.items.length})`} value={compact(avg((v) => v.views))} />
            <Stat label="Avg likes" value={compact(avg((v) => v.likes))} />
            <Stat label="Avg comments" value={compact(avg((v) => v.comments))} />
            <Stat label="Engagement" value={`${((avg((v) => v.likes + v.comments) / Math.max(1, avg((v) => v.views))) * 100).toFixed(2)}%`} sub="(likes+comments)/views" />
          </div>
          <div className="flex justify-end"><ExportButtons rows={rows} name={`${d.channel.title}-stats`} /></div>
          <div className="overflow-x-auto -mx-5 sm:mx-0">
            <table className="w-full text-sm min-w-[640px]">
              <thead><tr className="text-left text-gray-500 border-b"><th className="py-2 px-2">Video</th><th className="px-2">Date</th><th className="px-2 text-right">Views</th><th className="px-2 text-right">Likes</th><th className="px-2 text-right">Comments</th></tr></thead>
              <tbody>
                {d.items.map((v) => (
                  <tr key={v.id} className="border-b border-gray-100">
                    <td className="py-2 px-2"><a href={v.url} target="_blank" rel="noreferrer" className="hover:text-red-600 line-clamp-2">{v.title}</a></td>
                    <td className="px-2 whitespace-nowrap">{fmtDate(v.publishedAt)}</td>
                    <td className="px-2 text-right">{fmtNum(v.views)}</td>
                    <td className="px-2 text-right">{fmtNum(v.likes)}</td>
                    <td className="px-2 text-right">{fmtNum(v.comments)}</td>
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

export function VideoData() {
  const s = useAsync<YTVideo>();
  const v = s.data;
  return (
    <Card>
      <SearchForm placeholder="Paste a YouTube video link" button="View data" loading={s.loading} onSubmit={(x) => s.run(() => apiGet<YTVideo>("/yt/video", { url: x }))} />
      <ErrorBox error={s.error} />
      {s.loading && <Spinner />}
      {v && (
        <div className="mt-6 space-y-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={v.thumbnail} alt="" className="w-full max-w-xl rounded-xl mx-auto" />
          <h2 className="text-xl font-extrabold text-gray-900 break-words">{v.title}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="Views" value={compact(v.views)} sub={fmtNum(v.views)} />
            <Stat label="Likes" value={compact(v.likes)} sub={fmtNum(v.likes)} />
            <Stat label="Comments" value={compact(v.comments)} sub={fmtNum(v.comments)} />
            <Stat label="Duration" value={fmtDuration(v.duration)} />
          </div>
          <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {([
              ["Video ID", v.id],
              ["Channel", v.channelTitle],
              ["Channel ID", v.channelId],
              ["Published", new Date(v.publishedAt).toLocaleString()],
              ["Category", `${v.category} (${v.categoryId})`],
              ["Language", v.defaultLanguage || "—"],
              ["Quality", v.definition.toUpperCase()],
              ["Dimension", v.dimension.toUpperCase()],
              ["Captions", v.caption ? "Yes" : "No"],
              ["Licensed content", v.licensedContent ? "Yes" : "No"],
              ["Privacy", v.privacyStatus],
              ["Embeddable", v.embeddable ? "Yes" : "No"],
              ["Made for kids", v.madeForKids ? "Yes" : "No"],
              ["License", v.license],
              ["Live", v.liveBroadcastContent],
              ["Topics", v.topics.join(", ") || "—"],
            ] as [string, string][]).map(([k, val]) => (
              <div key={k} className="flex justify-between gap-3 border-b border-gray-100 py-1.5">
                <dt className="text-gray-500">{k}</dt>
                <dd className="font-semibold text-gray-900 text-right break-all">{val}</dd>
              </div>
            ))}
          </dl>
          {v.tags.length > 0 && (
            <div><h3 className="font-bold mb-2">Tags ({v.tags.length})</h3><Chips items={v.tags} /></div>
          )}
          <CopyBox title="Description" text={v.description || ""} rows={8} />
          <div>
            <h3 className="font-bold mb-2">Thumbnails</h3>
            <div className="flex flex-wrap gap-2 text-sm">
              {Object.entries(v.thumbnails).map(([k, u]) => (
                <a key={k} href={u} target="_blank" rel="noreferrer" className="rounded-lg border px-3 py-1.5 hover:bg-gray-50">{k}</a>
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
