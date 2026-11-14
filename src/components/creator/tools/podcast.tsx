"use client";

import { useState } from "react";
import { aiGenerate } from "@/lib/creator/api";
import { Card, CopyButton, ErrorBox, Field, Range, SearchForm, Select, Spinner, Stat, useAsync } from "../ui";
import { scoreTitle } from "./youtube-seo";

export function PodcastTitles() {
  const s = useAsync<{ items: string[] }>();
  const [tone, setTone] = useState("");
  return (
    <Card>
      <SearchForm placeholder="What is the episode about? Guest name, topic, key takeaway…" button="Generate titles" loading={s.loading} onSubmit={(v) => s.run(() => aiGenerate({ task: "podcast_titles", input: v, n: 15, tone }))}>
        <div className="max-w-xs"><Field label="Tone"><Select value={tone} onChange={setTone} options={[["", "Any"], ["Curious", "Curious"], ["Bold", "Bold"], ["Funny", "Funny"], ["Professional", "Professional"], ["Emotional", "Emotional"]]} /></Field></div>
      </SearchForm>
      <ErrorBox error={s.error} />
      {s.loading && <Spinner label="Generating with AI…" />}
      {s.data && (
        <div className="mt-6 space-y-2">
          {s.data.items.map((t, i) => (
            <div key={i} className="flex flex-wrap sm:flex-nowrap items-center gap-3 rounded-xl border border-gray-200 p-3">
              <span className="flex-1 min-w-0 font-medium text-gray-900 break-words">{t}</span>
              <span className="text-xs text-gray-400">{t.length} chars</span>
              <CopyButton text={t} />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

interface Check { score: number; clarity: number; curiosity: number; seo: number; length: number; notes: string[]; items: string[] }

export function PodcastTitleChecker() {
  const s = useAsync<Check & { local: ReturnType<typeof scoreTitle>; title: string }>();
  return (
    <Card>
      <SearchForm placeholder="Paste your episode title" button="Check title" loading={s.loading} onSubmit={(v) => s.run(async () => ({ ...(await aiGenerate<Check>({ task: "podcast_title_check", input: v, n: 6 })), local: scoreTitle(v), title: v }))} />
      <ErrorBox error={s.error} />
      {s.loading && <Spinner label="Analysing…" />}
      {s.data && (
        <div className="mt-6 space-y-5">
          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-28 h-28 rounded-full text-4xl font-extrabold ${s.data.score >= 75 ? "bg-green-100 text-green-700" : s.data.score >= 55 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>{s.data.score}</div>
            <p className="text-sm text-gray-500 mt-2">{s.data.title.length} characters · aim for 40–70</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="Clarity" value={s.data.clarity} />
            <Stat label="Curiosity" value={s.data.curiosity} />
            <Stat label="Search / SEO" value={s.data.seo} />
            <Stat label="Length" value={s.data.length} />
          </div>
          <ul className="list-disc pl-5 space-y-1 text-gray-700">{[...(s.data.notes || []), ...s.data.local.notes].map((n, i) => <li key={i}>{n}</li>)}</ul>
          <div className="space-y-2">
            <h3 className="font-bold text-gray-900">Better alternatives</h3>
            {(s.data.items || []).map((t, i) => (
              <div key={i} className="flex flex-wrap sm:flex-nowrap items-center gap-3 rounded-xl border border-gray-200 p-3">
                <span className="flex-1 min-w-0 font-medium break-words">{t}</span>
                <CopyButton text={t} />
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

export function SpotifyEarnings() {
  const [plays, setPlays] = useState(20000);
  const [premium, setPremium] = useState(30);
  const [rate, setRate] = useState(25);
  const [videoShare, setVideoShare] = useState(20);
  const [ads, setAds] = useState(true);
  const premiumPayout = (plays * (premium / 100) * rate) / 1000;
  const videoBonus = premiumPayout * (videoShare / 100) * 0.5;
  const adRev = ads ? (plays * (1 - premium / 100) * 0.6 * 12) / 1000 * 0.5 : 0;
  const monthly = premiumPayout + videoBonus + adRev;
  const usd = (v: number) => `$${v.toLocaleString("en-US", { maximumFractionDigits: v < 100 ? 2 : 0 })}`;
  return (
    <Card className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Monthly plays / streams"><input type="number" min={0} value={plays} onChange={(e) => setPlays(Math.max(0, Number(e.target.value)))} className="input-field" /></Field>
        <Range label="Listeners on Spotify Premium" value={premium} onChange={setPremium} min={0} max={100} suffix="%" />
        <Range label="Payout per 1,000 premium plays (USD)" value={rate} onChange={setRate} min={5} max={60} />
        <Range label="Plays that are video episodes" value={videoShare} onChange={setVideoShare} min={0} max={100} suffix="%" />
      </div>
      <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700"><input type="checkbox" checked={ads} onChange={(e) => setAds(e.target.checked)} className="accent-red-500" /> Include ad revenue from free listeners (Spotify Audience Network)</label>
      <div className="grid sm:grid-cols-3 gap-3">
        <Stat label="Monthly" value={usd(monthly)} sub={`₹${Math.round(monthly * 84).toLocaleString("en-IN")}`} />
        <Stat label="Yearly" value={usd(monthly * 12)} sub={`₹${Math.round(monthly * 12 * 84).toLocaleString("en-IN")}`} />
        <Stat label="Per 1,000 plays" value={usd((monthly / Math.max(1, plays)) * 1000)} />
      </div>
      <p className="text-xs text-gray-400">Rough estimate based on the Spotify Partner Program model (premium engagement payouts + ad share). Eligibility rules and real rates vary by market.</p>
    </Card>
  );
}
