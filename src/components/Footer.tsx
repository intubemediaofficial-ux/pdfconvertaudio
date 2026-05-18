import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-white font-semibold mb-4">Organize</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/merge-pdf" className="hover:text-white">Merge PDF</Link></li>
              <li><Link href="/split-pdf" className="hover:text-white">Split PDF</Link></li>
              <li><Link href="/rotate-pdf" className="hover:text-white">Rotate PDF</Link></li>
              <li><Link href="/organize-pdf" className="hover:text-white">Organize PDF</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">Convert</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/pdf-to-jpg" className="hover:text-white">PDF to JPG</Link></li>
              <li><Link href="/jpg-to-pdf" className="hover:text-white">JPG to PDF</Link></li>
              <li><Link href="/pdf-to-word" className="hover:text-white">PDF to Word</Link></li>
              <li><Link href="/html-to-pdf" className="hover:text-white">HTML to PDF</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">Edit & Security</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/edit-pdf" className="hover:text-white">Edit PDF</Link></li>
              <li><Link href="/compress-pdf" className="hover:text-white">Compress PDF</Link></li>
              <li><Link href="/sign-pdf" className="hover:text-white">Sign PDF</Link></li>
              <li><Link href="/watermark-pdf" className="hover:text-white">Watermark</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">Security</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/protect-pdf" className="hover:text-white">Protect PDF</Link></li>
              <li><Link href="/unlock-pdf" className="hover:text-white">Unlock PDF</Link></li>
              <li><Link href="/page-numbers" className="hover:text-white">Page Numbers</Link></li>
              <li><Link href="/crop-pdf" className="hover:text-white">Crop PDF</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm">
          <p className="flex items-center justify-center gap-2">
            <span className="text-xl">📄</span>
            <span className="text-red-400 font-bold">PDF</span>
            <span className="text-white font-bold">Tools</span>
            <span className="ml-2">— Free Online PDF Tools</span>
          </p>
          <p className="mt-2 text-gray-500">
            All PDF processing happens directly in your browser. Your files never leave your device.
          </p>
        </div>
      </div>
    </footer>
  );
}
