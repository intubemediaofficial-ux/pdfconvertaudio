import { faqsFor, jsonLdString, pageMetadata, seoFor } from "@/lib/seo";
import HomeClient from "@/components/HomeClient";

export const metadata = pageMetadata("/");

export default function Page() {
  const e = seoFor("/")!;
  const faqs = faqsFor(e);
  const ld = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(ld) }} />
      <HomeClient h1={e.h1 ?? "Free PDF, Audio and YouTube Creator Tools"} faqs={faqs} />
    </>
  );
}
