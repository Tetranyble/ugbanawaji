import { youtubeEmbedUrl } from "@/lib/youtube";

export function YouTubeEmbed({ url, title }: { url?: string | null; title: string }) {
  const src = youtubeEmbedUrl(url);
  if (!src) return null;
  return <div className="relative aspect-video overflow-hidden rounded-2xl border border-border bg-black">
    <iframe src={src} title={title} className="absolute inset-0 h-full w-full" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
  </div>;
}
