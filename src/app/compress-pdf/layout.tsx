import { pageMetadata } from "@/lib/seo";
import SeoContent from "@/components/seo/SeoContent";

export const metadata = pageMetadata("/compress-pdf");

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <SeoContent path="/compress-pdf" name="Compress PDF" />
    </>
  );
}
