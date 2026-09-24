import { and, eq, inArray, lte } from "drizzle-orm";
import { db } from "@/db";
import { contentEntries, posts } from "@/db/schema";
import { stripHtml } from "@/lib/content";
import { getTaxonomyForPosts } from "@/lib/taxonomy";
import { getPublicPortfolioData, getSitePage } from "@/lib/data";
import { itemValue } from "@/lib/page-content";

export type KnowledgeSourceType = "POST" | "PROJECT" | "EXPERIENCE" | "PRINCIPLE" | "PROFILE" | "CONTENT_ENTRY";
export type PublicKnowledgeDocument = { sourceType: KnowledgeSourceType; sourceId: string; title: string; url: string; label: string; summary: string; text: string };

const contentRoute: Record<string, string> = { PRINCIPLE: "principle", ADR: "adr", ENGINEERING_NOTE: "engineering-note", OPEN_SOURCE: "open-source", CODE_SAMPLE: "code-sample", SPEAKING: "speaking", RECOMMENDATION: "recommendation", CHANGELOG: "changelog", USES: "uses", NOW: "now", READING_NOTE: "reading-note" };

export async function collectPublicKnowledgeDocuments(): Promise<PublicKnowledgeDocument[]> {
  const now = new Date();
  const [portfolio, postRows, contentRows, searchPage] = await Promise.all([
    getPublicPortfolioData(),
    db.select().from(posts).where(and(inArray(posts.status, ["PUBLISHED", "SCHEDULED"]), lte(posts.publishedAt, now))),
    db.select().from(contentEntries).where(eq(contentEntries.status, "PUBLISHED")),
    getSitePage("search"),
  ]);
  const taxonomy = await getTaxonomyForPosts(postRows.map((post) => post.id));
  const documents: PublicKnowledgeDocument[] = [];
  const p = portfolio.profile;
  const labels = searchPage?.sectionMap.sourceLabels;

  documents.push({
    sourceType: "PROFILE", sourceId: p.id, title: p.displayName || p.siteName, url: "/", label: itemValue(labels, "PROFILE"), summary: p.intro || p.headline,
    text: [p.eyebrow, p.headline, p.intro, p.currentFocus, ...portfolio.about, ...portfolio.skillGroups.flatMap((group) => group.items)].filter(Boolean).join("\n"),
  });

  for (const post of postRows) {
    const assigned = taxonomy.get(post.id) ?? { categories: [], tags: [] };
    documents.push({ sourceType: "POST", sourceId: post.id, title: post.title, url: `/blog/${post.slug}`, label: itemValue(labels, post.contentType), summary: post.excerpt, text: [post.title, post.excerpt, assigned.categories.join(", "), assigned.tags.join(", "), stripHtml(post.content)].join("\n") });
  }

  for (const project of portfolio.projects) {
    documents.push({ sourceType: "PROJECT", sourceId: project.id, title: project.title, url: `/work/${project.slug}`, label: project.kind, summary: project.summary, text: [project.title, project.summary, project.problem, project.constraints, project.challenge, project.solution, project.architecture, project.decisions, project.tradeoffs, project.implementation, project.reliabilitySecurity, project.impact, project.lessonsLearned, project.whatDifferently, project.techStack.join(", ")].filter(Boolean).join("\n") });
  }

  for (const experience of portfolio.experiences) {
    documents.push({ sourceType: "EXPERIENCE", sourceId: experience.id, title: `${experience.role} — ${experience.company}`, url: "/#experience", label: itemValue(labels, "EXPERIENCE"), summary: experience.summary, text: [experience.role, experience.company, experience.location, experience.summary, ...experience.highlights, ...experience.impactAreas].join("\n") });
  }

  for (const entry of contentRows) {
    const typePath = contentRoute[entry.type] ?? entry.type.toLowerCase().replaceAll("_", "-");
    documents.push({ sourceType: entry.type === "PRINCIPLE" ? "PRINCIPLE" : "CONTENT_ENTRY", sourceId: entry.id, title: entry.title, url: `/library/${typePath}/${entry.slug}`, label: itemValue(labels, entry.type), summary: entry.summary || stripHtml(entry.content || "").slice(0, 220), text: [entry.title, entry.summary, stripHtml(entry.content ?? "")].filter(Boolean).join("\n") });
  }
  return documents;
}
