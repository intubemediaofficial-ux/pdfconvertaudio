import { pageMetadata } from "@/lib/seo";
import HomeClient from "@/components/HomeClient";

export const metadata = pageMetadata("/");

export default function Page() {
  return <HomeClient />;
}
