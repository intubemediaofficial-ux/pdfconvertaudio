import { pageMetadata } from "@/lib/seo";
import SeoContent from "@/components/seo/SeoContent";

export const metadata = pageMetadata("/pdf-to-excel");

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <SeoContent path="/pdf-to-excel" name="PDF to Excel" />
    </>
  );
}
