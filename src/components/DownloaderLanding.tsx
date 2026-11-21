import Link from "next/link";
import { MediaDownloader } from "@/components/creator/tools/youtube-media";
import SeoContent from "@/components/seo/SeoContent";
import { downloaderPage, downloaderPages } from "@/lib/downloader-pages";
import { seoFor } from "@/lib/seo";

export default function DownloaderLanding({ path }: { path: string }) {
  const d = downloaderPage(path)!;
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">{d.icon}</div>
        <h1 className="page-title">{seoFor(path)?.h1 ?? d.name}</h1>
        <p className="page-desc">{d.tagline}</p>
      </div>
      <MediaDownloader initialTab={d.tab} />
      <SeoContent path={path} name={d.name} />
      <section className="mt-14">
        <h2 className="text-xl font-extrabold text-gray-900 mb-4">More YouTube downloaders</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {downloaderPages.filter((x) => x.path !== path).map((x) => (
            <Link key={x.path} href={x.path} className="tool-card block bg-white border border-gray-200 p-4">
              <div className="font-bold text-gray-900">{x.icon} {x.name}</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
