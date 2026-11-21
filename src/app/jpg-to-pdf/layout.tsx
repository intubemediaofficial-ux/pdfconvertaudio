import { pageMetadata } from "@/lib/seo";
import SeoContent from "@/components/seo/SeoContent";

export const metadata = pageMetadata("/jpg-to-pdf");

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <SeoContent path="/jpg-to-pdf" name="JPG to PDF" />
    </>
  );
}
