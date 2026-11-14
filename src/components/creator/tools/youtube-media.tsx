"use client";

import { useMemo, useState } from "react";
import { apiGet, fmtDate, fmtNum, imgProxy, videoIdOf, type YTChannel, type YTComment, type YTVideo } from "@/lib/creator/api";
import { safeName } from "@/lib/creator/export";
import { Card, ErrorBox, ExportButtons, Field, SearchForm, Select, Spinner, Toggle, useAsync } from "../ui";

function DownloadImage({ src, name, label }: { src: string; name: string; label: string }) {
  return (
    <div className="rounded-xl border border-gray-200 p-3 space-y-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imgProxy(src)} alt={label} className="w-full rounded-lg bg-gray-100" loading="lazy" />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold text-gray-700">{label}</span>
        <a href={imgProxy(src, name)} className="btn-success !px-4 !py-1.5 !text-sm">⬇ Download</a>
      </div>
    </div>
  );
}

export function BannerDownloader() {
  const s = useAsync<YTChannel>();
  const c = s.data;
  const base = c?.banner || "";
  const avatar = (c?.thumbnails.high || c?.thumbnail || "").replace(/=s\d+[^&]*$/, "=s900-c-k-c0x00ffffff-no-rj");
  return (
    <Card>
      <SearchForm placeholder="Channel link, @handle or video link" button="Get banner" loading={s.loading} onSubmit={(v) => s.run(() => apiGet<YTChannel>("/yt/channel", { url: v }))} />
      <ErrorBox error={s.error} />
      {s.loading && <Spinner />}
      {c && (
        <div className="mt-6 space-y-4">
          <h2 className="font-extrabold text-xl text-gray-900">{c.title}</h2>
          {base ? (
            <div className="grid gap-4">
              <DownloadImage src={`${base}=w2560-fcrop64=1,00000000ffffffff-k-c0xffffffff-no-nd-rj`} name={`${safeName(c.title)}-banner-2560.jpg`} label="Banner · full size 2560×1440" />
              <div className="grid sm:grid-cols-2 gap-4">
                <DownloadImage src={`${base}=w2120-fcrop64=1,00005a57ffffa5a8-k-c0xffffffff-no-nd-rj`} name={`${safeName(c.title)}-banner-tv.jpg`} label="TV / desktop crop" />
                <DownloadImage src={`${base}=w1060-fcrop64=1,00005a57ffffa5a8-k-c0xffffffff-no-nd-rj`} name={`${safeName(c.title)}-banner-1060.jpg`} label="Mobile / web crop" />
              </div>
            </div>
          ) : (
            <p className="text-gray-600">This channel has no banner.</p>
          )}
          {avatar && (
            <div className="max-w-xs">
              <DownloadImage src={avatar} name={`${safeName(c.title)}-logo.jpg`} label="Profile picture · 900×900" />
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

export function ThumbnailDownloader() {
  const [url, setUrl] = useState("");
  const [id, setId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [missing, setMissing] = useState<Set<string>>(new Set());
  const sizes: [string, string][] = [["maxresdefault", "Max resolution · 1280×720"], ["sddefault", "Standard · 640×480"], ["hqdefault", "High · 480×360"], ["mqdefault", "Medium · 320×180"], ["default", "Small · 120×90"]];
  return (
    <Card>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const v = videoIdOf(url);
          setErr(v ? null : "Please paste a valid YouTube video or Shorts link.");
          setMissing(new Set());
          setId(v);
        }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Paste a YouTube video or Shorts link" className="input-field flex-1" />
        <button type="submit" className="btn-primary !px-8 !py-3 !text-lg">Get thumbnails</button>
      </form>
      <ErrorBox error={err} />
      {id && (
        <div className="mt-6 grid sm:grid-cols-2 gap-4">
          {sizes.filter(([k]) => !missing.has(k)).map(([k, label]) => (
            <div key={k} className={k === "maxresdefault" ? "sm:col-span-2" : ""}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://i.ytimg.com/vi/${id}/${k}.jpg`}
                alt=""
                className="hidden"
                onLoad={(e) => {
                  if ((e.target as HTMLImageElement).naturalWidth <= 120 && k !== "default") setMissing((m) => new Set([...m, k]));
                }}
                onError={() => setMissing((m) => new Set([...m, k]))}
              />
              <div className="rounded-xl border border-gray-200 p-3 space-y-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`https://i.ytimg.com/vi/${id}/${k}.jpg`} alt={label} className="w-full rounded-lg bg-gray-100" />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-gray-700">{label}</span>
                  <a href={imgProxy(`https://i.ytimg.com/vi/${id}/${k}.jpg`, `${id}-${k}.jpg`)} className="btn-success !px-4 !py-1.5 !text-sm">⬇ Download</a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

type CommentsRes = { video: YTVideo; items: YTComment[]; threads: number; partial?: boolean };

export function CommentPicker() {
  const s = useAsync<CommentsRes>();
  const [opt, setOpt] = useState({ unique: true, replies: false, keyword: "", count: 1, exclude: "" });
  const [winners, setWinners] = useState<YTComment[]>([]);
  const [rolling, setRolling] = useState(false);
  const pool = useMemo(() => {
    let l = (s.data?.items || []).filter((c) => opt.replies || !c.parentId);
    if (opt.keyword.trim()) l = l.filter((c) => c.text.toLowerCase().includes(opt.keyword.trim().toLowerCase()));
    const ex = opt.exclude.split(",").map((x) => x.trim().toLowerCase()).filter(Boolean);
    if (ex.length) l = l.filter((c) => !ex.some((e) => c.author.toLowerCase().includes(e)));
    if (s.data?.video.channelId) l = l.filter((c) => c.authorChannelId !== s.data!.video.channelId);
    if (opt.unique) {
      const seen = new Set<string>();
      l = l.filter((c) => !seen.has(c.authorChannelId || c.author) && seen.add(c.authorChannelId || c.author));
    }
    return l;
  }, [s.data, opt]);
  const pick = () => {
    setRolling(true);
    setTimeout(() => {
      const arr = [...pool];
      const out: YTComment[] = [];
      const rnd = new Uint32Array(1);
      while (out.length < Math.min(opt.count, arr.length)) {
        crypto.getRandomValues(rnd);
        out.push(arr.splice(rnd[0] % arr.length, 1)[0]);
      }
      setWinners(out);
      setRolling(false);
    }, 900);
  };
  return (
    <Card>
      <SearchForm placeholder="Paste the giveaway video link" button="Load comments" loading={s.loading} onSubmit={(v) => { setWinners([]); s.run(() => apiGet("/yt/comments", { url: v, limit: 5000, replies: true })); }} />
      <ErrorBox error={s.error} />
      {s.loading && <Spinner label="Loading all comments…" />}
      {s.data && (
        <div className="mt-6 space-y-5">
          <p className="text-sm text-gray-500 break-words"><b>{s.data.video.title}</b> · {fmtNum(s.data.items.length)} comments loaded{s.data.partial ? " (very large video: first part loaded)" : ""}</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Must contain word (optional)"><input value={opt.keyword} onChange={(e) => setOpt({ ...opt, keyword: e.target.value })} className="input-field" placeholder="e.g. done" /></Field>
            <Field label="Exclude names (comma separated)"><input value={opt.exclude} onChange={(e) => setOpt({ ...opt, exclude: e.target.value })} className="input-field" /></Field>
            <Field label="Number of winners"><input type="number" min={1} max={50} value={opt.count} onChange={(e) => setOpt({ ...opt, count: Math.max(1, Math.min(50, Number(e.target.value))) })} className="input-field" /></Field>
            <div className="flex flex-col gap-2 justify-center">
              <Toggle label="One entry per person" checked={opt.unique} onChange={(v) => setOpt({ ...opt, unique: v })} />
              <Toggle label="Include replies" checked={opt.replies} onChange={(v) => setOpt({ ...opt, replies: v })} />
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-3">{fmtNum(pool.length)} eligible entries (channel owner excluded)</p>
            <button type="button" disabled={!pool.length || rolling} onClick={pick} className="btn-primary disabled:opacity-50">{rolling ? "🎲 Picking…" : "🎁 Pick winner"}</button>
          </div>
          {winners.map((w, i) => (
            <div key={w.id} className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 flex gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={w.authorImage} alt="" className="w-12 h-12 rounded-full" />
              <div className="min-w-0">
                <div className="font-extrabold text-gray-900">🏆 Winner {winners.length > 1 ? i + 1 : ""}: {w.author}</div>
                <p className="text-sm text-gray-700 break-words whitespace-pre-line">{w.text}</p>
                <p className="text-xs text-gray-500 mt-1">{fmtDate(w.publishedAt)} · <a className="text-blue-600 hover:underline" href={`https://www.youtube.com/watch?v=${s.data!.video.id}&lc=${w.id}`} target="_blank" rel="noreferrer">open comment</a></p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export function CommentsDownloader() {
  const s = useAsync<CommentsRes>();
  const [limit, setLimit] = useState("1000");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("newest");
  const [showReplies, setShowReplies] = useState(true);
  const items = useMemo(() => {
    let l = (s.data?.items || []).filter((c) => showReplies || !c.parentId);
    if (q.trim()) l = l.filter((c) => `${c.author} ${c.text}`.toLowerCase().includes(q.trim().toLowerCase()));
    if (sort === "likes") l = [...l].sort((a, b) => b.likes - a.likes);
    if (sort === "oldest") l = [...l].sort((a, b) => a.publishedAt.localeCompare(b.publishedAt));
    if (sort === "newest") l = [...l].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    if (sort === "replies") l = [...l].sort((a, b) => (b.replyCount || 0) - (a.replyCount || 0));
    return l;
  }, [s.data, q, sort, showReplies]);
  const rows = items.map((c) => ({ Author: c.author, Comment: c.text, Likes: c.likes, Replies: c.replyCount ?? "", "Is reply": c.parentId ? "yes" : "no", Published: c.publishedAt, "Author channel": c.authorChannelId ? `https://www.youtube.com/channel/${c.authorChannelId}` : "", "Comment ID": c.id }));
  return (
    <Card>
      <SearchForm placeholder="Paste a YouTube video link" button="Get comments" loading={s.loading} onSubmit={(v) => s.run(() => apiGet("/yt/comments", { url: v, limit, replies: true }))}>
        <div className="max-w-xs"><Field label="Maximum comment threads"><Select value={limit} onChange={setLimit} options={[["200", "200"], ["1000", "1,000"], ["5000", "5,000"], ["10000", "10,000"]]} /></Field></div>
      </SearchForm>
      <ErrorBox error={s.error} />
      {s.loading && <Spinner label="Downloading comments and replies…" />}
      {s.data && (
        <div className="mt-6 space-y-4">
          <p className="text-sm text-gray-500 break-words"><b>{s.data.video.title}</b> · {fmtNum(s.data.threads)} threads · {fmtNum(s.data.items.length)} comments incl. replies{s.data.partial ? " (very large video: first part loaded)" : ""}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search comments or authors" className="input-field sm:col-span-2" />
            <Select value={sort} onChange={setSort} options={[["newest", "Newest"], ["oldest", "Oldest"], ["likes", "Most liked"], ["replies", "Most replies"]]} />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Toggle label="Show replies" checked={showReplies} onChange={setShowReplies} />
            <ExportButtons rows={rows} name={`comments-${s.data.video.id}`} />
          </div>
          <div className="space-y-2 max-h-[640px] overflow-y-auto">
            {items.slice(0, 500).map((c) => (
              <div key={c.id} className={`rounded-xl border border-gray-100 p-3 ${c.parentId ? "ml-6 sm:ml-10 bg-gray-50" : ""}`}>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <b className="text-gray-900">{c.author}</b>
                  <span className="text-gray-400 text-xs">{fmtDate(c.publishedAt)}</span>
                  <span className="text-gray-500 text-xs">👍 {fmtNum(c.likes)}</span>
                  {!!c.replyCount && <span className="text-gray-500 text-xs">💬 {c.replyCount}</span>}
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-line break-words">{c.text}</p>
              </div>
            ))}
            {items.length > 500 && <p className="text-center text-sm text-gray-500">Showing 500 of {fmtNum(items.length)}. Export to see all.</p>}
          </div>
        </div>
      )}
    </Card>
  );
}
