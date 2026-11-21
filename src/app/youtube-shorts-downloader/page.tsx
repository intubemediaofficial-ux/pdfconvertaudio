import DownloaderLanding from "@/components/DownloaderLanding";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/youtube-shorts-downloader");

export default function Page() {
  return <DownloaderLanding path="/youtube-shorts-downloader" />;
}
