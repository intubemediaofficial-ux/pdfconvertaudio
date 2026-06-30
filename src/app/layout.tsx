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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `if(typeof Uint8Array.prototype.toHex!=='function'){Uint8Array.prototype.toHex=function(){return Array.from(this).map(function(b){return b.toString(16).padStart(2,'0')}).join('')};}if(typeof Uint8Array.fromHex!=='function'){Uint8Array.fromHex=function(hex){var bytes=new Uint8Array(hex.length/2);for(var i=0;i<hex.length;i+=2){bytes[i/2]=parseInt(hex.substring(i,i+2),16)}return bytes};}if(typeof Map.prototype.getOrInsertComputed!=='function'){Map.prototype.getOrInsertComputed=function(key,cb){if(this.has(key))return this.get(key);var v=cb(key);this.set(key,v);return v};}`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
