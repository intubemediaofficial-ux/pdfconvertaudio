import Link from "next/link";
import { SITE_NAME, SITE_URL, faqsFor, jsonLdString, seoFor, stepsFor } from "@/lib/seo";
import { tools } from "@/lib/tools";
import { creatorTools } from "@/lib/creator/registry";

function sectionOf(path: string): { name: string; href: string } {
  if (path.startsWith("/creator-tools/")) {
    const slug = path.split("/").pop();
    const t = creatorTools.find((c) => c.slug === slug);
    if (t?.category === "Audio & Sound Tools") return { name: "Audio Tools", href: "/audio-tools" };
    return { name: "Creator Tools", href: "/creator-tools" };
  }
  const t = tools.find((x) => x.href === path);
  if (t?.category === "Audio Converter") return { name: "Audio Tools", href: "/audio-tools" };
  if (t?.category === "Image Tools") return { name: "Image Tools", href: "/" };
  return { name: "PDF Tools", href: "/" };
}

const appCategory: Record<string, string> = {
  pdf: "BusinessApplication",
  audio: "MultimediaApplication",
  image: "MultimediaApplication",
  "image-server": "MultimediaApplication",
  youtube: "UtilitiesApplication",
  ai: "UtilitiesApplication",
  calc: "UtilitiesApplication",
  hub: "UtilitiesApplication",
};

export default function SeoContent({ path, name }: { path: string; name: string }) {
  const e = seoFor(path);
  if (!e) return null;
  const faqs = faqsFor(e);
  const steps = stepsFor(name, e);
  const section = sectionOf(path);
  const toolMeta = tools.find((t) => t.href === path);
  const related = toolMeta
    ? tools.filter((t) => t.category === toolMeta.category && t.href !== path).slice(0, 6)
    : [];
  const url = `${SITE_URL}${path}`;
  const ld = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: e.h1 ?? name,
      url,
      description: e.description,
      applicationCategory: appCategory[e.kind],
      operatingSystem: "Any (web browser)",
      browserRequirements: "Requires JavaScript",
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        ...(section.href !== "/" ? [{ "@type": "ListItem", position: 2, name: section.name, item: `${SITE_URL}${section.href}` }] : []),
        { "@type": "ListItem", position: section.href !== "/" ? 3 : 2, name: e.h1 ?? name, item: url },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: `How to use ${e.h1 ?? name}`,
      step: steps.map((s, i) => ({ "@type": "HowToStep", position: i + 1, text: s })),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
    },
  ];

  return (
    <section className="seo-content max-w-5xl mx-auto px-4 pb-16 pt-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(ld) }} />
      <div className="grid gap-6 md:grid-cols-2">
        <div className="glass-panel p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-4">How to use {e.h1 ?? name}</h2>
          <ol className="space-y-3">
            {steps.map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="step-dot">{i + 1}</span>
                <span className="text-gray-600 leading-relaxed">{s}</span>
              </li>
            ))}
          </ol>
          <p className="mt-5 text-sm text-gray-500 leading-relaxed">{e.description}</p>
        </div>
        <div className="glass-panel p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-4">Frequently asked questions</h2>
          <div className="space-y-2">
            {faqs.map(([q, a]) => (
              <details key={q} className="faq-item group">
                <summary className="cursor-pointer font-semibold text-gray-800 py-2 list-none flex justify-between gap-3">
                  <span>{q}</span>
                  <span className="faq-plus">+</span>
                </summary>
                <p className="text-gray-600 pb-3 leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
      {related.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-extrabold text-gray-900 mb-4">Related tools</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {related.map((t) => (
              <Link key={t.href} href={t.href} className="glass-panel tool-card p-4 font-semibold text-gray-800 hover:text-red-600">
                <span className="mr-2">{t.icon}</span>{t.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
