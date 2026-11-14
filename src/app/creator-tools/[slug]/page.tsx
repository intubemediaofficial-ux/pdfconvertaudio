import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { creatorTools, getCreatorTool } from "@/lib/creator/registry";
import ToolRenderer from "@/components/creator/ToolRenderer";

export const dynamicParams = false;

export function generateStaticParams() {
  return creatorTools.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const tool = getCreatorTool(slug);
  if (!tool) return {};
  return { title: `${tool.name} - Free Online Tool | Creator Tools`, description: tool.description };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getCreatorTool(slug);
  if (!tool) notFound();
  const related = creatorTools.filter((t) => t.category === tool.category && t.slug !== tool.slug).slice(0, 6);
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
      <nav className="text-sm text-gray-500 mb-4">
        <Link href="/creator-tools" className="hover:text-red-500">Creator Tools</Link> <span className="mx-1">›</span> {tool.category}
      </nav>
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">{tool.icon}</div>
        <h1 className="page-title">{tool.name}</h1>
        <p className="page-desc">{tool.description}</p>
      </div>
      <ToolRenderer slug={tool.slug} />
      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="text-xl font-extrabold text-gray-900 mb-4">More {tool.category}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {related.map((t) => (
              <Link key={t.slug} href={`/creator-tools/${t.slug}`} className="tool-card block bg-white border border-gray-200 p-4">
                <div className="font-bold text-gray-900">{t.icon} {t.name}</div>
                <p className="text-sm text-gray-500 mt-1">{t.description}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
