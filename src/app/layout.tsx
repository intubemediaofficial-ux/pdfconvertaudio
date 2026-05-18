import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PDF Tools - Free Online PDF Editor & Converter",
  description:
    "Every tool you need to work with PDFs in one place. Merge, split, compress, convert, rotate, unlock and watermark PDFs — 100% free, no upload required. All processing happens in your browser.",
  keywords:
    "PDF tools, merge PDF, split PDF, compress PDF, PDF to Word, PDF editor, free PDF tools, online PDF",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
