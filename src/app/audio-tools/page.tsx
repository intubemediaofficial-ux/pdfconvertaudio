import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { tools } from "@/lib/tools";
import { creatorTools } from "@/lib/creator/registry";

export const metadata: Metadata = pageMetadata("/audio-tools");

const groups: { title: string; slugs: string[] }[] = [
  { title: "🔄 Convert", slugs: ["on-hold-audio-converter"] },
  { title: "✂️ Edit", slugs: ["audio-cutter", "audio-joiner", "split-audio", "silence-remover", "reverse-audio", "audio-loop-maker", "audio-looper-extender"] },
  { title: "🎚️ Effects", slugs: ["pitch-changer", "audio-speed-changer", "voice-changer", "8d-audio-converter"] },
  { title: "🥁 Tempo & BPM", slugs: ["tempo-detector", "bpm-changer", "tap-bpm"] },
  { title: "🔊 Sounds", slugs: ["soundboard", "water-eject-sound"] },
];

type Card = { href: string; name: string; description: string; icon: string };

function Grid({ items }: { items: Card[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {items.map((t) => (
        <Link key={t.href} href={t.href} className="tool-card block bg-white border-2 border-gray-100 p-5 hover:border-purple-200">
          <div className="text-3xl mb-3">{t.icon}</div>
          <h3 className="font-bold text-gray-900 text-lg mb-1">{t.name}</h3>
          <p className="text-sm text-gray-500 leading-relaxed">{t.description}</p>
        </Link>
      ))}
    </div>
  );
}

export default function AudioTools() {
  const converters: Card[] = tools.filter((t) => t.category === "Audio Converter").map((t) => ({ href: t.href, name: t.name, description: t.description, icon: t.icon }));
  const byslug = (s: string): Card => {
    const t = creatorTools.find((x) => x.slug === s)!;
    return { href: `/creator-tools/${t.slug}`, name: t.name, description: t.description, icon: t.icon };
  };
  return (
    <div>
      <section className="bg-gradient-to-br from-purple-50 via-white to-pink-50 py-14 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">Audio Tools</h1>
          <p className="text-lg text-gray-500">Convert, cut, join, change pitch or BPM, add effects. Everything runs in your browser — files are never uploaded.</p>
        </div>
      </section>
      <div className="max-w-7xl mx-auto px-4 py-10 space-y-12">
        <section>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-5">🔄 Convert</h2>
          <Grid items={[...converters, ...groups[0].slugs.map(byslug)]} />
        </section>
        {groups.slice(1).map((g) => (
          <section key={g.title}>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-5">{g.title}</h2>
            <Grid items={g.slugs.map(byslug)} />
          </section>
        ))}
      </div>
    </div>
  );
}
