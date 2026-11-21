export interface DownloaderPage {
  path: string;
  name: string;
  icon: string;
  tagline: string;
  tab: "video" | "audio";
}

export const downloaderPages: DownloaderPage[] = [
  { path: "/youtube-downloader", name: "YouTube Downloader", icon: "⬇️", tagline: "Download any YouTube video as MP4 in 4K, 1080p or 720p, or as MP3 audio. Free, fast, no sign-up.", tab: "video" },
  { path: "/youtube-to-mp4", name: "YouTube to MP4", icon: "🎞️", tagline: "Convert YouTube videos to MP4 in every quality from 144p up to 4K.", tab: "video" },
  { path: "/youtube-4k-downloader", name: "YouTube 4K Downloader", icon: "📺", tagline: "Download YouTube videos in 4K (2160p) and 2K (1440p) Ultra HD.", tab: "video" },
  { path: "/youtube-to-mp3", name: "YouTube to MP3", icon: "🎵", tagline: "Convert YouTube videos to MP3 320 kbps or M4A audio in seconds.", tab: "audio" },
  { path: "/youtube-shorts-downloader", name: "YouTube Shorts Downloader", icon: "📲", tagline: "Download YouTube Shorts as vertical HD MP4 or MP3, no watermark.", tab: "video" },
  { path: "/youtube-1080p-downloader", name: "YouTube 1080p Downloader", icon: "🖥️", tagline: "Download YouTube videos in 1080p Full HD MP4 that plays everywhere.", tab: "video" },
  { path: "/yt-downloader", name: "YT Downloader", icon: "⚡", tagline: "Fast YT downloader: paste a link, the video opens instantly.", tab: "video" },
  { path: "/creator-tools/youtube-video-downloader", name: "YouTube Video Downloader", icon: "🎬", tagline: "", tab: "video" },
  { path: "/creator-tools/youtube-to-mp3", name: "YouTube to MP3", icon: "🎧", tagline: "", tab: "audio" },
  { path: "/creator-tools/youtube-shorts-downloader", name: "Shorts Downloader", icon: "📱", tagline: "", tab: "video" },
];

export function downloaderPage(path: string) {
  return downloaderPages.find((d) => d.path === path);
}
