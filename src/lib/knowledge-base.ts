import { and, eq, inArray, lte } from "drizzle-orm";
import { db } from "@/db";
import { contentEntries, experiences, posts, projects, siteSettings } from "@/db/schema";
import { stripHtml } from "@/lib/content";
import { getTaxonomyForPosts } from "@/lib/taxonomy";
import { profile as fallbackProfile } from "@/content/profile";

export type KnowledgeSourceType = "POST" | "PROJECT" | "EXPERIENCE" | "PRINCIPLE" | "PROFILE" | "CONTENT_ENTRY";

export type PublicKnowledgeDocument = {
  sourceType: KnowledgeSourceType;
  sourceId: string;
  title: string;
  url: string;
  label: string;
  summary: string;
  text: string;
};

const contentRoute: Record<string, string> = {
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

export async function collectPublicKnowledgeDocuments(): Promise<PublicKnowledgeDocument[]> {
  const now = new Date();
  const [postRows, projectRows, experienceRows, contentRows, settings] = await Promise.all([
    db.select().from(posts).where(and(inArray(posts.status, ["PUBLISHED", "SCHEDULED"]), lte(posts.publishedAt, now))),
    db.select().from(projects).where(eq(projects.status, "PUBLISHED")),
    db.select().from(experiences),
    db.select().from(contentEntries).where(eq(contentEntries.status, "PUBLISHED")),
    db.select().from(siteSettings).where(eq(siteSettings.key, "profile")).limit(1),
  ]);

  const publicProfile = { ...fallbackProfile, ...((settings[0]?.value ?? {}) as Record<string, unknown>) } as typeof fallbackProfile;
  const taxonomy = await getTaxonomyForPosts(postRows.map((post) => post.id));
  const documents: PublicKnowledgeDocument[] = [];

  documents.push({
    sourceType: "PROFILE",
    sourceId: "profile",
    title: String(publicProfile.displayName),
    url: "/",
    label: "Profile",
    summary: String(publicProfile.intro || publicProfile.headline),
    text: [publicProfile.eyebrow, publicProfile.headline, publicProfile.intro, publicProfile.currentFocus, ...(publicProfile.about as string[]), ...(publicProfile.stack as string[])].join("\n"),
  });

  for (const post of postRows) {
    const assigned = taxonomy.get(post.id) ?? { categories: [], tags: [] };
    documents.push({
      sourceType: "POST",
      sourceId: post.id,
      title: post.title,
      url: `/blog/${post.slug}`,
      label: post.contentType.replaceAll("_", " "),
      summary: post.excerpt,
      text: [post.title, post.excerpt, assigned.categories.join(", "), assigned.tags.join(", "), stripHtml(post.content)].join("\n"),
    });
  }

  for (const project of projectRows) {
    documents.push({
      sourceType: "PROJECT",
      sourceId: project.id,
      title: project.title,
      url: `/work/${project.slug}`,
      label: project.kind,
      summary: project.summary,
      text: [project.title, project.summary, project.problem, project.constraints, project.challenge, project.solution, project.architecture, project.decisions, project.tradeoffs, project.implementation, project.reliabilitySecurity, project.impact, project.lessonsLearned, project.whatDifferently, (project.techStack ?? []).join(", ")].filter(Boolean).join("\n"),
    });
  }

  for (const experience of experienceRows) {
    documents.push({
      sourceType: "EXPERIENCE",
      sourceId: experience.id,
      title: `${experience.role} — ${experience.company}`,
      url: "/#experience",
      label: "Experience",
      summary: experience.summary,
      text: [experience.role, experience.company, experience.location, experience.summary, ...(experience.highlights ?? []), ...(experience.impactAreas ?? [])].join("\n"),
    });
  }

  for (const entry of contentRows) {
    const typePath = contentRoute[entry.type] ?? entry.type.toLowerCase().replaceAll("_", "-");
    documents.push({
      sourceType: entry.type === "PRINCIPLE" ? "PRINCIPLE" : "CONTENT_ENTRY",
      sourceId: entry.id,
      title: entry.title,
      url: `/library/${typePath}/${entry.slug}`,
      label: entry.type.replaceAll("_", " "),
      summary: entry.summary || stripHtml(entry.content || "").slice(0, 220),
      text: [entry.title, entry.summary, stripHtml(entry.content ?? "")].filter(Boolean).join("\n"),
    });
  }

  return documents;
}
