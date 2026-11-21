export type SeoKind = "pdf" | "audio" | "image-server" | "image" | "youtube" | "ai" | "calc" | "hub";

export interface SeoEntry {
  title: string;
  description: string;
  keywords: string[];
  h1?: string;
  kind: SeoKind;
  steps?: string[];
  faqs?: [string, string][];
}

export const seoData: Record<string, SeoEntry> = {
  "/": {
    kind: "hub",
    title: "Free PDF Tools, Audio Converter, Background Remover & YouTube Tools",
    description:
      "75+ free online tools in one place: merge, split, compress and convert PDF, audio converter and cutter, AI background remover, YouTube video downloader (4K MP4 & MP3), YouTube tags, titles, channel ID finder and more. No sign-up.",
    keywords: ["free online tools", "pdf tools", "pdf converter", "audio converter", "background remover", "youtube downloader", "youtube video downloader", "youtube tools", "youtube tag generator", "channel id finder"],
  },
  "/audio-tools": {
    kind: "hub",
    title: "Free Online Audio Tools - Converter, Cutter, Joiner, Pitch & BPM",
    description:
      "All audio tools in one place: MP3/WAV converter, MP4 to MP3, audio cutter, joiner, splitter, speed, pitch and BPM changer, voice changer, silence remover, 8D audio and tap BPM. Runs in your browser.",
    keywords: ["online audio tools", "audio converter", "audio cutter", "audio joiner", "pitch changer", "bpm changer", "8d audio converter", "mp4 to mp3"],
  },
  "/creator-tools": {
    kind: "hub",
    title: "Free YouTube Creator Tools - Tags, Titles, Keywords, Channel Stats",
    description:
      "Free YouTube tools for creators: YouTube video downloader (4K, MP3), tag generator and extractor, title and hashtag generator, keyword research, channel ID finder, thumbnail and banner downloader, comment picker, channel stats and more.",
    keywords: ["youtube tools", "youtube creator tools", "youtube tag generator", "youtube seo tools", "free youtube tools", "youtube channel tools"],
  },

  "/youtube-downloader": {
    kind: "youtube",
    h1: "YouTube Downloader",
    title: "YouTube Downloader - Download YouTube Videos in 4K, 1080p MP4 & MP3 Free",
    description:
      "Free YouTube downloader: paste a link and download YouTube videos as MP4 in 4K (2160p), 2K, 1080p, 720p or as MP3 audio. Fast, no sign-up, no app, works on phone and PC.",
    keywords: ["youtube downloader", "youtube video downloader", "download youtube video", "yt downloader", "youtube video download", "youtube downloader online", "free youtube downloader", "youtube to mp4", "youtube to mp3", "youtube 4k downloader", "youtube video download hd", "save youtube video", "youtube download link", "y2mate alternative", "savefrom alternative"],
    steps: ["Copy the YouTube video link from the app or browser.", "Paste it in the box above. The video opens instantly, no button needed.", "Pick MP4 quality (4K, 1080p, 720p…) or MP3 and the download starts."],
    faqs: [
      ["How do I download a YouTube video?", "Copy the video link, paste it above and choose a quality. The file downloads straight to your phone or computer."],
      ["Can I download YouTube videos in 4K?", "Yes. If the video was uploaded in 4K you get 2160p, plus 2K (1440p), 1080p, 720p and lower."],
      ["Does it work on mobile?", "Yes, it works in any browser on Android, iPhone, Windows and Mac. No app needed."],
      ["Is there a download limit?", "No daily limit. You can run several downloads at the same time."],
      ["Can I download only the audio?", "Yes. Switch to the Audio tab for MP3 (320, 192 or 128 kbps) or M4A."],
      ["Is it allowed to download YouTube videos?", "Only download videos you own or have permission to use, and respect the creator's copyright."],
    ],
  },
  "/youtube-to-mp4": {
    kind: "youtube",
    h1: "YouTube to MP4 Converter",
    title: "YouTube to MP4 - Convert & Download YouTube Videos to MP4 HD Free",
    description:
      "Convert YouTube to MP4 online for free. Download YouTube videos as MP4 in 1080p Full HD, 720p HD, 4K and every other quality. No sign-up, no software.",
    keywords: ["youtube to mp4", "youtube to mp4 converter", "youtube mp4 download", "convert youtube to mp4", "yt to mp4", "youtube video to mp4", "youtube to mp4 1080p", "youtube to mp4 hd"],
    steps: ["Copy the YouTube link.", "Paste it in the box. The video opens instantly.", "Choose the MP4 quality and download."],
    faqs: [
      ["Which MP4 qualities can I get?", "Every quality the video has, from 144p up to 1080p Full HD, 2K and 4K."],
      ["Will the MP4 play on my phone?", "Yes. Up to 1080p the file is standard H.264 MP4 that plays everywhere."],
      ["Is it allowed to download YouTube videos?", "Only download videos you own or have permission to use."],
    ],
  },
  "/youtube-4k-downloader": {
    kind: "youtube",
    h1: "YouTube 4K Video Downloader",
    title: "YouTube 4K Downloader - Download 2160p & 1440p Ultra HD Videos Free",
    description:
      "Download YouTube videos in 4K Ultra HD (2160p) and 2K (1440p) for free. Paste a link, pick 4K and save the MP4. No sign-up, no app.",
    keywords: ["youtube 4k downloader", "4k video downloader", "download youtube video in 4k", "youtube 2160p download", "youtube 1440p download", "4k youtube to mp4", "ultra hd youtube downloader"],
    steps: ["Copy the link of a video uploaded in 4K.", "Paste it in the box. The video opens instantly.", "Pick 2160p · 4K (or 1440p · 2K) and download."],
    faqs: [
      ["Why don't I see the 4K option?", "4K appears only when the video was uploaded in 4K. Lower qualities are always available."],
      ["Which players play 4K files?", "4K and 2K files use AV1 or VP9 inside MP4 (YouTube has no H.264 above 1080p). VLC and modern phones, TVs and browsers play them."],
      ["How big is a 4K file?", "The exact size is shown next to each quality before you download."],
      ["Is it allowed to download YouTube videos?", "Only download videos you own or have permission to use."],
    ],
  },

  "/youtube-to-mp3": {
    kind: "youtube",
    h1: "YouTube to MP3 Converter",
    title: "YouTube to MP3 - Convert YouTube Videos to MP3 320kbps Free",
    description:
      "Convert YouTube to MP3 online for free. Paste a link and download the audio as MP3 320 kbps, 192 kbps, 128 kbps or M4A in seconds. No sign-up, no app.",
    keywords: ["youtube to mp3", "youtube to mp3 converter", "yt to mp3", "youtube mp3 download", "youtube audio download", "convert youtube to mp3", "youtube to mp3 320kbps", "youtube song download", "mp3 downloader"],
    steps: ["Copy the YouTube video or song link.", "Paste it in the box. The video opens instantly.", "Pick MP3 320, 192 or 128 kbps (or M4A) and the download starts."],
    faqs: [
      ["What is the best MP3 quality?", "MP3 320 kbps is the highest. M4A keeps YouTube's original audio without re-encoding."],
      ["Does it work for long videos and podcasts?", "Yes, videos up to 4 hours long can be converted."],
      ["Is it allowed to download music from YouTube?", "Only download audio you own or have permission to use."],
    ],
  },
  "/youtube-shorts-downloader": {
    kind: "youtube",
    h1: "YouTube Shorts Downloader",
    title: "YouTube Shorts Downloader - Download Shorts in HD MP4 Free",
    description:
      "Download YouTube Shorts in full HD vertical MP4 or as MP3 for free. Paste the Shorts link and save it in seconds. No watermark, no sign-up, works on phone.",
    keywords: ["youtube shorts downloader", "shorts downloader", "download youtube shorts", "youtube shorts download", "shorts video download", "yt shorts downloader", "shorts to mp4", "shorts to mp3"],
    steps: ["Open the Short, tap Share and copy the link.", "Paste it in the box. The Short opens instantly.", "Pick a quality and the vertical MP4 downloads."],
    faqs: [
      ["Does the Short stay vertical?", "Yes. You get the original vertical video in the best quality it was uploaded in."],
      ["Is there a watermark?", "No. The file is the original video with nothing added."],
      ["Is it allowed to download Shorts?", "Only download Shorts you own or have permission to use."],
    ],
  },
  "/youtube-1080p-downloader": {
    kind: "youtube",
    h1: "YouTube 1080p HD Downloader",
    title: "YouTube 1080p Downloader - Download YouTube Videos in Full HD MP4",
    description:
      "Download YouTube videos in 1080p Full HD or 720p HD as standard MP4 that plays everywhere. Paste the link, pick 1080p and save. Free, fast, no sign-up.",
    keywords: ["youtube 1080p downloader", "youtube hd downloader", "download youtube video hd", "youtube full hd download", "youtube 720p download", "youtube video download 1080p", "hd video downloader"],
    steps: ["Copy the YouTube link.", "Paste it in the box. The video opens instantly.", "Pick 1080p · Full HD (or 720p · HD) and download."],
    faqs: [
      ["Will the 1080p file play on every device?", "Yes. Up to 1080p the video is H.264 MP4 that plays on phones, TVs, PCs and editing apps."],
      ["Why is 1080p the fastest?", "We start preparing the best quality up to 1080p as soon as you paste the link, so it usually downloads straight away."],
      ["Is it allowed to download YouTube videos?", "Only download videos you own or have permission to use."],
    ],
  },
  "/yt-downloader": {
    kind: "youtube",
    h1: "YT Downloader",
    title: "YT Downloader - Fast YouTube Video & MP3 Downloader Online",
    description:
      "YT downloader online: paste any YouTube link to download the video as MP4 (4K, 1080p, 720p) or audio as MP3. Opens instantly, no sign-up, no limits.",
    keywords: ["yt downloader", "yt video downloader", "yt to mp4", "yt to mp3", "yt download", "youtube video saver", "online video downloader", "fast youtube downloader"],
    steps: ["Copy the YouTube link.", "Paste it in the box. The video opens instantly.", "Pick a video or audio quality and download."],
    faqs: [
      ["Is this YT downloader free?", "Yes, completely free with no daily limit and no sign-up."],
      ["How fast is it?", "The video opens as soon as you paste the link, and the most likely quality is prepared in advance."],
      ["Is it allowed to download YouTube videos?", "Only download videos you own or have permission to use."],
    ],
  },

  // ---------------- PDF ----------------
  "/merge-pdf": {
    kind: "pdf",
    title: "Merge PDF - Combine PDF Files Online Free",
    description: "Merge PDF files online for free. Combine multiple PDFs into one document in any order, right in your browser. No upload, no sign-up, no watermark.",
    keywords: ["merge pdf", "combine pdf", "join pdf", "pdf merger", "merge pdf online free", "combine pdf files"],
    steps: ["Select or drop two or more PDF files.", "Drag the files into the order you want.", "Click Merge PDF and download the combined file."],
    faqs: [["How many PDFs can I merge at once?", "There is no fixed limit. You can add as many PDFs as your device memory allows and arrange them in any order before merging."], ["Will merging reduce the quality?", "No. Pages are copied exactly as they are, so text, images and links keep their original quality."]],
  },
  "/split-pdf": {
    kind: "pdf",
    title: "Split PDF - Separate PDF Pages Online Free",
    description: "Split a PDF into separate pages or page ranges online for free. Extract the pages you need into new PDF files instantly in your browser.",
    keywords: ["split pdf", "separate pdf pages", "extract pages from pdf", "pdf splitter", "split pdf online free", "cut pdf"],
    steps: ["Upload the PDF you want to split.", "Choose page ranges or split every page.", "Click Split PDF and download the new files."],
    faqs: [["Can I extract only a few pages?", "Yes. Enter the page ranges you need and only those pages are saved into a new PDF."], ["Is the original PDF changed?", "No. Your original file stays untouched; new PDF files are created from it."]],
  },
  "/organize-pdf": {
    kind: "pdf",
    title: "Organize PDF - Reorder, Delete & Add PDF Pages Free",
    description: "Organize PDF pages online: drag to reorder, delete unwanted pages and rotate pages, then save a new PDF. Free and private, works in your browser.",
    keywords: ["organize pdf", "reorder pdf pages", "rearrange pdf pages", "delete pdf pages", "sort pdf pages"],
    steps: ["Upload your PDF to see every page as a thumbnail.", "Drag pages to reorder them or delete the ones you don't need.", "Save and download the organized PDF."],
    faqs: [["Can I delete pages from a PDF?", "Yes. Remove any page from the thumbnail view before saving the new PDF."], ["Do I need Adobe Acrobat?", "No. Everything works in your web browser on any device."]],
  },
  "/rotate-pdf": {
    kind: "pdf",
    title: "Rotate PDF - Rotate PDF Pages Online Free",
    description: "Rotate PDF pages 90, 180 or 270 degrees and save the result permanently. Rotate one page or the whole document, free and in your browser.",
    keywords: ["rotate pdf", "rotate pdf pages", "turn pdf page", "rotate pdf online free", "flip pdf"],
    steps: ["Upload the PDF.", "Rotate all pages or only the pages you choose.", "Download the rotated PDF."],
    faqs: [["Is the rotation saved permanently?", "Yes. The new PDF keeps the rotation in every PDF reader."], ["Can I rotate several PDFs at once?", "Yes, you can add multiple files and rotate them in one go."]],
  },
  "/compress-pdf": {
    kind: "pdf",
    title: "Compress PDF - Reduce PDF File Size Online Free",
    description: "Compress PDF files online to reduce file size while keeping good quality. Make PDFs small enough for email and upload forms, free and private.",
    keywords: ["compress pdf", "reduce pdf size", "pdf compressor", "shrink pdf", "compress pdf online free", "make pdf smaller"],
    steps: ["Upload the PDF you want to make smaller.", "Choose the compression level.", "Download the compressed PDF."],
    faqs: [["How much smaller will my PDF get?", "It depends on the content. PDFs with large images usually shrink the most."], ["Will text stay sharp?", "Yes. Text stays selectable and sharp; mainly images and unused data are optimized."]],
  },
  "/pdf-to-word": {
    kind: "pdf",
    title: "PDF to Word - Convert PDF to DOCX Online Free",
    description: "Convert PDF to editable Word (DOCX) documents online for free. Keep text and paragraphs so you can edit the file in Microsoft Word or Google Docs.",
    keywords: ["pdf to word", "pdf to docx", "convert pdf to word", "pdf to word converter", "pdf to word online free", "pdf to editable word"],
    steps: ["Upload your PDF.", "Click Convert to Word.", "Download the editable DOCX file."],
    faqs: [["Can I edit the converted file?", "Yes. The DOCX file opens in Microsoft Word, Google Docs and LibreOffice for editing."], ["Does it work with scanned PDFs?", "Scanned PDFs are images without text, so only PDFs with real text convert to editable Word text."]],
  },
  "/pdf-to-jpg": {
    kind: "pdf",
    title: "PDF to JPG - Convert PDF Pages to Images Free",
    description: "Convert every PDF page to a high-quality JPG image online for free. Fast, private conversion in your browser with no upload.",
    keywords: ["pdf to jpg", "pdf to image", "convert pdf to jpg", "pdf to jpeg", "pdf to png", "pdf to jpg converter"],
    steps: ["Upload the PDF.", "Pick the image quality.", "Download each page as a JPG image."],
    faqs: [["Are all pages converted?", "Yes. Every page becomes its own JPG image."], ["What quality are the images?", "Pages are rendered at high resolution so text stays readable."]],
  },
  "/jpg-to-pdf": {
    kind: "pdf",
    title: "JPG to PDF - Convert Images to PDF Online Free",
    description: "Convert JPG, PNG and other images to PDF online for free. Combine many photos into one PDF and set the page order, all in your browser.",
    keywords: ["jpg to pdf", "image to pdf", "convert jpg to pdf", "png to pdf", "photo to pdf", "images to pdf converter"],
    steps: ["Select one or more images.", "Arrange them in the order you want.", "Click Convert and download the PDF."],
    faqs: [["Can I put many images in one PDF?", "Yes. All selected images are combined into a single PDF, one image per page."], ["Which image formats work?", "JPG, JPEG and PNG images are supported."]],
  },
  "/word-to-pdf": {
    kind: "pdf",
    title: "Word to PDF - Convert DOCX to PDF Online Free",
    description: "Convert Word documents (DOCX) to PDF online for free. Easy, private conversion in your browser with no software to install.",
    keywords: ["word to pdf", "docx to pdf", "convert word to pdf", "doc to pdf", "word to pdf converter free"],
    steps: ["Upload your Word file.", "Click Convert to PDF.", "Download the PDF."],
    faqs: [["Do I need Microsoft Word installed?", "No. The conversion runs in your browser."], ["Which file types are supported?", "Modern Word documents in DOCX format."]],
  },
  "/html-to-pdf": {
    kind: "pdf",
    title: "HTML to PDF - Convert HTML Code to PDF Free",
    description: "Convert HTML code to a PDF document online for free. Paste your HTML, preview it and save it as a PDF in your browser.",
    keywords: ["html to pdf", "convert html to pdf", "html to pdf converter", "web page to pdf", "html code to pdf"],
    steps: ["Paste or type your HTML.", "Preview the result.", "Click Convert and download the PDF."],
    faqs: [["Can I use CSS styles?", "Yes. Inline styles and style tags in your HTML are used for the PDF layout."], ["Is my HTML sent anywhere?", "No. It is rendered and converted in your browser."]],
  },
  "/pdf-to-ppt": {
    kind: "pdf",
    title: "PDF to PowerPoint - Convert PDF to PPTX Free",
    description: "Convert PDF to PowerPoint (PPTX) slides online for free. Each PDF page becomes a slide you can present or edit.",
    keywords: ["pdf to ppt", "pdf to powerpoint", "pdf to pptx", "convert pdf to ppt", "pdf to slides"],
    steps: ["Upload the PDF.", "Click Convert to PowerPoint.", "Download the PPTX presentation."],
    faqs: [["Does every page become a slide?", "Yes, each PDF page is placed on its own slide."], ["Can I open it in Google Slides?", "Yes. PPTX files open in PowerPoint, Google Slides and Keynote."]],
  },
  "/pdf-to-excel": {
    kind: "pdf",
    title: "PDF to Excel - Convert PDF to XLSX Online Free",
    description: "Convert PDF tables and text to Excel (XLSX) spreadsheets online for free. Extract data from PDF into rows and columns in your browser.",
    keywords: ["pdf to excel", "pdf to xlsx", "convert pdf to excel", "pdf table to excel", "pdf to excel converter free"],
    steps: ["Upload the PDF with your data.", "Click Convert to Excel.", "Download the XLSX file."],
    faqs: [["Will tables be kept?", "Text is placed into rows and columns based on its position on the page."], ["Can I open the file in Google Sheets?", "Yes. XLSX files work in Excel, Google Sheets and LibreOffice."]],
  },
  "/excel-to-pdf": {
    kind: "pdf",
    title: "Excel to PDF - Convert XLSX Spreadsheet to PDF Free",
    description: "Convert Excel spreadsheets (XLSX, XLS, CSV) to PDF online for free. Turn sheets into clean, shareable PDF tables in your browser.",
    keywords: ["excel to pdf", "xlsx to pdf", "convert excel to pdf", "spreadsheet to pdf", "csv to pdf"],
    steps: ["Upload your spreadsheet.", "Click Convert to PDF.", "Download the PDF."],
    faqs: [["Are all sheets converted?", "Yes. Each sheet is added to the PDF."], ["Do I need Excel installed?", "No. The conversion runs in your browser."]],
  },
  "/ppt-to-pdf": {
    kind: "pdf",
    title: "PowerPoint to PDF - Convert PPTX to PDF Free",
    description: "Convert PowerPoint presentations (PPTX) to PDF online for free. Share slides as a PDF that opens on any device.",
    keywords: ["ppt to pdf", "powerpoint to pdf", "pptx to pdf", "convert ppt to pdf", "slides to pdf"],
    steps: ["Upload the PPTX file.", "Click Convert to PDF.", "Download the PDF."],
    faqs: [["Does each slide become a page?", "Yes, every slide is placed on its own PDF page."], ["Is it free?", "Yes, completely free with no sign-up."]],
  },
  "/edit-pdf": {
    kind: "pdf",
    h1: "PDF Editor",
    title: "Edit PDF - Free Online PDF Editor",
    description: "Edit PDF files online for free: add text, images, shapes and drawings to any page and save a new PDF. A fast PDF editor that works in your browser.",
    keywords: ["edit pdf", "pdf editor", "edit pdf online free", "add text to pdf", "write on pdf", "free pdf editor"],
    steps: ["Upload your PDF.", "Add text, images, shapes or drawings on any page.", "Save and download the edited PDF."],
    faqs: [["Can I add text to a PDF?", "Yes. Click anywhere on a page to type new text, then change its size and colour."], ["Is this PDF editor really free?", "Yes. There are no watermarks, limits or sign-up."]],
  },
  "/page-numbers": {
    kind: "pdf",
    title: "Add Page Numbers to PDF Online Free",
    description: "Add page numbers to a PDF online for free. Choose the position, style and starting number, then download the numbered PDF.",
    keywords: ["add page numbers to pdf", "pdf page numbers", "number pdf pages", "insert page numbers pdf"],
    steps: ["Upload the PDF.", "Choose where the numbers go and how they look.", "Download the numbered PDF."],
    faqs: [["Can I choose the position?", "Yes. Place numbers at the top or bottom, left, centre or right."], ["Can I start from a different number?", "Yes, set any starting number you like."]],
  },
  "/crop-pdf": {
    kind: "pdf",
    title: "Crop PDF - Trim PDF Margins Online Free",
    description: "Crop PDF pages and trim white margins online for free. Select the area to keep and save a new PDF in your browser.",
    keywords: ["crop pdf", "trim pdf", "crop pdf pages", "remove pdf margins", "crop pdf online free"],
    steps: ["Upload the PDF.", "Set the crop area or margins.", "Download the cropped PDF."],
    faqs: [["Can I crop all pages at once?", "Yes, the same crop can be applied to every page."], ["Is cropped content deleted?", "The visible page area is changed so only the cropped part shows."]],
  },
  "/sign-pdf": {
    kind: "pdf",
    title: "Sign PDF - eSign PDF Online & Send for Signature Free",
    description: "Sign PDF documents online for free. Draw, type or upload your signature, or send a PDF to someone for eSignature and get the signed copy by email.",
    keywords: ["sign pdf", "esign pdf", "electronic signature", "sign pdf online free", "send pdf for signature", "digital signature pdf"],
    steps: ["Upload the PDF you want to sign.", "Draw, type or upload your signature and place it on the page.", "Download the signed PDF, or send it to someone else to sign by email."],
    faqs: [["Can I ask someone else to sign?", "Yes. Use Send for Signature: they get an email link, sign online, and the signed PDF is emailed back to you."], ["Is an electronic signature valid?", "Electronic signatures are accepted for many everyday documents in most countries. Check local rules for special documents."]],
  },
  "/watermark-pdf": {
    kind: "pdf",
    title: "Watermark PDF - Add Text Watermark to PDF Free",
    description: "Add a text watermark to PDF pages online for free. Choose text, size, colour, opacity and angle, then download the watermarked PDF.",
    keywords: ["watermark pdf", "add watermark to pdf", "pdf watermark", "stamp pdf", "watermark pdf online free"],
    steps: ["Upload the PDF.", "Type your watermark and choose its style.", "Download the watermarked PDF."],
    faqs: [["Can I change the transparency?", "Yes, set the opacity so the watermark is as visible as you want."], ["Is the watermark added to every page?", "Yes, it is stamped on all pages."]],
  },
  "/unlock-pdf": {
    kind: "pdf",
    title: "Unlock PDF - Remove PDF Password Online Free",
    description: "Remove password protection and restrictions from a PDF you own. Enter the password once and download an unlocked PDF, free and private.",
    keywords: ["unlock pdf", "remove pdf password", "pdf password remover", "unlock pdf online free", "decrypt pdf"],
    steps: ["Upload the protected PDF.", "Enter the password if it has one.", "Download the unlocked PDF."],
    faqs: [["Do I need the password?", "For PDFs that need a password to open, yes. Only unlock files you own or have permission to use."], ["Is my password sent to a server?", "No. The file is unlocked in your browser."]],
  },
  "/protect-pdf": {
    kind: "pdf",
    title: "Protect PDF - Add Password to PDF Online Free",
    description: "Password protect a PDF online for free. Encrypt your PDF so only people with the password can open it.",
    keywords: ["protect pdf", "password protect pdf", "encrypt pdf", "lock pdf", "add password to pdf"],
    steps: ["Upload the PDF.", "Type a strong password.", "Download the protected PDF."],
    faqs: [["What happens if I forget the password?", "The password cannot be recovered, so store it somewhere safe."], ["Is my file uploaded?", "No. Encryption happens in your browser."]],
  },
  "/compare-pdf": {
    kind: "pdf",
    title: "Compare PDF - Find Differences Between Two PDFs",
    description: "Compare two PDF files online and highlight the text differences side by side. Free, fast and private.",
    keywords: ["compare pdf", "pdf diff", "compare two pdf files", "find differences in pdf", "pdf comparison tool"],
    steps: ["Upload the original PDF.", "Upload the changed PDF.", "See the differences highlighted."],
    faqs: [["What does it compare?", "The text of both documents, page by page, with added and removed words highlighted."], ["Are both files kept private?", "Yes. Both PDFs are processed in your browser."]],
  },
  "/redact-pdf": {
    kind: "pdf",
    title: "Redact PDF - Black Out Sensitive Text Online Free",
    description: "Redact PDF documents online for free. Black out names, numbers and other sensitive information before sharing.",
    keywords: ["redact pdf", "black out pdf", "pdf redaction tool", "hide text in pdf", "redact pdf online free"],
    steps: ["Upload the PDF.", "Draw boxes over the content you want to hide.", "Download the redacted PDF."],
    faqs: [["Is the hidden text removed from the file?", "No. Areas are covered with an opaque box, but the original text stays in the PDF underneath, so do not rely on it to remove confidential data."], ["Is it private?", "Yes, the document never leaves your device."]],
  },

  // ---------------- Image ----------------
  "/remove-background": {
    kind: "image-server",
    title: "Remove Background from Image - Free AI Background Remover",
    description: "Remove the background from any photo in seconds with AI. Get a transparent PNG in full resolution, free and without sign-up.",
    keywords: ["remove background", "background remover", "remove bg", "transparent background", "remove background from image free", "ai background remover"],
    steps: ["Upload a photo (JPG, PNG or WEBP).", "AI removes the background automatically.", "Download the transparent PNG in full size."],
    faqs: [["Is the result full resolution?", "Yes. The PNG keeps the same width and height as your original photo."], ["What photos work best?", "Photos with a clear main subject such as people, products, cars and animals give the cleanest results."]],
  },

  // ---------------- Audio converters ----------------
  "/audio-converter": {
    kind: "audio",
    title: "Audio Converter - Convert MP3, WAV, M4A, OGG, FLAC Free",
    description: "Free online audio converter. Convert between MP3, WAV, M4A, AAC, OGG and FLAC and choose the bitrate, right in your browser with no upload.",
    keywords: ["audio converter", "online audio converter", "convert audio", "mp3 converter", "m4a to mp3", "flac to mp3", "ogg to mp3"],
    steps: ["Choose an audio or video file.", "Pick the output format and quality.", "Click Convert and download the new file."],
    faqs: [["Which formats are supported?", "MP3, WAV, M4A, AAC, OGG and FLAC, plus audio from common video files."], ["Is there a file size limit?", "There is no server limit; very large files depend on your device's memory."]],
  },
  "/mp3-to-wav": {
    kind: "audio",
    title: "MP3 to WAV Converter - Convert MP3 to WAV Free",
    description: "Convert MP3 to WAV online for free. Get uncompressed WAV audio for editing and production, converted in your browser.",
    keywords: ["mp3 to wav", "convert mp3 to wav", "mp3 to wav converter", "mp3 to wav online free"],
    steps: ["Choose your MP3 file.", "Click Convert to WAV.", "Download the WAV file."],
    faqs: [["Does converting to WAV improve quality?", "WAV is uncompressed, which is ideal for editing, but it cannot restore detail already removed by MP3 compression."], ["Is it free?", "Yes, unlimited and free."]],
  },
  "/wav-to-mp3": {
    kind: "audio",
    title: "WAV to MP3 Converter - Convert WAV to MP3 Free",
    description: "Convert WAV to MP3 online for free. Make large WAV files much smaller with high-quality MP3 output, in your browser.",
    keywords: ["wav to mp3", "convert wav to mp3", "wav to mp3 converter", "wav to mp3 online free"],
    steps: ["Choose your WAV file.", "Pick the MP3 quality.", "Download the MP3."],
    faqs: [["How much smaller is the MP3?", "Usually around 10 times smaller than the WAV at 128 kbps."], ["Can I choose the bitrate?", "Yes, select the quality before converting."]],
  },
  "/mp4-to-mp3": {
    kind: "audio",
    title: "MP4 to MP3 Converter - Extract Audio from Video Free",
    description: "Convert MP4 to MP3 online for free. Extract the audio track from any video and save it as an MP3, right in your browser.",
    keywords: ["mp4 to mp3", "convert mp4 to mp3", "video to mp3", "extract audio from video", "mp4 to mp3 converter"],
    steps: ["Choose your MP4 video.", "Click Convert to MP3.", "Download the MP3 audio."],
    faqs: [["Does it work with other video formats?", "Yes. MOV, MKV, WEBM and AVI videos also work in most browsers."], ["Is my video uploaded?", "No. The audio is extracted in your browser."]],
  },
  "/mp4-to-wav": {
    kind: "audio",
    title: "MP4 to WAV Converter - Extract WAV Audio from Video",
    description: "Convert MP4 video to WAV audio online for free. Extract lossless WAV from any video for editing, in your browser.",
    keywords: ["mp4 to wav", "convert mp4 to wav", "video to wav", "extract wav from video"],
    steps: ["Choose your MP4 video.", "Click Convert to WAV.", "Download the WAV audio."],
    faqs: [["Why choose WAV over MP3?", "WAV is uncompressed, which is better for editing and mixing."], ["Is it free?", "Yes, with no limits or sign-up."]],
  },
};

type CT = Omit<SeoEntry, "kind"> & { kind?: SeoKind };

const creator: Record<string, CT> = {
  "youtube-video-ideas-generator": { kind: "ai", h1: "YouTube Video Ideas Generator", title: "YouTube Video Ideas Generator - Free AI Video Ideas", description: "Get fresh YouTube video ideas for any niche with working titles and angles. Free AI video idea generator for creators.", keywords: ["youtube video ideas generator", "video ideas", "youtube content ideas", "ai video ideas", "what to post on youtube"], faqs: [["How does it come up with ideas?", "It uses AI with your niche and keywords to suggest specific video topics, titles and angles."], ["Can I use it for Shorts?", "Yes. Mention Shorts in your topic to get short-form ideas."]] },
  "youtube-tags-generator": { h1: "YouTube Tag Generator", title: "YouTube Tag Generator - Free SEO Tags for Videos", description: "Generate YouTube tags from real YouTube searches and AI. Copy SEO tags packed to the 500-character limit to help your videos rank.", keywords: ["youtube tag generator", "youtube tags generator", "tags for youtube", "youtube seo tags", "video tag generator", "youtube keyword tags"], faqs: [["Where do the tags come from?", "From real YouTube search suggestions for your topic plus AI-generated related phrases."], ["What is the YouTube tag limit?", "YouTube allows up to 500 characters of tags. The tool fits the best tags within that limit."]] },
  "youtube-tags-extractor": { h1: "YouTube Tag Extractor", title: "YouTube Tag Extractor - See & Copy Tags of Any Video", description: "Extract the hidden tags of any YouTube video. Paste a video link to see and copy all tags used by the uploader, free.", keywords: ["youtube tag extractor", "youtube tags extractor", "see youtube tags", "copy youtube tags", "youtube video tags finder", "tag viewer"], faqs: [["Why can't I see tags on YouTube?", "YouTube hides tags on the watch page. This tool reads them from the public video data."], ["Does it work with Shorts?", "Yes, paste any video or Shorts link."]] },
  "youtube-hashtags-generator": { kind: "ai", h1: "YouTube Hashtag Generator", title: "YouTube Hashtag Generator - Free Hashtags for Videos & Shorts", description: "Create relevant YouTube hashtags for videos and Shorts in one click. Free AI hashtag generator to improve discovery.", keywords: ["youtube hashtag generator", "hashtags for youtube", "youtube shorts hashtags", "hashtag generator", "best hashtags for youtube"], faqs: [["How many hashtags should I use?", "YouTube recommends a few relevant hashtags. Using more than 15 can cause YouTube to ignore them."], ["Where do I put hashtags?", "Add them in the title or description; the first three appear above the title."]] },
  "youtube-hashtags-extractor": { h1: "YouTube Hashtag Extractor", title: "YouTube Hashtag Extractor - Get Hashtags from Any Video", description: "Pull every hashtag used in a YouTube video's title and description. Paste a link and copy all hashtags for free.", keywords: ["youtube hashtag extractor", "extract hashtags from youtube", "youtube video hashtags", "copy youtube hashtags"], faqs: [["Which hashtags are found?", "All hashtags in the video title and description."], ["Can I copy them all at once?", "Yes, copy the full list with one click."]] },
  "youtube-keyword-generator": { h1: "YouTube Keyword Generator", title: "YouTube Keyword Generator - Free Keyword Research Tool", description: "Find long-tail and question keywords people actually search on YouTube. Free YouTube keyword research tool powered by real search suggestions.", keywords: ["youtube keyword generator", "youtube keyword tool", "youtube keyword research", "youtube search keywords", "long tail keywords youtube"], faqs: [["Are these real search keywords?", "Yes. Keywords come from YouTube's own search suggestions for your topic."], ["How do I use the keywords?", "Use them in your title, description and tags, and as ideas for new videos."]] },
  "youtube-title-generator": { kind: "ai", h1: "YouTube Title Generator", title: "YouTube Title Generator - Free AI Titles with SEO Score", description: "Generate catchy, click-worthy YouTube video titles with AI. Each title gets an SEO score so you can pick the best one. Free.", keywords: ["youtube title generator", "video title generator", "youtube title ideas", "ai title generator", "catchy youtube titles"], faqs: [["How long should a YouTube title be?", "Aim for under 60–70 characters so it isn't cut off in search results."], ["What does the SEO score mean?", "It rates length, keyword use and click appeal so you can compare titles quickly."]] },
  "youtube-description-copy": { h1: "YouTube Description Copy & Analyzer", title: "YouTube Description Copy - Copy Any Video Description", description: "Copy and analyse any YouTube video's description: links, hashtags, timestamps and word count. Free description extractor.", keywords: ["copy youtube description", "youtube description extractor", "youtube description copy", "video description viewer"], faqs: [["What does the analysis show?", "Word and character count, links, hashtags and timestamps found in the description."], ["Can I copy the whole description?", "Yes, with one click."]] },
  "youtube-channel-keywords-copy": { h1: "YouTube Channel Keywords Finder", title: "YouTube Channel Keywords - See & Copy Any Channel's Keywords", description: "Show and copy the keywords any YouTube channel has set in its settings. Paste a channel link or @handle. Free.", keywords: ["youtube channel keywords", "channel keywords finder", "copy channel keywords", "youtube channel tags"], faqs: [["What are channel keywords?", "Keywords a creator adds in YouTube Studio to describe the channel. They are hidden on the channel page."], ["Can I use my own channel?", "Yes, paste any channel link or @handle."]] },
  "youtube-channel-name-generator": { kind: "ai", h1: "YouTube Channel Name Generator", title: "YouTube Channel Name Generator - Free Name Ideas", description: "Get brandable, easy-to-spell YouTube channel name ideas for your niche with AI. Free channel name generator.", keywords: ["youtube channel name generator", "channel name ideas", "youtube name generator", "channel name maker"], faqs: [["What makes a good channel name?", "Short, easy to spell and say, and related to your content."], ["Are the names available?", "Check YouTube and social media for availability before using a name."]] },
  "youtube-top-100-channels": { h1: "Top 100 YouTube Channels", title: "Top 100 YouTube Channels - Most Subscribed Ranking", description: "Track the 100 biggest YouTube channels with daily rank and subscriber changes. Free most-subscribed YouTube channels list.", keywords: ["top 100 youtube channels", "most subscribed youtube channels", "biggest youtube channels", "youtube channel ranking"], faqs: [["How often is the list updated?", "Rankings and subscriber changes are refreshed daily."], ["Where do the numbers come from?", "Public subscriber counts from YouTube."]] },
  "youtube-ad-money-calculator": { kind: "calc", h1: "YouTube Money Calculator", title: "YouTube Money Calculator - Estimate Ad Earnings Free", description: "Estimate how much YouTubers earn from ads by views, niche and audience country. Free YouTube earnings calculator.", keywords: ["youtube money calculator", "youtube earnings calculator", "youtube ad revenue calculator", "how much do youtubers make", "youtube income calculator"], faqs: [["How accurate is the estimate?", "It uses typical RPM ranges per niche and country. Real earnings vary by audience and season."], ["What is RPM?", "Revenue per 1,000 views after YouTube's share."]] },
  "youtube-channel-stats-checker": { h1: "YouTube Channel Stats Checker", title: "YouTube Channel Stats Checker - Subscribers, Views & Videos", description: "Check any YouTube channel's stats and recent video performance. Export subscribers, views and video data to CSV or Excel. Free.", keywords: ["youtube channel stats", "channel statistics", "youtube channel analytics", "check youtube subscribers", "youtube stats checker"], faqs: [["What stats are shown?", "Subscribers, total views, video count and the performance of recent videos."], ["Can I export the data?", "Yes, download it as CSV or Excel."]] },
  "youtube-video-data-viewer": { h1: "YouTube Video Data Viewer", title: "YouTube Video Data Viewer - Views, Tags, Category & More", description: "See every public detail of a YouTube video: views, likes, tags, category, duration, upload date, status and thumbnails. Free.", keywords: ["youtube video data", "youtube video info", "video stats viewer", "youtube metadata viewer", "youtube video details"], faqs: [["What details are shown?", "Stats, tags, category, duration, upload date, privacy status and all thumbnail sizes."], ["Does it need a login?", "No. Paste any public video link."]] },
  "youtube-channel-id-finder": { h1: "YouTube Channel ID Finder", title: "YouTube Channel ID Finder - Find Any Channel ID Free", description: "Find the YouTube channel ID (UC…) of any channel instantly. Paste a channel link, @handle or video URL and copy the channel ID for free.", keywords: ["youtube channel id finder", "find youtube channel id", "channel id finder", "youtube channel id", "get channel id", "what is my channel id"], faqs: [["What is a YouTube channel ID?", "A unique 24-character ID that starts with UC, used by YouTube and many apps to identify a channel."], ["How do I find my own channel ID?", "Paste your channel link or @handle here, or open YouTube Studio > Settings > Channel > Advanced settings."]] },
  "youtube-subscribe-link-generator": { h1: "YouTube Subscribe Link Generator", title: "YouTube Subscribe Link Generator - Free Subscribe Button Link", description: "Create a YouTube link that opens the subscribe pop-up for your channel. Share it to get more subscribers. Free.", keywords: ["youtube subscribe link generator", "subscribe link", "youtube subscribe button link", "sub confirmation link"], faqs: [["What does the link do?", "It opens your channel with a subscribe confirmation pop-up so visitors can subscribe in one tap."], ["Where should I share it?", "In video descriptions, bios, websites and social posts."]] },
  "youtube-video-embedder": { h1: "YouTube Embed Code Generator", title: "YouTube Embed Code Generator - Start Time, Autoplay, Loop", description: "Build YouTube embed codes with start and end time, autoplay, loop, mute and privacy-enhanced mode. Free embed code generator.", keywords: ["youtube embed code generator", "youtube embed", "embed youtube video", "youtube autoplay embed", "youtube loop embed"], faqs: [["Can the video start at a certain time?", "Yes, set start and end times in seconds."], ["What is privacy-enhanced mode?", "It uses youtube-nocookie.com so YouTube doesn't set cookies until the visitor plays the video."]] },
  "youtube-channel-search": { h1: "YouTube Channel Search", title: "YouTube Channel Search - Find & Compare Channels", description: "Search YouTube channels by keyword and compare subscribers, views and video counts side by side. Free channel finder.", keywords: ["youtube channel search", "find youtube channels", "search youtube channels", "youtube channel finder"], faqs: [["Can I compare channels?", "Yes, results show subscribers, views and video counts together."], ["Is it free?", "Yes, no sign-up needed."]] },
  "youtube-timestamp-generator": { kind: "calc", h1: "YouTube Timestamp Generator", title: "YouTube Timestamp Generator - Chapters & Time Links", description: "Make YouTube timestamp links and chapter lists for your video description. Free timestamp and chapters generator.", keywords: ["youtube timestamp generator", "youtube chapters generator", "youtube time link", "youtube timestamps"], faqs: [["How do YouTube chapters work?", "Add timestamps starting at 0:00 in the description, with at least three chapters of 10 seconds or more."], ["Can I link to a specific time?", "Yes, the tool creates links that start the video at any second."]] },
  "youtube-playlist-length-calculator": { h1: "YouTube Playlist Length Calculator", title: "YouTube Playlist Length Calculator - Total Watch Time", description: "Calculate the total length of any YouTube playlist at 1x, 1.25x, 1.5x, 1.75x and 2x speed. Free playlist duration calculator.", keywords: ["youtube playlist length", "playlist length calculator", "youtube playlist duration", "how long is this playlist"], faqs: [["Does it support playback speeds?", "Yes, see the total time at every common speed."], ["Are private videos counted?", "No. Only public videos in the playlist are counted."]] },
  "youtube-playlist-to-text": { h1: "YouTube Playlist to Text Converter", title: "YouTube Playlist to Text - Export Playlist to TXT, CSV, Excel", description: "Export YouTube playlist titles, links and descriptions to TXT, CSV or Excel. Free playlist exporter.", keywords: ["youtube playlist to text", "export youtube playlist", "playlist to csv", "playlist to excel", "copy playlist titles"], faqs: [["What can be exported?", "Video titles, links, descriptions and more for every public video."], ["Which formats are available?", "TXT, CSV and Excel."]] },
  "youtube-category-checker": { h1: "YouTube Category Checker", title: "YouTube Category Checker - Find a Video's Category", description: "Check the official YouTube category of one video, many videos or a whole channel. Free category finder.", keywords: ["youtube category checker", "youtube video category", "find youtube category", "youtube category finder"], faqs: [["Why does the category matter?", "It helps YouTube understand your content and can affect recommendations."], ["Can I check many videos?", "Yes, paste several links or a channel."]] },
  "youtube-channel-video-list": { h1: "YouTube Channel Video List Extractor", title: "YouTube Channel Video List - Export All Videos of a Channel", description: "Export every public video of a YouTube channel with views, likes and upload dates to CSV or Excel. Free video list extractor.", keywords: ["youtube channel video list", "export youtube channel videos", "list all videos of a channel", "youtube video list extractor"], faqs: [["Which details are included?", "Title, link, views, likes and publish date for every public video."], ["Can I sort the list?", "Yes, sort by views, likes or date before exporting."]] },
  "youtube-video-downloader": { h1: "YouTube Video Downloader", title: "YouTube Video Downloader - Download YouTube Videos in 4K, 1080p MP4", description: "Free YouTube video downloader. Paste a link and download videos as MP4 in 4K (2160p), 2K, 1080p, 720p or lower, or save the audio as MP3.", keywords: ["youtube video downloader", "download youtube video", "youtube downloader", "youtube to mp4", "youtube 4k downloader", "youtube 1080p download", "yt video download"], steps: ["Copy the YouTube video link.", "Paste it in the box. The video opens instantly.", "Pick a quality (4K, 1080p, 720p…) or MP3 and download."], faqs: [["Which qualities are available?", "Every quality the video has: 4K (2160p), 2K (1440p), 1080p, 720p, 480p, 360p and lower."], ["Can I download only the audio?", "Yes. Switch to the Audio tab for MP3 (320, 192 or 128 kbps) or M4A."], ["Is it allowed to download YouTube videos?", "Only download videos you own or have permission to use, and respect the creator's copyright."]] },
  "youtube-to-mp3": { h1: "YouTube to MP3 Converter", title: "YouTube to MP3 - Convert YouTube Videos to MP3 320kbps Free", description: "Convert YouTube videos to MP3 in 320, 192 or 128 kbps, or save the original M4A audio. Free YouTube to MP3 converter, no sign-up.", keywords: ["youtube to mp3", "youtube mp3 converter", "youtube to mp3 320kbps", "youtube audio download", "yt to mp3", "convert youtube to mp3"], steps: ["Copy the YouTube video link.", "Paste it in the box. The video opens instantly.", "Choose MP3 320, 192, 128 kbps or M4A and download."], faqs: [["What is the best MP3 quality?", "320 kbps gives the best quality; 128 kbps gives the smallest file."], ["Is the cover art included?", "Yes, MP3 files include the video thumbnail as cover art and the title as metadata."], ["Can I download any song?", "Only download audio you own or have permission to use."]] },
  "youtube-shorts-downloader": { h1: "YouTube Shorts Downloader", title: "YouTube Shorts Downloader - Download Shorts in HD MP4 & MP3", description: "Download YouTube Shorts in full HD as MP4 video or MP3 audio. Paste a Shorts link and save it for free.", keywords: ["youtube shorts downloader", "download youtube shorts", "shorts video download", "youtube shorts to mp4", "shorts to mp3"], steps: ["Copy the Shorts link.", "Paste it in the box. The video opens instantly.", "Pick a quality or MP3 and download."], faqs: [["Does it keep the vertical format?", "Yes, Shorts are downloaded in their original vertical size."], ["Can I get the sound only?", "Yes, use the Audio tab for MP3 or M4A."]] },
  "youtube-banner-downloader": { h1: "Banner Downloader - YouTube, Spotify & Any Link", title: "YouTube Banner Downloader - Channel Art, Profile & Artist Image", description: "Download any YouTube channel banner (channel art) and profile picture in full size, or the artist image from Spotify, Apple Music, JioSaavn and other links. Free.", keywords: ["youtube banner downloader", "download youtube banner", "youtube channel art download", "youtube profile picture download", "youtube logo download", "spotify artist image download", "spotify profile picture download", "banner downloader"], faqs: [["What size is the banner?", "The largest size YouTube provides, usually 2560 px wide."], ["Can I get the profile picture too?", "Yes, in full resolution."], ["Does it work with Spotify or Apple Music?", "Yes. Paste an artist, album or playlist link from Spotify, Apple Music, JioSaavn, SoundCloud or Deezer to download its image."]] },
  "youtube-thumbnail-downloader": { h1: "Thumbnail Downloader - YouTube, Spotify & Any Link", title: "Thumbnail Downloader - YouTube, Spotify Cover & Album Art HD", description: "Download YouTube thumbnails in HD and Spotify, Apple Music, JioSaavn, SoundCloud and Deezer cover art in full size. Paste any link and save the image free.", keywords: ["youtube thumbnail downloader", "download youtube thumbnail", "youtube thumbnail download hd", "thumbnail grabber", "spotify cover downloader", "spotify album art download", "album art downloader", "apple music artwork downloader", "jiosaavn song image download", "soundcloud artwork downloader", "cover art downloader", "thumbnail downloader any link"], faqs: [["Which links work?", "YouTube videos and Shorts, Spotify tracks, albums, artists and playlists, Apple Music, JioSaavn, SoundCloud, Deezer, Vimeo, Instagram posts and most other pages with a preview image."], ["Which resolutions are available?", "YouTube: max-res (1280×720 when available) down to medium. Spotify: original (often 1500×1500 or larger) and 640/300/64 px. Apple Music: up to 3000×3000."], ["Does it work for Shorts?", "Yes, paste any video or Shorts link."], ["Why doesn't a link work?", "Private posts, pages that need a login, and some app-only stores don't share their artwork publicly."]] },
  "youtube-comment-picker": { h1: "YouTube Comment Picker", title: "YouTube Comment Picker - Random Giveaway Winner Picker", description: "Pick random giveaway winners from a YouTube video's comments with fair filters: unique users, keywords and more. Free comment picker.", keywords: ["youtube comment picker", "youtube giveaway picker", "random comment picker", "youtube random winner", "giveaway winner picker"], faqs: [["Is the pick random and fair?", "Yes. Winners are chosen randomly, and you can allow only one entry per user."], ["Can I filter by keyword?", "Yes, only include comments that contain a word you choose."]] },
  "youtube-comments-downloader": { h1: "YouTube Comments Downloader", title: "YouTube Comments Downloader - Export Comments to CSV & Excel", description: "Download YouTube comments and replies. Search, sort and export them to CSV or Excel for free.", keywords: ["youtube comments downloader", "download youtube comments", "export youtube comments", "youtube comments to excel", "youtube comment scraper"], faqs: [["Are replies included?", "Yes, replies can be included in the export."], ["Which formats are supported?", "CSV and Excel."]] },
  "compress-image": { kind: "image", h1: "Compress Image", title: "Compress Image - Reduce JPG, PNG, WEBP Size Online Free", description: "Compress and resize JPG, PNG and WEBP images online for free. Reduce image file size without visible quality loss, in your browser.", keywords: ["compress image", "image compressor", "reduce image size", "compress jpg", "compress png", "resize image"], faqs: [["Will my photo lose quality?", "Choose the quality level; at the default setting differences are hard to see."], ["Is the image uploaded?", "No. Compression happens in your browser."]] },
  "tap-bpm": { kind: "calc", h1: "Tap BPM Tempo Counter", title: "Tap BPM - Tap Tempo Counter to Find BPM Online", description: "Tap along to any song to find its tempo in beats per minute. Free online tap BPM counter.", keywords: ["tap bpm", "tap tempo", "bpm counter", "bpm finder", "find bpm of a song"], faqs: [["How many taps do I need?", "Tap at least 8 times for a stable reading."], ["Can I use the keyboard?", "Yes, tap any key or click the button."]] },
  "water-eject-sound": { kind: "audio", h1: "Water Eject Sound", title: "Water Eject Sound - Remove Water from Phone Speaker", description: "Play low-frequency water ejection tones to help push water out of your phone speaker. Free online water eject sound.", keywords: ["water eject", "water eject sound", "remove water from speaker", "fix water in phone speaker", "speaker cleaner sound"], faqs: [["How does it work?", "Low-frequency tones make the speaker vibrate, which can help push water out."], ["Can it damage my speaker?", "Use a moderate volume and stop if the sound distorts."]] },
  "soundboard": { kind: "audio", h1: "Soundboard", title: "Soundboard - Free Online Sound Effects Buttons", description: "Instant sound effect buttons: airhorn, applause, drum roll, buzzer, ding and more. Free online soundboard.", keywords: ["soundboard", "sound effects", "airhorn sound", "applause sound effect", "online soundboard"], faqs: [["Can I use it during streams?", "Yes, open it in a browser tab and click the buttons."], ["Is it free?", "Yes, completely free."]] },
  "audio-loop-maker": { kind: "audio", h1: "Audio Loop Maker", title: "Audio Loop Maker - Make Seamless Audio Loops Online", description: "Cut a seamless loop from any audio file and repeat it with crossfades. Free online loop maker in your browser.", keywords: ["audio loop maker", "loop audio", "make a loop", "seamless audio loop", "music loop maker"], faqs: [["What is a seamless loop?", "A section that repeats without an audible gap or click, thanks to crossfades."], ["What format is the result?", "You can download the loop as an audio file."]] },
  "audio-looper-extender": { kind: "audio", h1: "Audio Looper & Extender", title: "Audio Looper & Extender - Repeat or Extend Audio Online", description: "Repeat an audio clip a number of times or extend it to a target length. Free online audio looper and extender.", keywords: ["audio looper", "extend audio", "repeat audio", "loop song", "make audio longer"], faqs: [["Can I make a song 1 hour long?", "Yes, set a target length and the clip repeats until it reaches it."], ["Are there gaps between repeats?", "Repeats can be crossfaded for smooth playback."]] },
  "tempo-detector": { kind: "audio", h1: "Tempo Detector", title: "BPM Detector - Find the Tempo of a Song Online Free", description: "Upload a song and detect its BPM automatically. Free online tempo and BPM detector that runs in your browser.", keywords: ["bpm detector", "tempo detector", "find bpm of song", "song bpm finder", "bpm analyzer"], faqs: [["How accurate is it?", "It works best on songs with a clear beat; you can double-check with Tap BPM."], ["Is my song uploaded?", "No. Analysis happens in your browser."]] },
  "audio-speed-changer": { kind: "audio", h1: "Audio Speed Changer", title: "Audio Speed Changer - Speed Up or Slow Down Audio Online", description: "Speed up or slow down audio with or without changing pitch. Free online audio speed changer for songs, podcasts and voice.", keywords: ["audio speed changer", "speed up audio", "slow down audio", "change audio speed", "sped up song maker", "slowed audio"], faqs: [["Can I keep the same pitch?", "Yes, choose to keep pitch so voices don't sound higher or lower."], ["Can I make slowed or sped-up songs?", "Yes, pick any speed from slow to fast."]] },
  "pitch-changer": { kind: "audio", h1: "Pitch Changer", title: "Pitch Changer - Change Audio Pitch Online Free", description: "Shift the pitch of any song or voice up or down in semitones while keeping the speed. Free online pitch changer and key shifter.", keywords: ["pitch changer", "change pitch of audio", "pitch shifter", "change song key", "transpose audio"], faqs: [["What is a semitone?", "One step on a piano keyboard. 12 semitones equal one octave."], ["Does the speed change?", "No, the tempo stays the same."]] },
  "bpm-changer": { kind: "audio", h1: "BPM Changer", title: "BPM Changer - Change Song Tempo to Any BPM Online", description: "Change a song's tempo to an exact target BPM online for free. Ideal for DJs, workouts and dance practice.", keywords: ["bpm changer", "change bpm of song", "tempo changer", "change song tempo", "bpm converter"], faqs: [["Do I need to know the original BPM?", "Enter it or detect it with the Tempo Detector, then choose the target BPM."], ["Does the pitch change?", "You can keep the original pitch."]] },
  "voice-changer": { kind: "audio", h1: "Voice Changer", title: "Voice Changer - Free Online Voice Effects", description: "Change your voice with chipmunk, deep, robot, radio, echo and more effects. Free online voice changer for audio files.", keywords: ["voice changer", "online voice changer", "voice effects", "robot voice", "chipmunk voice", "deep voice changer"], faqs: [["Can I use a recording?", "Yes, upload any audio file and apply an effect."], ["Is my voice uploaded?", "No. Effects are applied in your browser."]] },
  "silence-remover": { kind: "audio", h1: "Silence Remover", title: "Silence Remover - Remove Silence from Audio Online Free", description: "Remove silence and dead air from recordings automatically. Free online silence remover for podcasts, voice and lectures.", keywords: ["silence remover", "remove silence from audio", "cut silence", "remove dead air", "trim silence"], faqs: [["Can I set how quiet counts as silence?", "Yes, adjust the threshold and minimum silence length."], ["Does it work on long recordings?", "Yes, limited only by your device memory."]] },
  "reverse-audio": { kind: "audio", h1: "Reverse Audio", title: "Reverse Audio - Play Any Song Backwards Online", description: "Reverse any audio file and play it backwards. Free online audio reverser that runs in your browser.", keywords: ["reverse audio", "reverse song", "play audio backwards", "audio reverser", "reverse sound"], faqs: [["Can I download the reversed audio?", "Yes, download it after reversing."], ["Which formats work?", "MP3, WAV, M4A and most common audio formats."]] },
  "split-audio": { kind: "audio", h1: "Split Audio", title: "Split Audio - Split MP3 into Parts Online Free", description: "Split audio into equal parts or fixed-length pieces online for free. Divide long MP3 recordings in your browser.", keywords: ["split audio", "split mp3", "audio splitter", "cut audio into parts", "divide audio file"], faqs: [["Can I split into equal parts?", "Yes, choose the number of parts or the length of each piece."], ["Is quality reduced?", "Pieces keep good quality and can be downloaded one by one."]] },
  "audio-cutter": { kind: "audio", h1: "Audio Cutter / Trimmer", title: "Audio Cutter - Cut & Trim MP3 Online Free (Ringtone Maker)", description: "Cut and trim audio on a waveform and add fade in or fade out. Free online MP3 cutter and ringtone maker in your browser.", keywords: ["audio cutter", "mp3 cutter", "trim audio", "cut mp3 online", "ringtone maker", "audio trimmer"], faqs: [["Can I make a ringtone?", "Yes. Select the part you want, add a fade and download it."], ["Can I add fade in and fade out?", "Yes, both are available."]] },
  "audio-joiner": { kind: "audio", h1: "Audio Joiner / Merger", title: "Audio Joiner - Merge MP3 Files Online Free", description: "Join several audio files in any order into one MP3. Free online audio joiner and merger that runs in your browser.", keywords: ["audio joiner", "merge mp3", "combine audio files", "join songs", "mp3 merger"], faqs: [["Can I change the order?", "Yes, arrange the files before joining."], ["Can I mix different formats?", "Yes, MP3, WAV, M4A and more can be joined into one MP3."]] },
  "on-hold-audio-converter": { kind: "audio", h1: "On Hold Audio Converter", title: "On Hold Audio Converter - Convert Music for Phone Systems", description: "Convert audio for phone systems, IVR and music on hold: 8 kHz, mono, μ-law and A-law WAV. Free online on-hold converter.", keywords: ["on hold audio converter", "music on hold converter", "ivr audio converter", "8khz wav converter", "ulaw converter"], faqs: [["Which formats do phone systems need?", "Most need 8 kHz mono WAV in μ-law or A-law; check your system's guide."], ["Is it free?", "Yes, unlimited and free."]] },
  "8d-audio-converter": { kind: "audio", h1: "8D Audio Converter", title: "8D Audio Converter - Make 8D Songs Online Free", description: "Turn any song into rotating 8D audio for headphones online for free. Adjust rotation speed and reverb in your browser.", keywords: ["8d audio converter", "8d audio", "make 8d song", "8d music maker", "8d audio online"], faqs: [["What is 8D audio?", "A stereo effect that makes sound seem to move around your head. Use headphones."], ["Can I control the effect?", "Yes, change the rotation speed and depth."]] },
  "podcast-title-generator": { kind: "ai", h1: "Podcast Title Generator", title: "Podcast Title Generator - Free AI Episode Titles", description: "Generate catchy podcast episode titles with AI that make listeners press play. Free podcast title generator.", keywords: ["podcast title generator", "podcast episode title ideas", "podcast name generator", "ai podcast titles"], faqs: [["How long should an episode title be?", "Short and clear, ideally under 60 characters."], ["Is it free?", "Yes, no sign-up needed."]] },
  "podcast-title-checker": { kind: "ai", h1: "Podcast Title Checker", title: "Podcast Title Checker - Score & Improve Episode Titles", description: "Score any podcast episode title and get better alternatives with AI. Free podcast title analyzer.", keywords: ["podcast title checker", "podcast title analyzer", "episode title score", "improve podcast title"], faqs: [["What does the score measure?", "Clarity, length, keywords and curiosity."], ["Will it suggest better titles?", "Yes, you get improved alternatives."]] },
  "spotify-podcast-earnings-calculator": { kind: "calc", h1: "Spotify Podcast Earnings Calculator", title: "Spotify Podcast Earnings Calculator - Estimate Income", description: "Estimate monthly and yearly Spotify podcast earnings from your plays and audience. Free podcast income calculator.", keywords: ["spotify podcast earnings calculator", "podcast earnings calculator", "how much do podcasters make", "podcast income calculator"], faqs: [["How is the estimate calculated?", "It uses your monthly plays with typical ad and partner programme rates."], ["Are the numbers guaranteed?", "No, they are estimates. Real income depends on audience and deals."]] },
};

for (const [slug, e] of Object.entries(creator)) {
  seoData[`/creator-tools/${slug}`] = { kind: e.kind ?? "youtube", ...e } as SeoEntry;
}
