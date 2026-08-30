"use server";

import { createHash, randomBytes, randomUUID } from "crypto";
import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { auth, signOut } from "@/auth";
import { db } from "@/db";
import { contactMessages, contentEntries, experiences, postRevisions, postSeries, posts, previewTokens, projectRevisions, projects, resumeVariants, siteSettings, slugRedirects } from "@/db/schema";
import { writeAudit } from "@/lib/audit";
import { sanitizePostHtml } from "@/lib/content";
import { estimateReadingMinutes, parseCommaList, parseJsonList, slugify } from "@/lib/utils";
import { contentEntrySchema, postSchema, projectSchema } from "@/lib/validation";
import { syncPostTaxonomy } from "@/lib/taxonomy";
import { profile as defaultProfile } from "@/content/profile";
import { parseAppDateTime } from "@/lib/time";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { reindexPublicPortfolio } from "@/lib/ai";
import { queuePublicPortfolioReindex, retryFailedAiIndexJobs, supersedePendingAiIndexJobs } from "@/lib/ai/index-jobs";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") redirect("/admin/login");
  return session.user;
}

function scheduleAiReindex(priority = 70) {
  after(async () => {
    try { await queuePublicPortfolioReindex({ priority }); } catch (error) { console.error("AI knowledge re-index queue failed", error); }
  });
}

export async function logout() { await signOut({ redirectTo: "/admin/login" }); }

function parsePostForm(formData: FormData) {
  const title = String(formData.get("title") ?? "");
  return postSchema.parse({
    title,
    slug: String(formData.get("slug") || slugify(title)),
    excerpt: String(formData.get("excerpt") ?? ""),
    content: String(formData.get("content") ?? ""),
    contentJson: String(formData.get("contentJson") ?? ""),
    coverImage: String(formData.get("coverImage") ?? ""),
    youtubeUrl: String(formData.get("youtubeUrl") ?? ""),
    categories: parseJsonList(formData.get("categories")),
    tags: parseJsonList(formData.get("tags")),
    status: String(formData.get("status") ?? "DRAFT"),
    contentType: String(formData.get("contentType") ?? "ARTICLE"),
    seriesId: String(formData.get("seriesId") ?? ""),
    seriesOrder: Number(formData.get("seriesOrder") ?? 0),
    publishedAt: String(formData.get("publishedAt") ?? ""),
    seoTitle: String(formData.get("seoTitle") ?? ""),
    seoDescription: String(formData.get("seoDescription") ?? ""),
  });
}

function publicationDate(status: "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED", value: string, current?: Date | null) {
  if (status === "DRAFT" || status === "ARCHIVED") return null;
  if (status === "PUBLISHED") {
    if (!value) return current && current <= new Date() ? current : new Date();
    const date = parseAppDateTime(value);
    if (!date) throw new Error("Invalid publish date or time for APP_TIMEZONE.");
    if (date > new Date()) throw new Error("Use Scheduled status for a future publish date.");
    return date;
  }
  if (!value) throw new Error("Scheduled posts require a publish date and time.");
  const scheduled = parseAppDateTime(value);
  if (!scheduled || scheduled <= new Date()) throw new Error("Scheduled publish time must be a valid future time in APP_TIMEZONE.");
  return scheduled;
}

function parseEditorJson(value: string) {
  if (!value) return null;
  try { const parsed = JSON.parse(value); return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : null; } catch { return null; }
}

export async function createPost(formData: FormData) {
  const user = await requireAdmin();
  const parsed = parsePostForm(formData);
  const id = randomUUID();
  const now = new Date();
  const cleanContent = sanitizePostHtml(parsed.content);
  await db.insert(posts).values({
    id, title: parsed.title, slug: parsed.slug, excerpt: parsed.excerpt, content: cleanContent, contentJson: parseEditorJson(parsed.contentJson), contentFormat: "HTML",
    status: parsed.status, contentType: parsed.contentType, seriesId: parsed.seriesId || null, seriesOrder: parsed.seriesOrder, coverImage: parsed.coverImage || null, youtubeUrl: parsed.youtubeUrl || null, legacyTags: parsed.tags, seoTitle: parsed.seoTitle || null, seoDescription: parsed.seoDescription || null,
    readingMinutes: estimateReadingMinutes(cleanContent), publishedAt: publicationDate(parsed.status, parsed.publishedAt), createdAt: now, updatedAt: now,
  });
  await syncPostTaxonomy(id, parsed.categories, parsed.tags);
  await writeAudit({ userId: user.id, action: "CREATE", entity: "post", entityId: id, metadata: { title: parsed.title, status: parsed.status } });
  updateTag(CACHE_TAGS.posts); updateTag(CACHE_TAGS.search); scheduleAiReindex();
  revalidatePath("/"); revalidatePath("/blog"); revalidatePath("/feed.xml");
  redirect(`/admin/posts/${id}?notice=post-created`);
}

export async function updatePost(id: string, formData: FormData) {
  const user = await requireAdmin();
  const parsed = parsePostForm(formData);
  const [current] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  if (!current) throw new Error("Post not found");
  const cleanContent = sanitizePostHtml(parsed.content);
  await db.insert(postRevisions).values({ id: randomUUID(), postId: id, title: current.title, excerpt: current.excerpt, content: current.content, contentJson: current.contentJson, metadata: { slug: current.slug, status: current.status, publishedAt: current.publishedAt?.toISOString() ?? null }, createdBy: user.id, createdAt: new Date() });
  if (current.slug !== parsed.slug) {
    const [existingRedirect] = await db.select().from(slugRedirects).where(and(eq(slugRedirects.entityType, "POST"), eq(slugRedirects.fromSlug, current.slug))).limit(1);
    if (existingRedirect) await db.update(slugRedirects).set({ toSlug: parsed.slug }).where(eq(slugRedirects.id, existingRedirect.id));
    else await db.insert(slugRedirects).values({ id: randomUUID(), entityType: "POST", fromSlug: current.slug, toSlug: parsed.slug, createdAt: new Date() });
  }
  await db.update(posts).set({
    title: parsed.title, slug: parsed.slug, excerpt: parsed.excerpt, content: cleanContent, contentJson: parseEditorJson(parsed.contentJson), contentFormat: "HTML",
    status: parsed.status, contentType: parsed.contentType, seriesId: parsed.seriesId || null, seriesOrder: parsed.seriesOrder, coverImage: parsed.coverImage || null, youtubeUrl: parsed.youtubeUrl || null, legacyTags: parsed.tags, seoTitle: parsed.seoTitle || null, seoDescription: parsed.seoDescription || null,
    readingMinutes: estimateReadingMinutes(cleanContent), publishedAt: publicationDate(parsed.status, parsed.publishedAt, current.publishedAt), updatedAt: new Date(),
  }).where(eq(posts.id, id));
  await syncPostTaxonomy(id, parsed.categories, parsed.tags);
  await writeAudit({ userId: user.id, action: "UPDATE", entity: "post", entityId: id, metadata: { title: parsed.title, status: parsed.status } });
  updateTag(CACHE_TAGS.posts); updateTag(CACHE_TAGS.search); scheduleAiReindex();
  revalidatePath("/"); revalidatePath("/blog"); revalidatePath("/feed.xml"); revalidatePath(`/blog/${current.slug}`); revalidatePath(`/blog/${parsed.slug}`);
  redirect(`/admin/posts/${id}?notice=post-updated`);
}

export async function deletePost(id: string) {
  const user = await requireAdmin();
  await db.delete(posts).where(eq(posts.id, id));
  await writeAudit({ userId: user.id, action: "DELETE", entity: "post", entityId: id });
  updateTag(CACHE_TAGS.posts); updateTag(CACHE_TAGS.search); scheduleAiReindex();
  revalidatePath("/"); revalidatePath("/blog"); revalidatePath("/feed.xml");
  redirect("/admin/posts?notice=post-deleted");
}

function parseMetrics(value: FormDataEntryValue | null) {
  return String(value ?? "").split("\n").map((line) => line.trim()).filter(Boolean).map((line) => {
    const index = line.indexOf(":");
    if (index < 0) return { label: "Metric", value: line };
    return { label: line.slice(0, index).trim(), value: line.slice(index + 1).trim() };
  });
}

function parseProjectDiagrams(value: FormDataEntryValue | null) {
  return String(value ?? "").split(/\n\s*---\s*\n/).map((block) => block.trim()).filter(Boolean).map((block) => {
    const [title, ...lines] = block.split("\n"); return { title: title.trim() || "Architecture diagram", mermaid: lines.join("\n").trim() };
  }).filter((item) => item.mermaid);
}

function parseProjectCodeSamples(value: FormDataEntryValue | null) {
  return String(value ?? "").split(/\n\s*---\s*\n/).map((block) => block.trim()).filter(Boolean).map((block) => {
    const lines = block.split("\n"); const title = (lines.shift() || "Code sample").trim(); const language = (lines.shift() || "text").replace(/^language:\s*/i, "").trim(); return { title, language, code: lines.join("\n").trim() };
  }).filter((item) => item.code);
}

export async function createProject(formData: FormData) {
  const user = await requireAdmin();
  const title = String(formData.get("title") ?? "");
  const parsed = projectSchema.parse({
    title,
    slug: String(formData.get("slug") || slugify(title)),
    kind: String(formData.get("kind") ?? ""),
    lifecycleStatus: String(formData.get("lifecycleStatus") ?? "ACTIVE_DEVELOPMENT"),
    summary: String(formData.get("summary") ?? ""),
    problem: String(formData.get("problem") ?? ""),
    constraints: String(formData.get("constraints") ?? ""),
    challenge: String(formData.get("challenge") ?? ""),
    solution: String(formData.get("solution") ?? ""),
    architecture: String(formData.get("architecture") ?? ""),
    decisions: String(formData.get("decisions") ?? ""),
    tradeoffs: String(formData.get("tradeoffs") ?? ""),
    implementation: String(formData.get("implementation") ?? ""),
    reliabilitySecurity: String(formData.get("reliabilitySecurity") ?? ""),
    impact: String(formData.get("impact") ?? ""),
    lessonsLearned: String(formData.get("lessonsLearned") ?? ""),
    whatDifferently: String(formData.get("whatDifferently") ?? ""),
    confidentialityNote: String(formData.get("confidentialityNote") ?? ""),
    diagrams: parseProjectDiagrams(formData.get("diagrams")),
    codeSamples: parseProjectCodeSamples(formData.get("codeSamples")),
    techStack: parseCommaList(formData.get("techStack")),
    metrics: parseMetrics(formData.get("metrics")),
    featured: formData.get("featured") === "on",
    status: formData.get("status") === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
    externalUrl: String(formData.get("externalUrl") ?? ""),
    repoUrl: String(formData.get("repoUrl") ?? ""),
  });
  const id = randomUUID(); const now = new Date();
  await db.insert(projects).values({ ...parsed, id, externalUrl: parsed.externalUrl || null, repoUrl: parsed.repoUrl || null, sortOrder: Number(formData.get("sortOrder") ?? 0), createdAt: now, updatedAt: now });
  await writeAudit({ userId: user.id, action: "CREATE", entity: "project", entityId: id, metadata: { title } });
  updateTag(CACHE_TAGS.projects); updateTag(CACHE_TAGS.search); scheduleAiReindex();
  revalidatePath("/"); redirect(`/admin/projects/${id}?notice=project-created`);
}

export async function updateProject(id: string, formData: FormData) {
  const user = await requireAdmin();
  const [current] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  if (!current) throw new Error("Project not found");
  const title = String(formData.get("title") ?? "");
  const parsed = projectSchema.parse({
    title,
    slug: String(formData.get("slug") || slugify(title)),
    kind: String(formData.get("kind") ?? ""),
    lifecycleStatus: String(formData.get("lifecycleStatus") ?? "ACTIVE_DEVELOPMENT"),
    summary: String(formData.get("summary") ?? ""),
    problem: String(formData.get("problem") ?? ""),
    constraints: String(formData.get("constraints") ?? ""),
    challenge: String(formData.get("challenge") ?? ""),
    solution: String(formData.get("solution") ?? ""),
    architecture: String(formData.get("architecture") ?? ""),
    decisions: String(formData.get("decisions") ?? ""),
    tradeoffs: String(formData.get("tradeoffs") ?? ""),
    implementation: String(formData.get("implementation") ?? ""),
    reliabilitySecurity: String(formData.get("reliabilitySecurity") ?? ""),
    impact: String(formData.get("impact") ?? ""),
    lessonsLearned: String(formData.get("lessonsLearned") ?? ""),
    whatDifferently: String(formData.get("whatDifferently") ?? ""),
    confidentialityNote: String(formData.get("confidentialityNote") ?? ""),
    diagrams: parseProjectDiagrams(formData.get("diagrams")),
    codeSamples: parseProjectCodeSamples(formData.get("codeSamples")),
    techStack: parseCommaList(formData.get("techStack")),
    metrics: parseMetrics(formData.get("metrics")),
    featured: formData.get("featured") === "on",
    status: formData.get("status") === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
    externalUrl: String(formData.get("externalUrl") ?? ""),
    repoUrl: String(formData.get("repoUrl") ?? ""),
  });
  await db.insert(projectRevisions).values({ id: randomUUID(), projectId: id, snapshot: current as unknown as Record<string, unknown>, createdBy: user.id, createdAt: new Date() });
  if (current.slug !== parsed.slug) { const [mapped] = await db.select().from(slugRedirects).where(and(eq(slugRedirects.entityType,"PROJECT"), eq(slugRedirects.fromSlug,current.slug))).limit(1); if (mapped) await db.update(slugRedirects).set({toSlug:parsed.slug}).where(eq(slugRedirects.id,mapped.id)); else await db.insert(slugRedirects).values({id:randomUUID(),entityType:"PROJECT",fromSlug:current.slug,toSlug:parsed.slug,createdAt:new Date()}); }
  await db.update(projects).set({ ...parsed, externalUrl: parsed.externalUrl || null, repoUrl: parsed.repoUrl || null, sortOrder: Number(formData.get("sortOrder") ?? 0), updatedAt: new Date() }).where(eq(projects.id, id));
  await writeAudit({ userId: user.id, action: "UPDATE", entity: "project", entityId: id, metadata: { title } });
  updateTag(CACHE_TAGS.projects); updateTag(CACHE_TAGS.search); scheduleAiReindex();
  revalidatePath("/"); revalidatePath(`/work/${parsed.slug}`);
  redirect(`/admin/projects/${id}?notice=project-updated`);
}


export async function generateProjectPreviewToken(id: string) {
  const user = await requireAdmin(); const token = randomBytes(32).toString("base64url"); const tokenHash = createHash("sha256").update(token).digest("hex"); const now = new Date();
  await db.insert(previewTokens).values({ id: randomUUID(), entityType: "PROJECT", entityId: id, tokenHash, expiresAt: new Date(now.getTime() + 72 * 60 * 60 * 1000), createdBy: user.id, createdAt: now });
  await writeAudit({ userId:user.id, action:"PREVIEW_LINK", entity:"project", entityId:id }); redirect(`/admin/projects/${id}?previewToken=${encodeURIComponent(token)}`);
}

export async function restoreProjectRevision(projectId: string, revisionId: string) {
  const user = await requireAdmin(); const [revision] = await db.select().from(projectRevisions).where(and(eq(projectRevisions.id, revisionId), eq(projectRevisions.projectId, projectId))).limit(1); if (!revision) throw new Error("Project revision not found");
  const snapshot = revision.snapshot as Record<string, unknown>;
  const allowed = ["title","slug","kind","lifecycleStatus","summary","problem","constraints","challenge","solution","architecture","decisions","tradeoffs","implementation","reliabilitySecurity","impact","lessonsLearned","whatDifferently","confidentialityNote","diagrams","codeSamples","techStack","metrics","featured","status","externalUrl","repoUrl","sortOrder"] as const;
  const values = Object.fromEntries(allowed.filter((key) => key in snapshot).map((key) => [key, snapshot[key]])) as Partial<typeof projects.$inferInsert>;
  values.updatedAt = new Date();
  await db.update(projects).set(values).where(eq(projects.id, projectId)); await writeAudit({ userId:user.id, action:"RESTORE", entity:"project_revision", entityId:revisionId, metadata:{projectId} }); updateTag(CACHE_TAGS.projects); revalidatePath(`/admin/projects/${projectId}`); redirect(`/admin/projects/${projectId}?notice=revision-restored`);
}

export async function deleteProject(id: string) {
  const user = await requireAdmin();
  await db.delete(projects).where(eq(projects.id, id));
  await writeAudit({ userId: user.id, action: "DELETE", entity: "project", entityId: id });
  updateTag(CACHE_TAGS.projects); updateTag(CACHE_TAGS.search); scheduleAiReindex();
  revalidatePath("/"); redirect("/admin/projects?notice=project-deleted");
}

export async function createExperience(formData: FormData) {
  const user = await requireAdmin(); const id = randomUUID(); const now = new Date();
  await db.insert(experiences).values({
    id,
    company: String(formData.get("company") ?? ""),
    role: String(formData.get("role") ?? ""),
    location: String(formData.get("location") ?? ""),
    startDate: String(formData.get("startDate") ?? ""),
    endDate: String(formData.get("endDate") ?? "") || null,
    current: formData.get("current") === "on",
    summary: String(formData.get("summary") ?? ""),
    highlights: String(formData.get("highlights") ?? "").split("\n").map((x) => x.trim()).filter(Boolean),
    impactAreas: parseCommaList(formData.get("impactAreas")),
    sortOrder: Number(formData.get("sortOrder") ?? 0), createdAt: now, updatedAt: now,
  });
  await writeAudit({ userId: user.id, action: "CREATE", entity: "experience", entityId: id });
  updateTag(CACHE_TAGS.experiences); scheduleAiReindex();
  revalidatePath("/"); revalidatePath("/admin/experience");
  redirect("/admin/experience?notice=experience-created");
}

export async function updateExperience(id: string, formData: FormData) {
  const user = await requireAdmin();
  await db.update(experiences).set({
    company: String(formData.get("company") ?? ""), role: String(formData.get("role") ?? ""), location: String(formData.get("location") ?? ""),
    startDate: String(formData.get("startDate") ?? ""), endDate: String(formData.get("endDate") ?? "") || null, current: formData.get("current") === "on",
    summary: String(formData.get("summary") ?? ""), highlights: String(formData.get("highlights") ?? "").split("\n").map((x) => x.trim()).filter(Boolean),
    impactAreas: parseCommaList(formData.get("impactAreas")),
    sortOrder: Number(formData.get("sortOrder") ?? 0), updatedAt: new Date(),
  }).where(eq(experiences.id, id));
  await writeAudit({ userId: user.id, action: "UPDATE", entity: "experience", entityId: id });
  updateTag(CACHE_TAGS.experiences); scheduleAiReindex();
  revalidatePath("/"); revalidatePath("/admin/experience");
  redirect("/admin/experience?notice=experience-updated");
}

export async function deleteExperience(id: string) {
  const user = await requireAdmin();
  await db.delete(experiences).where(eq(experiences.id, id));
  await writeAudit({ userId: user.id, action: "DELETE", entity: "experience", entityId: id });
  updateTag(CACHE_TAGS.experiences); scheduleAiReindex();
  revalidatePath("/"); revalidatePath("/admin/experience");
  redirect("/admin/experience?notice=experience-deleted");
}


function parseContentData(formData: FormData) {
  const raw = String(formData.get("data") ?? "").trim();
  if (!raw) return {};
  try { const value = JSON.parse(raw); return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}; }
  catch { throw new Error("Content metadata must be valid JSON."); }
}


export async function reindexAiKnowledge() {
  const user = await requireAdmin();
  const result = await reindexPublicPortfolio();
  await supersedePendingAiIndexJobs();
  await writeAudit({ userId: user.id, action: "REINDEX", entity: "ai_knowledge", metadata: result });
  revalidatePath("/admin/ai");
  redirect(`/admin/ai?notice=ai-reindexed&documents=${result.documents}&chunks=${result.chunks}`);
}

export async function queueAiKnowledgeReindex() {
  const user = await requireAdmin();
  const result = await queuePublicPortfolioReindex({ priority: 100 });
  await writeAudit({ userId: user.id, action: "QUEUE_REINDEX", entity: "ai_knowledge", entityId: result.jobId, metadata: result });
  revalidatePath("/admin/ai");
  redirect("/admin/ai?notice=ai-index-queued");
}

export async function retryAiKnowledgeIndexJobs() {
  const user = await requireAdmin();
  await retryFailedAiIndexJobs();
  await writeAudit({ userId: user.id, action: "RETRY", entity: "ai_index_jobs" });
  revalidatePath("/admin/ai");
  redirect("/admin/ai?notice=ai-index-retry");
}

export async function createSeries(formData: FormData) {
  const user = await requireAdmin(); const title = String(formData.get("title") ?? "").trim(); if (title.length < 3) throw new Error("Series title is too short"); const id = randomUUID(); const now = new Date();
  await db.insert(postSeries).values({ id, title, slug: slugify(String(formData.get("slug") || title)), description: String(formData.get("description") ?? "") || null, coverImage: String(formData.get("coverImage") ?? "") || null, status: formData.get("status") === "PUBLISHED" ? "PUBLISHED" : "DRAFT", createdAt: now, updatedAt: now });
  await writeAudit({ userId: user.id, action: "CREATE", entity: "post_series", entityId: id, metadata: { title } }); updateTag(CACHE_TAGS.posts); revalidatePath("/admin/series"); revalidatePath("/blog"); redirect(`/admin/series/${id}?notice=series-created`);
}


export async function updateSeries(id: string, formData: FormData) {
  const user = await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  if (title.length < 3) throw new Error("Series title is too short");
  await db.update(postSeries).set({
    title,
    slug: slugify(String(formData.get("slug") || title)),
    description: String(formData.get("description") ?? "") || null,
    coverImage: String(formData.get("coverImage") ?? "") || null,
    status: formData.get("status") === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
    updatedAt: new Date(),
  }).where(eq(postSeries.id, id));
  await writeAudit({ userId: user.id, action: "UPDATE", entity: "post_series", entityId: id, metadata: { title } });
  updateTag(CACHE_TAGS.posts);
  revalidatePath("/admin/series"); revalidatePath("/blog"); revalidatePath("/series", "layout");
  redirect(`/admin/series/${id}?notice=series-updated`);
}

export async function deleteSeries(id: string) {
  const user = await requireAdmin(); await db.update(posts).set({ seriesId: null, seriesOrder: 0 }).where(eq(posts.seriesId, id)); await db.delete(postSeries).where(eq(postSeries.id, id)); await writeAudit({ userId: user.id, action: "DELETE", entity: "post_series", entityId: id }); updateTag(CACHE_TAGS.posts); revalidatePath("/admin/series"); redirect("/admin/series?notice=series-deleted");
}

export async function createContentEntry(formData: FormData) {
  const user = await requireAdmin();
  const title = String(formData.get("title") ?? "");
  const parsed = contentEntrySchema.parse({
    type: String(formData.get("type") ?? "ENGINEERING_NOTE"), title, slug: String(formData.get("slug") || slugify(title)),
    summary: String(formData.get("summary") ?? ""), content: String(formData.get("content") ?? ""), data: parseContentData(formData),
    status: String(formData.get("status") ?? "DRAFT"), featured: formData.get("featured") === "on", sortOrder: Number(formData.get("sortOrder") ?? 0),
  });
  const id = randomUUID(); const now = new Date();
  await db.insert(contentEntries).values({ id, ...parsed, content: sanitizePostHtml(parsed.content || ""), summary: parsed.summary || null, publishedAt: parsed.status === "PUBLISHED" ? now : null, createdAt: now, updatedAt: now });
  await writeAudit({ userId: user.id, action: "CREATE", entity: "content_entry", entityId: id, metadata: { type: parsed.type, title: parsed.title } });
  updateTag(CACHE_TAGS.content); updateTag(CACHE_TAGS.search); updateTag(CACHE_TAGS.aiIndex); scheduleAiReindex();
  revalidatePath("/", "layout"); revalidatePath("/admin/content");
  redirect(`/admin/content/${id}?notice=content-created`);
}

export async function updateContentEntry(id: string, formData: FormData) {
  const user = await requireAdmin(); const title = String(formData.get("title") ?? "");
  const parsed = contentEntrySchema.parse({
    type: String(formData.get("type") ?? "ENGINEERING_NOTE"), title, slug: String(formData.get("slug") || slugify(title)), summary: String(formData.get("summary") ?? ""),
    content: String(formData.get("content") ?? ""), data: parseContentData(formData), status: String(formData.get("status") ?? "DRAFT"), featured: formData.get("featured") === "on", sortOrder: Number(formData.get("sortOrder") ?? 0),
  });
  const [current] = await db.select().from(contentEntries).where(eq(contentEntries.id, id)).limit(1); if (!current) throw new Error("Content entry not found");
  await db.update(contentEntries).set({ ...parsed, content: sanitizePostHtml(parsed.content || ""), summary: parsed.summary || null, publishedAt: parsed.status === "PUBLISHED" ? (current.publishedAt || new Date()) : null, updatedAt: new Date() }).where(eq(contentEntries.id, id));
  await writeAudit({ userId: user.id, action: "UPDATE", entity: "content_entry", entityId: id, metadata: { type: parsed.type, title: parsed.title } });
  updateTag(CACHE_TAGS.content); updateTag(CACHE_TAGS.search); updateTag(CACHE_TAGS.aiIndex); scheduleAiReindex(); revalidatePath("/", "layout"); revalidatePath("/admin/content");
  redirect(`/admin/content/${id}?notice=content-updated`);
}

export async function deleteContentEntry(id: string) {
  const user = await requireAdmin(); await db.delete(contentEntries).where(eq(contentEntries.id, id)); await writeAudit({ userId: user.id, action: "DELETE", entity: "content_entry", entityId: id });
  updateTag(CACHE_TAGS.content); updateTag(CACHE_TAGS.search); updateTag(CACHE_TAGS.aiIndex); scheduleAiReindex(); revalidatePath("/", "layout"); redirect("/admin/content?notice=content-deleted");
}

export async function generatePostPreviewToken(id: string) {
  const user = await requireAdmin(); const token = randomBytes(32).toString("base64url"); const tokenHash = createHash("sha256").update(token).digest("hex"); const now = new Date();
  await db.insert(previewTokens).values({ id: randomUUID(), entityType: "POST", entityId: id, tokenHash, expiresAt: new Date(now.getTime() + 72 * 60 * 60 * 1000), createdBy: user.id, createdAt: now });
  await writeAudit({ userId: user.id, action: "PREVIEW_LINK", entity: "post", entityId: id });
  redirect(`/admin/posts/${id}?previewToken=${encodeURIComponent(token)}`);
}

export async function restorePostRevision(postId: string, revisionId: string) {
  const user = await requireAdmin(); const [revision] = await db.select().from(postRevisions).where(and(eq(postRevisions.id, revisionId), eq(postRevisions.postId, postId))).limit(1); if (!revision) throw new Error("Revision not found");
  await db.update(posts).set({ title: revision.title, excerpt: revision.excerpt, content: revision.content, contentJson: revision.contentJson, updatedAt: new Date() }).where(eq(posts.id, postId));
  await writeAudit({ userId: user.id, action: "RESTORE", entity: "post_revision", entityId: revisionId, metadata: { postId } }); updateTag(CACHE_TAGS.posts); revalidatePath(`/admin/posts/${postId}`); redirect(`/admin/posts/${postId}?notice=revision-restored`);
}

export async function updateContactCrm(id: string, formData: FormData) {
  const user = await requireAdmin(); const allowed = ["NEW","REPLIED","OPPORTUNITY","RECRUITER","COLLABORATION","SPAM","CLOSED"] as const; const raw = String(formData.get("status") ?? "NEW");
  const status = allowed.includes(raw as typeof allowed[number]) ? raw as typeof allowed[number] : "NEW";
  await db.update(contactMessages).set({ status, internalNotes: String(formData.get("internalNotes") ?? "") || null, readAt: new Date(), updatedAt: new Date() }).where(eq(contactMessages.id, id));
  await writeAudit({ userId: user.id, action: "CRM_UPDATE", entity: "contact_message", entityId: id, metadata: { status } }); revalidatePath("/admin/messages"); redirect("/admin/messages?notice=message-updated");
}

export async function saveAvailabilitySettings(formData: FormData) {
  const user = await requireAdmin(); const key = "availability"; const [existing] = await db.select().from(siteSettings).where(eq(siteSettings.key, key)).limit(1);
  const value = { visible: formData.get("visible") === "on", status: String(formData.get("availabilityStatus") ?? "Open to the right opportunity"), targetRoles: parseCommaList(formData.get("targetRoles")), workModes: parseCommaList(formData.get("workModes")), relocation: String(formData.get("relocation") ?? ""), note: String(formData.get("availabilityNote") ?? "") };
  if (existing) await db.update(siteSettings).set({ value, updatedAt: new Date() }).where(eq(siteSettings.id, existing.id)); else await db.insert(siteSettings).values({ id: randomUUID(), key, value, updatedAt: new Date() });
  await writeAudit({ userId: user.id, action: "UPDATE", entity: "site_settings", entityId: existing?.id ?? null, metadata: { key } }); revalidatePath("/hire"); revalidatePath("/admin/hire"); redirect("/admin/hire?notice=availability-updated");
}

export async function createResumeVariant(formData: FormData) {
  const user = await requireAdmin(); const name = String(formData.get("name") ?? "").trim(); const id = randomUUID(); const now = new Date();
  const isDefault = formData.get("isDefault") === "on";
  if (isDefault) await db.update(resumeVariants).set({ isDefault: false }).where(eq(resumeVariants.isDefault, true));
  await db.insert(resumeVariants).values({ id, name, slug: slugify(String(formData.get("slug") || name)), targetRole: String(formData.get("targetRole") ?? ""), summary: String(formData.get("summary") ?? "") || null, fileUrl: String(formData.get("fileUrl") ?? ""), isDefault, status: formData.get("status") === "PUBLISHED" ? "PUBLISHED" : "DRAFT", sortOrder: Number(formData.get("sortOrder") ?? 0), createdAt: now, updatedAt: now });
  await writeAudit({ userId: user.id, action: "CREATE", entity: "resume_variant", entityId: id, metadata: { name } }); updateTag(CACHE_TAGS.resumes); revalidatePath("/hire"); revalidatePath("/admin/hire"); redirect(`/admin/hire/resumes/${id}?notice=resume-created`);
}


export async function updateResumeVariant(id: string, formData: FormData) {
  const user = await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Résumé name is required");
  const isDefault = formData.get("isDefault") === "on";
  if (isDefault) await db.update(resumeVariants).set({ isDefault: false }).where(eq(resumeVariants.isDefault, true));
  await db.update(resumeVariants).set({
    name,
    slug: slugify(String(formData.get("slug") || name)),
    targetRole: String(formData.get("targetRole") ?? ""),
    summary: String(formData.get("summary") ?? "") || null,
    fileUrl: String(formData.get("fileUrl") ?? ""),
    isDefault,
    status: formData.get("status") === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
    sortOrder: Number(formData.get("sortOrder") ?? 0),
    updatedAt: new Date(),
  }).where(eq(resumeVariants.id, id));
  await writeAudit({ userId: user.id, action: "UPDATE", entity: "resume_variant", entityId: id, metadata: { name } });
  updateTag(CACHE_TAGS.resumes); revalidatePath("/hire"); revalidatePath("/admin/hire");
  redirect(`/admin/hire/resumes/${id}?notice=resume-updated`);
}

export async function deleteResumeVariant(id: string) { const user = await requireAdmin(); await db.delete(resumeVariants).where(eq(resumeVariants.id, id)); await writeAudit({ userId:user.id, action:"DELETE", entity:"resume_variant", entityId:id }); updateTag(CACHE_TAGS.resumes); revalidatePath("/hire"); redirect("/admin/hire?notice=resume-deleted"); }

export async function updateProfile(formData: FormData) {
  const user = await requireAdmin();
  const [existing] = await db.select().from(siteSettings).where(eq(siteSettings.key, "profile")).limit(1);
  const current = { ...defaultProfile, ...((existing?.value ?? {}) as Record<string, unknown>) } as typeof defaultProfile;

  const metrics = String(formData.get("metrics") ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 8)
    .map((line) => {
      const [value, ...labelParts] = line.split("|");
      return { value: value.trim(), label: labelParts.join("|").trim() || "Impact" };
    });

  const specialties = current.specialties.map((item, index) => ({
    title: String(formData.get(`specialty_${index}_title`) ?? item.title).trim() || item.title,
    description: String(formData.get(`specialty_${index}_description`) ?? item.description).trim() || item.description,
    tags: parseCommaList(formData.get(`specialty_${index}_tags`)).slice(0, 12),
  }));

  const about = String(formData.get("about") ?? "")
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .slice(0, 8);

  const value = {
    ...current,
    siteName: String(formData.get("siteName") ?? defaultProfile.siteName).trim(),
    name: String(formData.get("name") ?? defaultProfile.name).trim(),
    displayName: String(formData.get("displayName") ?? defaultProfile.displayName).trim(),
    domain: String(formData.get("domain") ?? defaultProfile.domain).trim(),
    eyebrow: String(formData.get("eyebrow") ?? defaultProfile.eyebrow).trim(),
    headline: String(formData.get("headline") ?? defaultProfile.headline).trim(),
    intro: String(formData.get("intro") ?? defaultProfile.intro).trim(),
    currentFocus: String(formData.get("currentFocus") ?? defaultProfile.currentFocus).trim(),
    portrait: String(formData.get("portrait") ?? defaultProfile.portrait).trim(),
    resume: String(formData.get("resume") ?? defaultProfile.resume).trim(),
    metrics: metrics.length ? metrics : current.metrics,
    specialties,
    about: about.length ? about : current.about,
    stack: parseCommaList(formData.get("stack")).slice(0, 40),
    education: {
      degree: String(formData.get("educationDegree") ?? current.education.degree).trim(),
      school: String(formData.get("educationSchool") ?? current.education.school).trim(),
      year: String(formData.get("educationYear") ?? current.education.year).trim(),
      certification: String(formData.get("educationCertification") ?? current.education.certification).trim(),
    },
    email: String(formData.get("email") ?? defaultProfile.email).trim().toLowerCase(),
    phone: String(formData.get("phone") ?? defaultProfile.phone).trim(),
    location: String(formData.get("location") ?? defaultProfile.location).trim(),
    linkedin: String(formData.get("linkedin") ?? defaultProfile.linkedin).trim(),
    github: String(formData.get("github") ?? defaultProfile.github).trim(),
    contactIntro: String(formData.get("contactIntro") ?? current.contactIntro).trim(),
  };

  if (existing) {
    await db.update(siteSettings).set({ value, updatedAt: new Date() }).where(eq(siteSettings.id, existing.id));
  } else {
    await db.insert(siteSettings).values({ id: randomUUID(), key: "profile", value, updatedAt: new Date() });
  }

  await writeAudit({
    userId: user.id,
    action: "UPDATE",
    entity: "site_settings",
    entityId: existing?.id ?? null,
    metadata: { key: "profile" },
  });
  updateTag(CACHE_TAGS.profile); scheduleAiReindex();
  revalidatePath("/", "layout");
  revalidatePath("/admin/profile");
  redirect("/admin/profile?notice=profile-updated");
}

export async function markMessageRead(id: string) {
  const user = await requireAdmin();
  await db.update(contactMessages).set({ readAt: new Date() }).where(eq(contactMessages.id, id));
  await writeAudit({ userId: user.id, action: "READ", entity: "contact_message", entityId: id });
  revalidatePath("/admin/messages");
  redirect("/admin/messages?notice=message-read");
}
