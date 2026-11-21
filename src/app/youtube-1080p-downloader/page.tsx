import DownloaderLanding from "@/components/DownloaderLanding";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/youtube-1080p-downloader");

export default function Page() {
  return <DownloaderLanding path="/youtube-1080p-downloader" />;
}
