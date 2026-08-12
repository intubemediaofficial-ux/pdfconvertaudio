import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div>
            <h3 className="text-white font-bold text-lg mb-5">Organize</h3>
            <ul className="space-y-3 text-base">
              <li><Link href="/merge-pdf" className="hover:text-white transition">Merge PDF</Link></li>
              <li><Link href="/split-pdf" className="hover:text-white transition">Split PDF</Link></li>
              <li><Link href="/rotate-pdf" className="hover:text-white transition">Rotate PDF</Link></li>
              <li><Link href="/organize-pdf" className="hover:text-white transition">Organize PDF</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-bold text-lg mb-5">Convert</h3>
            <ul className="space-y-3 text-base">
              <li><Link href="/pdf-to-jpg" className="hover:text-white transition">PDF to JPG</Link></li>
              <li><Link href="/jpg-to-pdf" className="hover:text-white transition">JPG to PDF</Link></li>
              <li><Link href="/pdf-to-word" className="hover:text-white transition">PDF to Word</Link></li>
              <li><Link href="/pdf-to-excel" className="hover:text-white transition">PDF to Excel</Link></li>
              <li><Link href="/pdf-to-ppt" className="hover:text-white transition">PDF to PowerPoint</Link></li>
              <li><Link href="/html-to-pdf" className="hover:text-white transition">HTML to PDF</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-bold text-lg mb-5">Edit</h3>
            <ul className="space-y-3 text-base">
              <li><Link href="/edit-pdf" className="hover:text-white transition">Edit PDF</Link></li>
              <li><Link href="/compress-pdf" className="hover:text-white transition">Compress PDF</Link></li>
              <li><Link href="/watermark-pdf" className="hover:text-white transition">Watermark</Link></li>
              <li><Link href="/page-numbers" className="hover:text-white transition">Page Numbers</Link></li>
              <li><Link href="/crop-pdf" className="hover:text-white transition">Crop PDF</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-bold text-lg mb-5">Security</h3>
            <ul className="space-y-3 text-base">
              <li><Link href="/sign-pdf" className="hover:text-white transition">Sign PDF</Link></li>
              <li><Link href="/protect-pdf" className="hover:text-white transition">Protect PDF</Link></li>
              <li><Link href="/unlock-pdf" className="hover:text-white transition">Unlock PDF</Link></li>
              <li><Link href="/compare-pdf" className="hover:text-white transition">Compare PDF</Link></li>
              <li><Link href="/redact-pdf" className="hover:text-white transition">Redact PDF</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-bold text-lg mb-5">Audio &amp; Image</h3>
            <ul className="space-y-3 text-base">
              <li><Link href="/audio-converter" className="hover:text-white transition">Audio Converter</Link></li>
              <li><Link href="/mp3-to-wav" className="hover:text-white transition">MP3 to WAV</Link></li>
              <li><Link href="/wav-to-mp3" className="hover:text-white transition">WAV to MP3</Link></li>
              <li><Link href="/mp4-to-mp3" className="hover:text-white transition">MP4 to MP3</Link></li>
              <li><Link href="/mp4-to-wav" className="hover:text-white transition">MP4 to WAV</Link></li>
              <li><Link href="/remove-background" className="hover:text-white transition">Remove Background</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-10 pt-10 text-center">
          <p className="flex items-center justify-center gap-2 text-lg">
            <span className="text-2xl">📄</span>
            <span className="text-red-400 font-extrabold text-xl">PDF</span>
            <span className="text-white font-extrabold text-xl">Tools</span>
            <span className="ml-2 text-gray-400">— Free Online PDF Tools</span>
          </p>
          <p className="mt-3 text-gray-500 text-base">
            All PDF and audio processing happens directly in your browser — those
            files never leave your device. Remove Background is the one exception:
            photos are sent to our server, processed instantly and never stored.
          </p>
        </div>
      </div>
    </footer>
  );
}
