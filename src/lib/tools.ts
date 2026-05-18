export interface Tool {
  id: string;
  name: string;
  description: string;
  href: string;
  icon: string;
  color: string;
  category: string;
}

export const categories = [
  "All",
  "Organize PDF",
  "Optimize PDF",
  "Convert PDF",
  "Edit PDF",
  "PDF Security",
] as const;

export type Category = (typeof categories)[number];

export const tools: Tool[] = [
  // Organize PDF
  {
    id: "merge",
    name: "Merge PDF",
    description: "Combine PDFs in the order you want with the easiest PDF merger available.",
    href: "/merge-pdf",
    icon: "📄➕📄",
    color: "bg-red-50 border-red-200",
    category: "Organize PDF",
  },
  {
    id: "split",
    name: "Split PDF",
    description: "Separate one page or a whole set for easy conversion into independent PDF files.",
    href: "/split-pdf",
    icon: "✂️",
    color: "bg-orange-50 border-orange-200",
    category: "Organize PDF",
  },
  {
    id: "organize",
    name: "Organize PDF",
    description: "Sort pages of your PDF file however you like. Delete or add PDF pages.",
    href: "/organize-pdf",
    icon: "🗂️",
    color: "bg-purple-50 border-purple-200",
    category: "Organize PDF",
  },
  {
    id: "rotate",
    name: "Rotate PDF",
    description: "Rotate your PDFs the way you need them. You can even rotate multiple PDFs at once!",
    href: "/rotate-pdf",
    icon: "🔄",
    color: "bg-blue-50 border-blue-200",
    category: "Organize PDF",
  },

  // Optimize PDF
  {
    id: "compress",
    name: "Compress PDF",
    description: "Reduce file size while optimizing for maximal PDF quality.",
    href: "/compress-pdf",
    icon: "📦",
    color: "bg-green-50 border-green-200",
    category: "Optimize PDF",
  },

  // Convert PDF
  {
    id: "pdf-to-word",
    name: "PDF to Word",
    description: "Easily convert your PDF files into easy to edit DOC and DOCX documents.",
    href: "/pdf-to-word",
    icon: "📝",
    color: "bg-blue-50 border-blue-200",
    category: "Convert PDF",
  },
  {
    id: "pdf-to-jpg",
    name: "PDF to JPG",
    description: "Convert each PDF page into a JPG image or extract all images contained in a PDF.",
    href: "/pdf-to-jpg",
    icon: "🖼️",
    color: "bg-yellow-50 border-yellow-200",
    category: "Convert PDF",
  },
  {
    id: "jpg-to-pdf",
    name: "JPG to PDF",
    description: "Convert JPG images to PDF in seconds. Easily adjust orientation and margins.",
    href: "/jpg-to-pdf",
    icon: "🖼️➡️📄",
    color: "bg-amber-50 border-amber-200",
    category: "Convert PDF",
  },
  {
    id: "word-to-pdf",
    name: "Word to PDF",
    description: "Make DOC and DOCX files easy to read by converting them to PDF.",
    href: "/word-to-pdf",
    icon: "📃",
    color: "bg-indigo-50 border-indigo-200",
    category: "Convert PDF",
  },
  {
    id: "html-to-pdf",
    name: "HTML to PDF",
    description: "Convert webpages in HTML to PDF. Copy and paste the URL and convert it to PDF.",
    href: "/html-to-pdf",
    icon: "🌐",
    color: "bg-cyan-50 border-cyan-200",
    category: "Convert PDF",
  },
  {
    id: "pdf-to-ppt",
    name: "PDF to PowerPoint",
    description: "Turn your PDF files into easy to edit PPT and PPTX slideshows.",
    href: "/pdf-to-ppt",
    icon: "📊",
    color: "bg-rose-50 border-rose-200",
    category: "Convert PDF",
  },
  {
    id: "pdf-to-excel",
    name: "PDF to Excel",
    description: "Pull data straight from PDFs into Excel spreadsheets in a few short seconds.",
    href: "/pdf-to-excel",
    icon: "📊",
    color: "bg-emerald-50 border-emerald-200",
    category: "Convert PDF",
  },
  {
    id: "excel-to-pdf",
    name: "Excel to PDF",
    description: "Make EXCEL spreadsheets easy to read by converting them to PDF.",
    href: "/excel-to-pdf",
    icon: "📋",
    color: "bg-teal-50 border-teal-200",
    category: "Convert PDF",
  },
  {
    id: "ppt-to-pdf",
    name: "PowerPoint to PDF",
    description: "Make PPT and PPTX slideshows easy to view by converting them to PDF.",
    href: "/ppt-to-pdf",
    icon: "📑",
    color: "bg-pink-50 border-pink-200",
    category: "Convert PDF",
  },

  // Edit PDF
  {
    id: "edit",
    name: "Edit PDF",
    description: "Add text, images, shapes or freehand annotations to a PDF document. Edit existing text inline.",
    href: "/edit-pdf",
    icon: "✏️",
    color: "bg-violet-50 border-violet-200",
    category: "Edit PDF",
  },
  {
    id: "page-numbers",
    name: "Page Numbers",
    description: "Add page numbers into PDFs with ease. Choose your positions, dimensions, typography.",
    href: "/page-numbers",
    icon: "🔢",
    color: "bg-slate-50 border-slate-200",
    category: "Edit PDF",
  },
  {
    id: "crop",
    name: "Crop PDF",
    description: "Crop margins of PDF documents or select specific areas.",
    href: "/crop-pdf",
    icon: "✂️📐",
    color: "bg-lime-50 border-lime-200",
    category: "Edit PDF",
  },

  // PDF Security
  {
    id: "sign",
    name: "Sign PDF",
    description: "Sign yourself or request electronic signatures from others.",
    href: "/sign-pdf",
    icon: "🖊️",
    color: "bg-emerald-50 border-emerald-200",
    category: "PDF Security",
  },
  {
    id: "watermark",
    name: "Watermark",
    description: "Stamp an image or text over your PDF in seconds. Choose typography, transparency and position.",
    href: "/watermark-pdf",
    icon: "💧",
    color: "bg-sky-50 border-sky-200",
    category: "PDF Security",
  },
  {
    id: "unlock",
    name: "Unlock PDF",
    description: "Remove PDF password security, giving you the freedom to use your PDFs as you want.",
    href: "/unlock-pdf",
    icon: "🔓",
    color: "bg-yellow-50 border-yellow-200",
    category: "PDF Security",
  },
  {
    id: "protect",
    name: "Protect PDF",
    description: "Protect PDF files with a password. Encrypt PDF documents to prevent unauthorized access.",
    href: "/protect-pdf",
    icon: "🔒",
    color: "bg-red-50 border-red-200",
    category: "PDF Security",
  },
];
