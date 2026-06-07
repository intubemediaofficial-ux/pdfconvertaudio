# PDF Tools + Audio Converter — Complete Handoff Document

## Quick Start (नई Devin के लिए)

```bash
# 1. Source code ZIP extract करो (user upload करेगा)
unzip pdf-tools-source.zip -d /home/ubuntu/repos/pdf-tools

# 2. Dependencies install करो
cd /home/ubuntu/repos/pdf-tools
npm install

# 3. Dev server start करो
npm run dev
# App runs at http://localhost:3000

# 4. Static export build करो (deployment के लिए)
npm run build
# Output: /home/ubuntu/repos/pdf-tools/out/
```

---

## Project Overview

**Website:** PDF tools + Audio converter — सब browser में client-side काम करता है, कोई server upload नहीं।

**Total tools: 27**
- 22 PDF tools
- 5 Audio converter tools (including universal converter)

**Tech Stack:**
- **Framework:** Next.js 16.2.6 (App Router) + React 19 + TypeScript
- **Styling:** Tailwind CSS 4
- **PDF:** pdf-lib, pdfjs-dist (v5.6.205), mammoth, docx, xlsx, pptxgenjs
- **Audio:** FFmpeg.wasm (@ffmpeg/ffmpeg 0.12.15 + @ffmpeg/core 0.12.6)
- **Build:** Static export (`output: "export"` in next.config.ts)
- **Bundler:** Turbopack (Next.js 16 default)

---

## Project Structure

```
pdf-tools/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx            # Homepage — tool cards grid + category filter
│   │   ├── layout.tsx          # Root layout with Header + Footer
│   │   ├── globals.css         # Tailwind + custom CSS styles
│   │   ├── merge-pdf/page.tsx  # Merge PDF tool
│   │   ├── split-pdf/page.tsx  # Split PDF tool
│   │   ├── compress-pdf/page.tsx
│   │   ├── rotate-pdf/page.tsx
│   │   ├── pdf-to-jpg/page.tsx
│   │   ├── jpg-to-pdf/page.tsx
│   │   ├── watermark-pdf/page.tsx
│   │   ├── page-numbers/page.tsx
│   │   ├── organize-pdf/page.tsx
│   │   ├── crop-pdf/page.tsx
│   │   ├── edit-pdf/page.tsx       # Sejda-style inline PDF editor
│   │   ├── sign-pdf/page.tsx       # Full signature system (draw/type/saved signers)
│   │   ├── pdf-to-word/page.tsx
│   │   ├── word-to-pdf/page.tsx
│   │   ├── pdf-to-excel/page.tsx
│   │   ├── excel-to-pdf/page.tsx
│   │   ├── pdf-to-ppt/page.tsx
│   │   ├── ppt-to-pdf/page.tsx
│   │   ├── html-to-pdf/page.tsx
│   │   ├── protect-pdf/page.tsx
│   │   ├── unlock-pdf/page.tsx
│   │   ├── audio-converter/page.tsx  # Universal audio converter (CloudConvert-style)
│   │   ├── mp3-to-wav/page.tsx
│   │   ├── wav-to-mp3/page.tsx
│   │   ├── mp4-to-mp3/page.tsx
│   │   └── mp4-to-wav/page.tsx
│   ├── components/
│   │   ├── Header.tsx          # Navigation header with PDF/Audio sections
│   │   ├── Footer.tsx          # Footer with all tool links
│   │   ├── FileUpload.tsx      # Reusable file upload component
│   │   └── ComingSoonTool.tsx  # (Not used anymore — all tools are working)
│   └── lib/
│       ├── tools.ts            # Tool definitions, categories, metadata
│       ├── ffmpeg-helper.ts    # FFmpeg.wasm proxy (CRITICAL — see below)
│       ├── pdf-utils.ts        # PDF utility functions
│       └── pdf-encrypt.ts      # PDF encryption for Protect PDF tool
├── public/
│   └── pdf.worker.min.mjs      # PDF.js worker file (local copy)
├── package.json
├── next.config.ts              # Static export config
├── tsconfig.json
├── tailwind.config.ts
└── postcss.config.mjs
```

---

## All 27 Tools — Status & Details

### PDF Tools (22):

| # | Tool | Route | Status | Library |
|---|------|-------|--------|---------|
| 1 | Merge PDF | `/merge-pdf` | ✅ Working | pdf-lib |
| 2 | Split PDF | `/split-pdf` | ✅ Working | pdf-lib |
| 3 | Compress PDF | `/compress-pdf` | ✅ Working | pdf-lib |
| 4 | Rotate PDF | `/rotate-pdf` | ✅ Working | pdf-lib |
| 5 | PDF to JPG | `/pdf-to-jpg` | ✅ Working | pdfjs-dist + canvas |
| 6 | JPG to PDF | `/jpg-to-pdf` | ✅ Working | pdf-lib |
| 7 | Watermark | `/watermark-pdf` | ✅ Working | pdf-lib |
| 8 | Page Numbers | `/page-numbers` | ✅ Working | pdf-lib |
| 9 | Organize PDF | `/organize-pdf` | ✅ Working | pdf-lib |
| 10 | Crop PDF | `/crop-pdf` | ✅ Working | pdf-lib |
| 11 | Edit PDF | `/edit-pdf` | ✅ Working | pdf-lib + pdfjs-dist (Sejda-style inline editor) |
| 12 | Sign PDF | `/sign-pdf` | ✅ Working | pdf-lib + canvas (draw/type signature, saved signers) |
| 13 | PDF to Word | `/pdf-to-word` | ✅ Working | pdfjs-dist → text extraction → docx |
| 14 | Word to PDF | `/word-to-pdf` | ✅ Working | mammoth → pdf-lib |
| 15 | PDF to Excel | `/pdf-to-excel` | ✅ Working | pdfjs-dist → xlsx |
| 16 | Excel to PDF | `/excel-to-pdf` | ✅ Working | xlsx → pdf-lib |
| 17 | PDF to PPT | `/pdf-to-ppt` | ✅ Working | pdfjs-dist → pptxgenjs |
| 18 | PPT to PDF | `/ppt-to-pdf` | ✅ Working | pptxgenjs → pdf-lib |
| 19 | HTML to PDF | `/html-to-pdf` | ✅ Working | iframe render → canvas → pdf-lib |
| 20 | Protect PDF | `/protect-pdf` | ✅ Working | pdf-lib + pdf-encrypt.ts |
| 21 | Unlock PDF | `/unlock-pdf` | ✅ Working | pdf-lib |
| 22 | Organize PDF | `/organize-pdf` | ✅ Working | pdf-lib (drag-drop page reorder) |

### Audio Tools (5):

| # | Tool | Route | Status | Library |
|---|------|-------|--------|---------|
| 1 | Universal Audio Converter | `/audio-converter` | ✅ Working | FFmpeg.wasm |
| 2 | MP3 to WAV | `/mp3-to-wav` | ✅ Working | FFmpeg.wasm |
| 3 | WAV to MP3 | `/wav-to-mp3` | ✅ Working | FFmpeg.wasm |
| 4 | MP4 to MP3 | `/mp4-to-mp3` | ✅ Working | FFmpeg.wasm |
| 5 | MP4 to WAV | `/mp4-to-wav` | ✅ Working | FFmpeg.wasm |

---

## CRITICAL: FFmpeg Worker Fix (Important for future development)

### Problem:
Next.js 16 (Turbopack) cannot bundle `@ffmpeg/ffmpeg` Worker with dynamic `new Worker(new URL(...))`. Error: `"Cannot find module as expression is too dynamic"` or `"Cannot find module 'blob:...'"`.

### Solution (in `src/lib/ffmpeg-helper.ts`):
Custom Worker proxy that bypasses Turbopack bundling:

1. **Worker file** loaded from CDN (UMD version):
   ```
   https://unpkg.com/@ffmpeg/ffmpeg@0.12.15/dist/umd/814.ffmpeg.js
   ```

2. **FFmpeg Core** loaded from CDN (UMD version):
   ```
   https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js
   https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm
   ```

3. **How it works:**
   - `createFFmpegProxy()` creates a Worker from the CDN URL via `toBlobURL()`
   - Worker uses `importScripts()` internally (needs real HTTP URLs, not blob)
   - Core URLs are UMD (not ESM) because Worker context uses `importScripts()`
   - Custom message protocol: `LOAD`, `WRITE_FILE`, `READ_FILE`, `DELETE_FILE`, `EXEC`

### If you need to modify audio tools:
- Always use UMD URLs from unpkg CDN — do NOT try to import FFmpeg directly
- Do NOT use `await import('@ffmpeg/ffmpeg')` — it breaks in static export
- The `getFFmpeg()` function is the singleton entry point
- The `convertAudio()` function is the main conversion API

---

## PDF.js Worker Fix

### Problem:
`pdfjs-dist` v5.6.205 needs a Worker file. Dynamic import fails in static export.

### Solution:
- Worker file copied to `public/pdf.worker.min.mjs`
- In each PDF tool that uses pdfjs-dist, worker is configured as:
  ```typescript
  import * as pdfjsLib from "pdfjs-dist";
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  ```

---

## Design System

### Colors:
- Primary: Red/Orange gradient (`bg-gradient-to-br from-red-50 via-white to-orange-50`)
- Buttons: `bg-red-500 hover:bg-red-600` (primary), `bg-gray-100` (secondary)
- Tool cards: White with shadow, hover effect

### Fonts:
- Titles: `text-5xl md:text-6xl font-extrabold` (hero), `text-4xl font-bold` (tool pages)
- Body: `text-xl`, `text-lg`
- Buttons: `text-xl font-bold px-10 py-4`

### Upload Zone:
- Dashed border with glow effect on hover
- Smart emoji per tool type
- Green shield badge: "Your files stay in your browser"

### Layout:
- `Header.tsx` — navigation with PDF Tools dropdown + Audio link
- `Footer.tsx` — all tool links in 3 columns + Audio section
- Every tool page follows same pattern: title → upload → tool UI → download

---

## Commands

```bash
# Development
npm run dev            # Start dev server (Turbopack, port 3000)

# Build (static export)
npm run build          # Creates /out/ directory with static HTML

# Serve static build
npx serve out -p 3001  # Serve the built output (DON'T use -s flag)
# NOTE: Don't use `serve -s` (SPA mode) — it routes all pages to index.html

# Lint
npm run lint           # ESLint

# Deploy to Vercel
# 1. Connect repo to Vercel
# 2. Build command: npm run build
# 3. Output directory: out
# 4. Framework: Next.js
```

---

## Known Issues & Notes

1. **Audio conversion error sometimes shows even after successful conversion** — The file downloads correctly but a stale error message from previous attempts may briefly appear. Cosmetic issue only.

2. **Large files (100MB+)** — FFmpeg.wasm runs in browser, so very large files will be slow. No server-side fallback.

3. **FFmpeg first load** — First audio conversion downloads ~25MB FFmpeg WASM from CDN. After that it's cached.

4. **YouTube URL conversion** — NOT supported (YouTube ToS + CORS restrictions). Users must upload their own files.

5. **PDF to Word/Excel/PPT** — These are text-extraction based, not pixel-perfect conversions. Complex layouts may not convert perfectly.

6. **Next.js 16 breaking changes** — Always check `node_modules/next/dist/docs/` before modifying framework-level code. Use `"use client"` directive for all interactive components.

---

## Git History (PRs merged into main)

| PR | Description |
|----|-------------|
| #1 | Initial PDF Tools website with 21 tools |
| #2 | Complete UI design overhaul + 3 new tools (PDF to PPT, PPT to PDF, HTML to PDF) |
| #3 | PDF worker CDN path fix + Word to PDF tab character encoding |
| #4 | PDF worker local file + complete Sign PDF redesign |
| #5 | Audio Converter tools (MP3↔WAV, MP4→MP3, MP4→WAV) |
| #6 | Universal Audio Converter + FFmpeg import error fix |
| #7 | FFmpeg conversion error fix + CloudConvert-style dual format picker |

---

## Deployment Plan (Pending)

**Target domain:** convertus.com (or similar — user is choosing)
**Hosting:** Vercel (free tier sufficient)

**Steps:**
1. User buys domain (Namecheap recommended)
2. Create new GitHub repo under new account
3. Push this code to new repo
4. Connect repo to Vercel
5. Add custom domain in Vercel dashboard
6. Configure DNS: CNAME to `cname.vercel-dns.com`
7. SSL auto-enabled by Vercel

---

## New Devin Session Instructions

जब नई Devin session start करो, ये message paste करो:

```
मेरे पास एक PDF Tools + Audio Converter website का complete source code है (ZIP file attached)। ये features हैं:

- 22 PDF tools (merge, split, compress, rotate, edit, sign, convert — सब client-side)
- 5 Audio tools (universal converter + MP3/WAV/MP4 conversions — FFmpeg.wasm)
- Next.js 16 + React 19 + Tailwind CSS
- Static export build (output: "export")

IMPORTANT: FFmpeg.wasm ko custom Worker proxy se load karna padta hai (CDN UMD URLs) — details HANDOFF.md me hain. Regular import se "Cannot find module" error aata hai.

Attached: pdf-tools-source.zip + HANDOFF.md

Pehle:
1. ZIP extract karo /home/ubuntu/repos/pdf-tools/ me
2. npm install karo
3. npm run dev se verify karo ki sab chal raha hai
4. HANDOFF.md padho — usme puri architecture aur known issues hain

Fir batao kya changes karne hain!
```

---

*Last updated: May 2026 | Session: Devin (vijendra95/pdf-tools)*
