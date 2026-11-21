import type { Metadata, Viewport } from "next";
import { SITE_NAME, SITE_URL, jsonLdString } from "@/lib/seo";
import { Geist } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BackBar from "@/components/BackBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `Free PDF, Audio & YouTube Creator Tools | ${SITE_NAME}`, template: `%s | ${SITE_NAME}` },
  description:
    "Free online PDF tools, audio converter, AI background remover and YouTube creator tools. Fast, private and no sign-up.",
  applicationName: SITE_NAME,
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = { themeColor: "#0b0b1a" };

const siteLd = [
  { "@context": "https://schema.org", "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
  { "@context": "https://schema.org", "@type": "Organization", name: SITE_NAME, url: SITE_URL, parentOrganization: { "@type": "Organization", name: "Bainsla Music", url: "https://bainslamusic.com" } },
];

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
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(siteLd) }} />
      </head>
      <body className="min-h-full flex flex-col">
        <Header />
        <BackBar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
