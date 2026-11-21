import Link from "next/link";

export default function Footer() {
  return (
    <footer className="surface-dark text-white/70 mt-16">
      <div className="aurora opacity-40" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-5">Organize</h3>
            <ul className="space-y-2.5 text-[15px]">
              <li><Link href="/merge-pdf" className="hover:text-white transition">Merge PDF</Link></li>
              <li><Link href="/split-pdf" className="hover:text-white transition">Split PDF</Link></li>
              <li><Link href="/rotate-pdf" className="hover:text-white transition">Rotate PDF</Link></li>
              <li><Link href="/organize-pdf" className="hover:text-white transition">Organize PDF</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-5">Convert</h3>
            <ul className="space-y-2.5 text-[15px]">
              <li><Link href="/pdf-to-jpg" className="hover:text-white transition">PDF to JPG</Link></li>
              <li><Link href="/jpg-to-pdf" className="hover:text-white transition">JPG to PDF</Link></li>
              <li><Link href="/pdf-to-word" className="hover:text-white transition">PDF to Word</Link></li>
              <li><Link href="/pdf-to-excel" className="hover:text-white transition">PDF to Excel</Link></li>
              <li><Link href="/pdf-to-ppt" className="hover:text-white transition">PDF to PowerPoint</Link></li>
              <li><Link href="/html-to-pdf" className="hover:text-white transition">HTML to PDF</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-5">Edit</h3>
            <ul className="space-y-2.5 text-[15px]">
              <li><Link href="/edit-pdf" className="hover:text-white transition">Edit PDF</Link></li>
              <li><Link href="/compress-pdf" className="hover:text-white transition">Compress PDF</Link></li>
              <li><Link href="/watermark-pdf" className="hover:text-white transition">Watermark</Link></li>
              <li><Link href="/page-numbers" className="hover:text-white transition">Page Numbers</Link></li>
              <li><Link href="/crop-pdf" className="hover:text-white transition">Crop PDF</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-5">Security</h3>
            <ul className="space-y-2.5 text-[15px]">
              <li><Link href="/sign-pdf" className="hover:text-white transition">Sign PDF</Link></li>
              <li><Link href="/protect-pdf" className="hover:text-white transition">Protect PDF</Link></li>
              <li><Link href="/unlock-pdf" className="hover:text-white transition">Unlock PDF</Link></li>
              <li><Link href="/compare-pdf" className="hover:text-white transition">Compare PDF</Link></li>
              <li><Link href="/redact-pdf" className="hover:text-white transition">Redact PDF</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-5">Audio &amp; Image</h3>
            <ul className="space-y-2.5 text-[15px]">
              <li><Link href="/audio-converter" className="hover:text-white transition">Audio Converter</Link></li>
              <li><Link href="/mp3-to-wav" className="hover:text-white transition">MP3 to WAV</Link></li>
              <li><Link href="/wav-to-mp3" className="hover:text-white transition">WAV to MP3</Link></li>
              <li><Link href="/mp4-to-mp3" className="hover:text-white transition">MP4 to MP3</Link></li>
              <li><Link href="/mp4-to-wav" className="hover:text-white transition">MP4 to WAV</Link></li>
              <li><Link href="/remove-background" className="hover:text-white transition">Remove Background</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-5">YouTube</h3>
            <ul className="space-y-2.5 text-[15px]">
              <li><Link href="/creator-tools/youtube-tags-generator" className="hover:text-white transition">Tags Generator</Link></li>
              <li><Link href="/creator-tools/youtube-title-generator" className="hover:text-white transition">Title Generator</Link></li>
              <li><Link href="/creator-tools/youtube-keyword-generator" className="hover:text-white transition">Keyword Generator</Link></li>
              <li><Link href="/creator-tools/youtube-hashtags-extractor" className="hover:text-white transition">Hashtags Extractor</Link></li>
              <li><Link href="/creator-tools/youtube-channel-id-finder" className="hover:text-white transition">Channel ID Finder</Link></li>
              <li><Link href="/creator-tools" className="hover:text-white transition">All Creator Tools</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 mt-12 pt-10 flex flex-col md:flex-row gap-6 md:items-center md:justify-between">
          <div className="max-w-2xl">
            <Link href="/" className="inline-flex items-center gap-2.5 font-extrabold text-xl text-white">
              <img src="/icon.png" alt="" width={30} height={30} className="rounded-[9px]" />
              <span>Bainsla<span className="gradient-text">Tools</span></span>
            </Link>
            <p className="mt-3 text-white/50 text-sm leading-relaxed">
              Free online PDF, audio, image and YouTube creator tools. PDF and audio files are processed in your browser and never leave your device. Remove Background sends photos to our server, processes them instantly and never stores them.
            </p>
          </div>
          <p className="text-white/40 text-sm shrink-0">© {new Date().getFullYear()} Bainsla Music</p>
        </div>
      </div>
    </footer>
  );
}
