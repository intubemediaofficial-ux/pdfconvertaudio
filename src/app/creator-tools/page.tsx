import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import CreatorToolsIndex from "@/components/creator/CreatorToolsIndex";

export const metadata: Metadata = pageMetadata("/creator-tools");

export default function Page() {
  return <CreatorToolsIndex />;
}
