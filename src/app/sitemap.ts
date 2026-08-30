import type { MetadataRoute } from "next";
import { getPublicProfile, getPublishedPosts, getPublishedProjects } from "@/lib/data";
import { getNewsletterArchive, getPublishedContent, getPublishedSeries } from "@/lib/platform-data";

export const dynamic = "force-dynamic";

const contentPath: Record<string, string> = {
  PRINCIPLE: "principle",
  ADR: "adr",
  ENGINEERING_NOTE: "engineering-note",
  OPEN_SOURCE: "open-source",
  CODE_SAMPLE: "code-sample",
  SPEAKING: "speaking",
  RECOMMENDATION: "recommendation",
  CHANGELOG: "changelog",
  USES: "uses",
  NOW: "now",
  READING_NOTE: "reading-note",
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [profile, posts, projects, content, series, newsletters] = await Promise.all([
    getPublicProfile(),
    getPublishedPosts(),
    getPublishedProjects(),
    getPublishedContent(),
    getPublishedSeries(),
    getNewsletterArchive(),
  ]);
  const base = profile.domain.replace(/\/$/, "");
  const now = new Date();
  const staticRoutes = [
    ["/", 1], ["/work", 0.9], ["/series", 0.7], ["/blog", 0.9], ["/search", 0.7], ["/ask", 0.8], ["/hire", 0.8],
    ["/principles", 0.8], ["/decisions", 0.7], ["/notes", 0.7], ["/open-source", 0.7],
    ["/code", 0.6], ["/speaking", 0.6], ["/recommendations", 0.5], ["/reading", 0.6],
    ["/changelog", 0.4], ["/uses", 0.4], ["/now", 0.5], ["/newsletter/archive", 0.5],
    ["/privacy", 0.2], ["/security", 0.2],
  ] as const;

  return [
    ...staticRoutes.map(([path, priority]) => ({ url: `${base}${path === "/" ? "" : path}`, lastModified: now, priority })),
    ...projects.map((project) => ({ url: `${base}/work/${project.slug}`, lastModified: "updatedAt" in project && project.updatedAt instanceof Date ? project.updatedAt : now, priority: 0.8 })),
    ...posts.map((post) => ({ url: `${base}/blog/${post.slug}`, lastModified: post.updatedAt, priority: 0.7 })),
    ...series.map((item) => ({ url: `${base}/series/${item.slug}`, lastModified: item.updatedAt, priority: 0.6 })),
    ...content.map((item) => ({ url: `${base}/library/${contentPath[item.type] ?? item.type.toLowerCase()}/${item.slug}`, lastModified: item.updatedAt, priority: 0.55 })),
    ...newsletters.filter((item) => item.slug).map((item) => ({ url: `${base}/newsletter/archive/${item.slug}`, lastModified: item.sentAt ?? item.updatedAt, priority: 0.45 })),
  ];
}
