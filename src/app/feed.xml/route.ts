import { getPublicProfile, getPublishedPosts } from "@/lib/data";

function cdata(value: string) { return value.replace(/]]>/g, "]]]]><![CDATA[>"); }

export const dynamic = "force-dynamic";

export async function GET() {
  const [profile, posts] = await Promise.all([getPublicProfile(), getPublishedPosts()]);
  const base = profile.domain.replace(/\/$/, "");
  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0"><channel>
<title>${profile.displayName} — Technical Writing</title>
<link>${base}/blog</link>
<description>${profile.eyebrow}</description>
${posts.map((p) => `<item><title><![CDATA[${cdata(p.title)}]]></title><link>${base}/blog/${p.slug}</link><guid>${base}/blog/${p.slug}</guid><description><![CDATA[${cdata(p.excerpt)}]]></description><pubDate>${(p.publishedAt ?? p.createdAt).toUTCString()}</pubDate></item>`).join("\n")}
</channel></rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400" } });
}
