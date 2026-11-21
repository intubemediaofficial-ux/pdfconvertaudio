import { pageMetadata } from "@/lib/seo";
import SeoContent from "@/components/seo/SeoContent";

export const metadata = pageMetadata("/remove-background");

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <SeoContent path="/remove-background" name="Remove Background" />
    </>
  );
}
