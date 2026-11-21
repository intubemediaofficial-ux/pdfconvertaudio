import DownloaderLanding from "@/components/DownloaderLanding";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/youtube-to-mp3");

export default function Page() {
  return <DownloaderLanding path="/youtube-to-mp3" />;
}
