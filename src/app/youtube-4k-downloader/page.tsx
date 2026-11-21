import DownloaderLanding from "@/components/DownloaderLanding";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/youtube-4k-downloader");

export default function Page() {
  return <DownloaderLanding path="/youtube-4k-downloader" />;
}
