export interface CreatorTool {
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: CreatorCategory;
  badge?: "Popular" | "New";
}

export const creatorCategories = [
  "YouTube SEO & Optimization",
  "YouTube Analytics & Monetization",
  "YouTube Video & Channel Utilities",
  "YouTube Media Downloaders",
  "Engagement & Interaction",
  "Image Tools",
  "Audio & Sound Tools",
  "Podcast Tools",
] as const;

export type CreatorCategory = (typeof creatorCategories)[number];

export const categoryIcons: Record<CreatorCategory, string> = {
  "YouTube SEO & Optimization": "🔍",
  "YouTube Analytics & Monetization": "📊",
  "YouTube Video & Channel Utilities": "📌",
  "YouTube Media Downloaders": "📥",
  "Engagement & Interaction": "🎉",
  "Image Tools": "🖼️",
  "Audio & Sound Tools": "🎙️",
  "Podcast Tools": "🎤",
};

const SEO: CreatorCategory = "YouTube SEO & Optimization";
const ANA: CreatorCategory = "YouTube Analytics & Monetization";
const UTL: CreatorCategory = "YouTube Video & Channel Utilities";
const DL: CreatorCategory = "YouTube Media Downloaders";
const ENG: CreatorCategory = "Engagement & Interaction";
const IMG: CreatorCategory = "Image Tools";
const AUD: CreatorCategory = "Audio & Sound Tools";
const POD: CreatorCategory = "Podcast Tools";

export const creatorTools: CreatorTool[] = [
  { slug: "youtube-video-ideas-generator", name: "Video Ideas Generator", icon: "💡", category: SEO, badge: "Popular", description: "Get fresh, specific video ideas for any niche, with working titles and angles." },
  { slug: "youtube-tags-generator", name: "Tags Generator", icon: "🏷️", category: SEO, badge: "Popular", description: "Generate SEO tags from real YouTube searches and AI, packed to the 500-character limit." },
  { slug: "youtube-tags-extractor", name: "Tags Extractor", icon: "🔖", category: SEO, badge: "Popular", description: "See and copy the hidden tags of any YouTube video." },
  { slug: "youtube-hashtags-generator", name: "Hashtags Generator", icon: "#️⃣", category: SEO, description: "Create relevant hashtags for videos and Shorts in one click." },
  { slug: "youtube-hashtags-extractor", name: "Hashtags Extractor", icon: "🔎", category: SEO, badge: "Popular", description: "Pull every hashtag used in a video's title and description." },
  { slug: "youtube-keyword-generator", name: "Keyword Generator", icon: "🗝️", category: SEO, badge: "New", description: "Find long-tail and question keywords people actually search on YouTube." },
  { slug: "youtube-title-generator", name: "Title Generator", icon: "✍️", category: SEO, description: "AI video titles with an SEO score for each one." },
  { slug: "youtube-description-copy", name: "Description Copy", icon: "📝", category: SEO, description: "Copy and analyse any video's description: links, hashtags, timestamps and word count." },
  { slug: "youtube-channel-keywords-copy", name: "Channel Keywords Copy", icon: "🔑", category: SEO, description: "Show and copy the keywords a channel has set in its settings." },
  { slug: "youtube-channel-name-generator", name: "Channel Name Generator", icon: "🪪", category: SEO, description: "Brandable, easy-to-spell channel name ideas for your niche." },

  { slug: "youtube-top-100-channels", name: "Top 100 Analyzer", icon: "🏆", category: ANA, badge: "Popular", description: "Track the biggest YouTube channels with daily rank and subscriber changes." },
  { slug: "youtube-ad-money-calculator", name: "Ad Money Calculator", icon: "💰", category: ANA, description: "Estimate YouTube ad earnings by views, niche and audience country." },
  { slug: "youtube-channel-stats-checker", name: "Channel Stats Checker", icon: "📈", category: ANA, badge: "New", description: "Channel stats and recent video performance, exportable to CSV/Excel." },
  { slug: "youtube-video-data-viewer", name: "Video Data Viewer", icon: "🧾", category: ANA, badge: "New", description: "Every public detail of a video: stats, tags, category, duration, status and thumbnails." },

  { slug: "youtube-channel-id-finder", name: "Channel ID Finder", icon: "🆔", category: UTL, description: "Find the UC… channel ID from any channel link, @handle or video." },
  { slug: "youtube-subscribe-link-generator", name: "Subscribe Link Generator", icon: "🔔", category: UTL, description: "Create a link that opens the subscribe pop-up for your channel." },
  { slug: "youtube-video-embedder", name: "Video Embedder", icon: "🧩", category: UTL, description: "Build embed codes with start/end time, autoplay, loop, mute and privacy mode." },
  { slug: "youtube-channel-search", name: "Channel Search", icon: "🔭", category: UTL, description: "Search YouTube channels and compare subscribers, views and videos." },
  { slug: "youtube-timestamp-generator", name: "Timestamp Generator", icon: "⏱️", category: UTL, description: "Make timestamp links and chapter lists for your video." },
  { slug: "youtube-playlist-length-calculator", name: "Playlist Length Calculator", icon: "⏳", category: UTL, description: "Total watch time of a playlist at every playback speed." },
  { slug: "youtube-playlist-to-text", name: "Playlist to Text Converter", icon: "📃", category: UTL, badge: "New", description: "Export playlist titles, links and descriptions to TXT, CSV or Excel." },
  { slug: "youtube-category-checker", name: "Category Checker", icon: "🗃️", category: UTL, badge: "New", description: "Check the official category of one video, many videos or a whole channel." },
  { slug: "youtube-channel-video-list", name: "Channel Video List Extractor", icon: "📋", category: UTL, description: "Export every public video of a channel with views, likes and dates." },

  { slug: "youtube-banner-downloader", name: "Banner Downloader", icon: "🖼️", category: DL, description: "Download a channel's banner and profile picture in full size." },
  { slug: "youtube-thumbnail-downloader", name: "Thumbnail Downloader", icon: "📸", category: DL, description: "Download video thumbnails in every available resolution." },

  { slug: "youtube-comment-picker", name: "Comment Picker", icon: "🎁", category: ENG, description: "Pick random giveaway winners from a video's comments, with fair filters." },
  { slug: "youtube-comments-downloader", name: "Comments Downloader", icon: "💬", category: ENG, badge: "New", description: "Search, sort and export comments and replies to CSV/Excel." },

  { slug: "compress-image", name: "Compress Image", icon: "🗜️", category: IMG, badge: "New", description: "Compress and resize JPG, PNG and WEBP images in your browser." },

  { slug: "tap-bpm", name: "Tap BPM Tempo Counter", icon: "👆", category: AUD, description: "Tap along to a song to find its tempo in beats per minute." },
  { slug: "water-eject-sound", name: "Water Ejection Sounds", icon: "💧", category: AUD, description: "Low-frequency tones that help push water out of your phone speaker." },
  { slug: "soundboard", name: "Soundboard", icon: "🔊", category: AUD, description: "Instant sound effect buttons: airhorn, applause, drum roll, buzzer and more." },
  { slug: "audio-loop-maker", name: "Audio Loop Maker", icon: "🔁", category: AUD, badge: "New", description: "Cut a seamless loop from any audio and repeat it with crossfades." },
  { slug: "audio-looper-extender", name: "Audio Looper & Extender", icon: "➿", category: AUD, badge: "New", description: "Repeat a clip a number of times or until it reaches a target length." },
  { slug: "tempo-detector", name: "Tempo Detector", icon: "🥁", category: AUD, badge: "New", description: "Upload a song and detect its BPM automatically." },
  { slug: "audio-speed-changer", name: "Audio Speed Changer", icon: "⏩", category: AUD, badge: "New", description: "Speed up or slow down audio with or without changing pitch." },
  { slug: "pitch-changer", name: "Pitch Changer", icon: "🎚️", category: AUD, badge: "New", description: "Shift the pitch up or down in semitones while keeping the speed." },
  { slug: "bpm-changer", name: "BPM Changer", icon: "🎛️", category: AUD, badge: "New", description: "Change a song's tempo to an exact target BPM." },
  { slug: "voice-changer", name: "Voice Changer", icon: "🗣️", category: AUD, badge: "New", description: "Chipmunk, deep, robot, radio, echo and more voice effects." },
  { slug: "silence-remover", name: "Silence Remover", icon: "🔇", category: AUD, badge: "New", description: "Remove silence and dead air from recordings automatically." },
  { slug: "reverse-audio", name: "Reverse Audio", icon: "⏪", category: AUD, badge: "New", description: "Play any audio backwards and download it." },
  { slug: "split-audio", name: "Split Audio", icon: "✂️", category: AUD, badge: "New", description: "Split audio into equal parts or fixed-length pieces." },
  { slug: "audio-cutter", name: "Audio Cutter / Trimmer", icon: "🎵", category: AUD, badge: "New", description: "Trim audio on a waveform and add fade in / fade out." },
  { slug: "audio-joiner", name: "Audio Joiner / Merger", icon: "🔗", category: AUD, badge: "New", description: "Join several audio files in any order into one MP3." },
  { slug: "on-hold-audio-converter", name: "On Hold Audio Converter", icon: "☎️", category: AUD, badge: "New", description: "Format audio for phone systems, IVR and music-on-hold (8 kHz, μ-law, A-law)." },
  { slug: "8d-audio-converter", name: "8D Audio Converter", icon: "🎧", category: AUD, badge: "New", description: "Turn any song into rotating 8D audio for headphones." },

  { slug: "podcast-title-generator", name: "Podcast Title Generator", icon: "🎙️", category: POD, description: "AI episode titles that make listeners press play." },
  { slug: "podcast-title-checker", name: "Podcast Title Checker", icon: "✅", category: POD, description: "Score an episode title and get better alternatives." },
  { slug: "spotify-podcast-earnings-calculator", name: "Spotify Podcast Earnings Calculator", icon: "🟢", category: POD, badge: "New", description: "Estimate monthly and yearly Spotify podcast earnings." },
];

export function getCreatorTool(slug: string) {
  return creatorTools.find((t) => t.slug === slug);
}
