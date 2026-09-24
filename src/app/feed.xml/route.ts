import { getPublicProfile, getPublishedPosts, getSitePage } from "@/lib/data";
import { itemValue } from "@/lib/page-content";

function cdata(value: string) { return value.replace(/]]>/g, "]]]]><![CDATA[>"); }

export const dynamic = "force-dynamic";

export async function GET() {
  const [profile, posts, blogPage, chrome] = await Promise.all([getPublicProfile(), getPublishedPosts(), getSitePage("blog"), getSitePage("site-chrome")]);
  const base = profile.domain.replace(/\/$/, "");
  const feedCopy = chrome?.sectionMap.feeds;
  const titleTemplate = itemValue(feedCopy, "titleTemplate");
  const feedTitle = titleTemplate.replace("{name}", profile.displayName).replace("{title}", blogPage?.seoTitle || blogPage?.title || profile.eyebrow);
  const description = blogPage?.seoDescription || profile.eyebrow;
  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0"><channel>
<title>${cdata(feedTitle)}</title>
<link>${base}/blog</link>
<description><![CDATA[${cdata(description)}]]></description>
${posts.map((p) => `<item><title><![CDATA[${cdata(p.title)}]]></title><link>${base}/blog/${p.slug}</link><guid>${base}/blog/${p.slug}</guid><description><![CDATA[${cdata(p.excerpt)}]]></description><pubDate>${(p.publishedAt ?? p.createdAt).toUTCString()}</pubDate></item>`).join("\n")}
</channel></rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400" } });
}
