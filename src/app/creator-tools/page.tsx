import type { Metadata } from "next";
import CreatorToolsIndex from "@/components/creator/CreatorToolsIndex";

export const metadata: Metadata = {
  title: "Free Creator Tools - YouTube, Audio, Image & Podcast Tools",
  description:
    "48 free tools for creators: YouTube tags, titles, keywords, channel stats, thumbnail and banner downloader, comment picker, audio cutter, pitch and BPM changer, 8D audio and more.",
};

export default function Page() {
  return <CreatorToolsIndex />;
}
