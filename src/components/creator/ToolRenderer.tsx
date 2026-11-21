"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import { Spinner } from "./ui";

const loading = () => <Spinner label="Loading tool…" />;
const seo = () => import("./tools/youtube-seo");
const ana = () => import("./tools/youtube-analytics");
const utl = () => import("./tools/youtube-utils");
const media = () => import("./tools/youtube-media");
const img = () => import("./tools/image");
const ab = () => import("./tools/audio-basic");
const ae = () => import("./tools/audio-edit");
const pod = () => import("./tools/podcast");

type Mod = Record<string, ComponentType>;
const pick = (loader: () => Promise<unknown>, name: string) =>
  dynamic(async () => ((await loader()) as Mod)[name], { ssr: false, loading });

const map: Record<string, ComponentType> = {
  "youtube-video-ideas-generator": pick(seo, "VideoIdeas"),
  "youtube-tags-generator": pick(seo, "TagsGenerator"),
  "youtube-tags-extractor": pick(seo, "TagsExtractor"),
  "youtube-hashtags-generator": pick(seo, "HashtagsGenerator"),
  "youtube-hashtags-extractor": pick(seo, "HashtagsExtractor"),
  "youtube-keyword-generator": pick(seo, "KeywordGenerator"),
  "youtube-title-generator": pick(seo, "TitleGenerator"),
  "youtube-description-copy": pick(seo, "DescriptionCopy"),
  "youtube-channel-keywords-copy": pick(seo, "ChannelKeywords"),
  "youtube-channel-name-generator": pick(seo, "ChannelNames"),
  "youtube-top-100-channels": pick(ana, "Top100"),
  "youtube-ad-money-calculator": pick(ana, "AdMoney"),
  "youtube-channel-stats-checker": pick(ana, "ChannelStats"),
  "youtube-video-data-viewer": pick(ana, "VideoData"),
  "youtube-channel-id-finder": pick(utl, "ChannelIdFinder"),
  "youtube-subscribe-link-generator": pick(utl, "SubscribeLink"),
  "youtube-video-embedder": pick(utl, "VideoEmbedder"),
  "youtube-channel-search": pick(utl, "ChannelSearch"),
  "youtube-timestamp-generator": pick(utl, "TimestampGenerator"),
  "youtube-playlist-length-calculator": pick(utl, "PlaylistLength"),
  "youtube-playlist-to-text": pick(utl, "PlaylistToText"),
  "youtube-category-checker": pick(utl, "CategoryChecker"),
  "youtube-channel-video-list": pick(utl, "ChannelVideoList"),
  "youtube-video-downloader": pick(media, "VideoDownloader"),
  "youtube-to-mp3": pick(media, "YouTubeToMp3"),
  "youtube-shorts-downloader": pick(media, "ShortsDownloader"),
  "youtube-banner-downloader": pick(media, "BannerDownloader"),
  "youtube-thumbnail-downloader": pick(media, "ThumbnailDownloader"),
  "youtube-comment-picker": pick(media, "CommentPicker"),
  "youtube-comments-downloader": pick(media, "CommentsDownloader"),
  "compress-image": pick(img, "CompressImage"),
  "tap-bpm": pick(ab, "TapBpm"),
  "water-eject-sound": pick(ab, "WaterEject"),
  soundboard: pick(ab, "Soundboard"),
  "tempo-detector": pick(ab, "TempoDetector"),
  "audio-loop-maker": pick(ae, "LoopMaker"),
  "audio-looper-extender": pick(ae, "LooperExtender"),
  "audio-speed-changer": pick(ae, "SpeedChanger"),
  "pitch-changer": pick(ae, "PitchChanger"),
  "bpm-changer": pick(ae, "BpmChanger"),
  "voice-changer": pick(ae, "VoiceChanger"),
  "silence-remover": pick(ae, "SilenceRemover"),
  "reverse-audio": pick(ae, "ReverseAudio"),
  "split-audio": pick(ae, "SplitAudio"),
  "audio-cutter": pick(ae, "AudioCutter"),
  "audio-joiner": pick(ae, "AudioJoiner"),
  "on-hold-audio-converter": pick(ae, "OnHoldConverter"),
  "8d-audio-converter": pick(ae, "EightD"),
  "podcast-title-generator": pick(pod, "PodcastTitles"),
  "podcast-title-checker": pick(pod, "PodcastTitleChecker"),
  "spotify-podcast-earnings-calculator": pick(pod, "SpotifyEarnings"),
};

export default function ToolRenderer({ slug }: { slug: string }) {
  const C = map[slug];
  return C ? <C /> : null;
}
