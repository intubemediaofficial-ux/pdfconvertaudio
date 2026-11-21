import DownloaderLanding from "@/components/DownloaderLanding";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/yt-downloader");

export default function Page() {
  return <DownloaderLanding path="/yt-downloader" />;
}
