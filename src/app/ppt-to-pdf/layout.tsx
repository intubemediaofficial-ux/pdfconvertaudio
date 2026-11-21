import { pageMetadata } from "@/lib/seo";
import SeoContent from "@/components/seo/SeoContent";

export const metadata = pageMetadata("/ppt-to-pdf");

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <SeoContent path="/ppt-to-pdf" name="PowerPoint to PDF" />
    </>
  );
}
