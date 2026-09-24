"use server";

import { createHash, randomBytes, randomUUID } from "crypto";
import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { auth, signOut } from "@/auth";
import { db } from "@/db";
import { askStarterPrompts, availabilityProfiles, availabilityTargetRoles, availabilityWorkModes, contactMessages, contentEntries, educationEntries, experienceHighlights, experienceImpactAreas, experiences, focusAreas, focusAreaTags, navigationItems, pageSectionActions, pageSectionItems, pageSections, postRevisions, postSeries, posts, previewTokens, profileAboutParagraphs, projectMetrics, projectRevisions, projects, projectTechnologies, resumeVariants, sitePages, siteProfiles, skillGroups, skillItems, slugRedirects } from "@/db/schema";
import { writeAudit } from "@/lib/audit";
import { sanitizePostHtml } from "@/lib/content";
import { estimateReadingMinutes, parseCommaList, parseJsonList, slugify } from "@/lib/utils";
import { contentEntrySchema, postSchema, projectSchema } from "@/lib/validation";
import { syncPostTaxonomy } from "@/lib/taxonomy";
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
    status: parsed.status, contentType: parsed.contentType, seriesId: parsed.seriesId || null, seriesOrder: parsed.seriesOrder, coverImage: parsed.coverImage || null, youtubeUrl: parsed.youtubeUrl || null, seoTitle: parsed.seoTitle || null, seoDescription: parsed.seoDescription || null,
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
    status: parsed.status, contentType: parsed.contentType, seriesId: parsed.seriesId || null, seriesOrder: parsed.seriesOrder, coverImage: parsed.coverImage || null, youtubeUrl: parsed.youtubeUrl || null, seoTitle: parsed.seoTitle || null, seoDescription: parsed.seoDescription || null,
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

async function syncProjectDetails(projectId: string, techStack: string[], metrics: Array<{ label: string; value: string }>) {
  await db.delete(projectTechnologies).where(eq(projectTechnologies.projectId, projectId));
  await db.delete(projectMetrics).where(eq(projectMetrics.projectId, projectId));
  if (techStack.length) await db.insert(projectTechnologies).values(techStack.map((label, index) => ({ id: randomUUID(), projectId, label, sortOrder: 100 - index * 10 })));
  if (metrics.length) await db.insert(projectMetrics).values(metrics.map((metric, index) => ({ id: randomUUID(), projectId, label: metric.label, value: metric.value, sortOrder: 100 - index * 10 })));
}

async function syncExperienceDetails(experienceId: string, highlights: string[], impactAreas: string[]) {
  await db.delete(experienceHighlights).where(eq(experienceHighlights.experienceId, experienceId));
  await db.delete(experienceImpactAreas).where(eq(experienceImpactAreas.experienceId, experienceId));
  if (highlights.length) await db.insert(experienceHighlights).values(highlights.map((body, index) => ({ id: randomUUID(), experienceId, body, sortOrder: 100 - index * 10 })));
  if (impactAreas.length) await db.insert(experienceImpactAreas).values(impactAreas.map((label, index) => ({ id: randomUUID(), experienceId, label, sortOrder: 100 - index * 10 })));
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
  const { techStack, metrics, ...projectFields } = parsed;
  await db.insert(projects).values({ ...projectFields, id, externalUrl: projectFields.externalUrl || null, repoUrl: projectFields.repoUrl || null, sortOrder: Number(formData.get("sortOrder") ?? 0), createdAt: now, updatedAt: now });
  await syncProjectDetails(id, techStack, metrics);
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
  const [currentTech, currentMetrics] = await Promise.all([
    db.select().from(projectTechnologies).where(eq(projectTechnologies.projectId, id)).orderBy(desc(projectTechnologies.sortOrder)),
    db.select().from(projectMetrics).where(eq(projectMetrics.projectId, id)).orderBy(desc(projectMetrics.sortOrder)),
  ]);
  await db.insert(projectRevisions).values({ id: randomUUID(), projectId: id, snapshot: { ...current, techStack: currentTech.map((item) => item.label), metrics: currentMetrics.map((item) => ({ label: item.label, value: item.value })) }, createdBy: user.id, createdAt: new Date() });
  if (current.slug !== parsed.slug) { const [mapped] = await db.select().from(slugRedirects).where(and(eq(slugRedirects.entityType,"PROJECT"), eq(slugRedirects.fromSlug,current.slug))).limit(1); if (mapped) await db.update(slugRedirects).set({toSlug:parsed.slug}).where(eq(slugRedirects.id,mapped.id)); else await db.insert(slugRedirects).values({id:randomUUID(),entityType:"PROJECT",fromSlug:current.slug,toSlug:parsed.slug,createdAt:new Date()}); }
  const { techStack, metrics, ...projectFields } = parsed;
  await db.update(projects).set({ ...projectFields, externalUrl: projectFields.externalUrl || null, repoUrl: projectFields.repoUrl || null, sortOrder: Number(formData.get("sortOrder") ?? 0), updatedAt: new Date() }).where(eq(projects.id, id));
  await syncProjectDetails(id, techStack, metrics);
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
  const allowed = ["title","slug","kind","lifecycleStatus","summary","problem","constraints","challenge","solution","architecture","decisions","tradeoffs","implementation","reliabilitySecurity","impact","lessonsLearned","whatDifferently","confidentialityNote","diagrams","codeSamples","featured","status","externalUrl","repoUrl","sortOrder"] as const;
  const values = Object.fromEntries(allowed.filter((key) => key in snapshot).map((key) => [key, snapshot[key]])) as Partial<typeof projects.$inferInsert>;
  values.updatedAt = new Date();
  await db.update(projects).set(values).where(eq(projects.id, projectId));
  if (Array.isArray(snapshot.techStack) || Array.isArray(snapshot.metrics)) await syncProjectDetails(projectId, Array.isArray(snapshot.techStack) ? snapshot.techStack.map(String) : [], Array.isArray(snapshot.metrics) ? snapshot.metrics.filter((item): item is {label:string;value:string} => Boolean(item && typeof item === "object" && "label" in item && "value" in item)).map((item) => ({ label: String(item.label), value: String(item.value) })) : []);
  await writeAudit({ userId:user.id, action:"RESTORE", entity:"project_revision", entityId:revisionId, metadata:{projectId} }); updateTag(CACHE_TAGS.projects); revalidatePath(`/admin/projects/${projectId}`); redirect(`/admin/projects/${projectId}?notice=revision-restored`);
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
  const highlights = String(formData.get("highlights") ?? "").split("\n").map((x) => x.trim()).filter(Boolean);
  const impactAreas = parseCommaList(formData.get("impactAreas"));
  await db.insert(experiences).values({
    id, company: String(formData.get("company") ?? ""), role: String(formData.get("role") ?? ""), location: String(formData.get("location") ?? ""),
    startDate: String(formData.get("startDate") ?? ""), endDate: String(formData.get("endDate") ?? "") || null, current: formData.get("current") === "on",
    summary: String(formData.get("summary") ?? ""), sortOrder: Number(formData.get("sortOrder") ?? 0), createdAt: now, updatedAt: now,
  });
  await syncExperienceDetails(id, highlights, impactAreas);
  await writeAudit({ userId: user.id, action: "CREATE", entity: "experience", entityId: id });
  updateTag(CACHE_TAGS.experiences); scheduleAiReindex();
  revalidatePath("/"); revalidatePath("/admin/experience");
  redirect("/admin/experience?notice=experience-created");
}

export async function updateExperience(id: string, formData: FormData) {
  const user = await requireAdmin();
  const highlights = String(formData.get("highlights") ?? "").split("\n").map((x) => x.trim()).filter(Boolean);
  const impactAreas = parseCommaList(formData.get("impactAreas"));
  await db.update(experiences).set({
    company: String(formData.get("company") ?? ""), role: String(formData.get("role") ?? ""), location: String(formData.get("location") ?? ""),
    startDate: String(formData.get("startDate") ?? ""), endDate: String(formData.get("endDate") ?? "") || null, current: formData.get("current") === "on",
    summary: String(formData.get("summary") ?? ""), sortOrder: Number(formData.get("sortOrder") ?? 0), updatedAt: new Date(),
  }).where(eq(experiences.id, id));
  await syncExperienceDetails(id, highlights, impactAreas);
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
  const user = await requireAdmin();
  const now = new Date();
  const [existing] = await db.select().from(availabilityProfiles).limit(1);
  const id = existing?.id ?? "main";
  const targetRoles = parseCommaList(formData.get("targetRoles"));
  const workModes = parseCommaList(formData.get("workModes"));
  await db.transaction(async (tx) => {
    const values = { visible: formData.get("visible") === "on", status: String(formData.get("availabilityStatus") ?? "Open to the right opportunity").trim(), relocation: nullableText(formData.get("relocation")), note: nullableText(formData.get("availabilityNote")), updatedAt: now };
    if (existing) await tx.update(availabilityProfiles).set(values).where(eq(availabilityProfiles.id, id));
    else await tx.insert(availabilityProfiles).values({ id, ...values, createdAt: now });
    await tx.delete(availabilityTargetRoles).where(eq(availabilityTargetRoles.availabilityId, id));
    await tx.delete(availabilityWorkModes).where(eq(availabilityWorkModes.availabilityId, id));
    if (targetRoles.length) await tx.insert(availabilityTargetRoles).values(targetRoles.map((label, index) => ({ id: randomUUID(), availabilityId: id, label, sortOrder: 1000 - index * 10 })));
    if (workModes.length) await tx.insert(availabilityWorkModes).values(workModes.map((label, index) => ({ id: randomUUID(), availabilityId: id, label, sortOrder: 1000 - index * 10 })));
  });
  await writeAudit({ userId: user.id, action: "UPDATE", entity: "availability_profile", entityId: id });
  revalidatePath("/hire"); revalidatePath("/admin/hire"); redirect("/admin/hire?notice=availability-updated");
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
  const now = new Date();
  const [existing] = await db.select().from(siteProfiles).limit(1);
  const id = existing?.id ?? "main";
  const values = {
    siteName: String(formData.get("siteName") ?? "").trim(),
    name: String(formData.get("name") ?? "").trim(),
    displayName: String(formData.get("displayName") ?? "").trim(),
    location: String(formData.get("location") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    phone: String(formData.get("phone") ?? "").trim(),
    domain: String(formData.get("domain") ?? "").trim(),
    linkedin: String(formData.get("linkedin") ?? "").trim(),
    github: String(formData.get("github") ?? "").trim(),
    resume: String(formData.get("resume") ?? "").trim(),
    portrait: String(formData.get("portrait") ?? "").trim(),
    eyebrow: String(formData.get("eyebrow") ?? "").trim(),
    headline: String(formData.get("headline") ?? "").trim(),
    intro: String(formData.get("intro") ?? "").trim(),
    currentFocus: String(formData.get("currentFocus") ?? "").trim(),
    contactIntro: String(formData.get("contactIntro") ?? "").trim(),
    updatedAt: now,
  };
  if (!values.siteName || !values.name || !values.displayName || !values.headline || !values.intro) throw new Error("Complete the required profile fields.");
  if (existing) await db.update(siteProfiles).set(values).where(eq(siteProfiles.id, existing.id));
  else await db.insert(siteProfiles).values({ id, ...values, createdAt: now });
  await writeAudit({ userId: user.id, action: "UPDATE", entity: "site_profile", entityId: id });
  updateTag(CACHE_TAGS.profile); scheduleAiReindex();
  revalidatePath("/", "layout"); revalidatePath("/admin/profile");
  redirect("/admin/profile?notice=profile-updated");
}

export async function saveAboutCopy(formData: FormData) {
  const user = await requireAdmin();
  const now = new Date();
  const about = paragraphList(formData.get("about"), 20);
  const [profile] = await db.select({ id: siteProfiles.id }).from(siteProfiles).limit(1);
  if (!profile) throw new Error("Site profile not found");
  await db.transaction(async (tx) => {
    await tx.delete(profileAboutParagraphs).where(eq(profileAboutParagraphs.profileId, profile.id));
    if (about.length) await tx.insert(profileAboutParagraphs).values(about.map((body, index) => ({ id: randomUUID(), profileId: profile.id, body, sortOrder: 1000 - index * 10, createdAt: now, updatedAt: now })));
  });
  await portfolioContentChanged(user.id, "profile_about", profile.id);
  redirect("/admin/homepage?notice=about-updated");
}

export async function createFocusArea(formData: FormData) {
  const user = await requireAdmin();
  const id = randomUUID(); const now = new Date();
  const title = requiredText(formData.get("title"), "Focus area title is required.");
  await db.transaction(async (tx) => {
    await tx.insert(focusAreas).values({ id, title, description: requiredText(formData.get("description"), "Focus area description is required."), icon: String(formData.get("icon") ?? "blocks").trim() || "blocks", sortOrder: integerValue(formData.get("sortOrder")), createdAt: now, updatedAt: now });
    const tags = parseCommaList(formData.get("tags"));
    if (tags.length) await tx.insert(focusAreaTags).values(tags.map((label, index) => ({ id: randomUUID(), focusAreaId: id, label, sortOrder: 1000 - index * 10 })));
  });
  await portfolioContentChanged(user.id, "focus_area", id, "CREATE");
  redirect("/admin/homepage?notice=focus-area-created");
}

export async function updateFocusArea(id: string, formData: FormData) {
  const user = await requireAdmin();
  const tags = parseCommaList(formData.get("tags"));
  await db.transaction(async (tx) => {
    await tx.update(focusAreas).set({ title: requiredText(formData.get("title"), "Focus area title is required."), description: requiredText(formData.get("description"), "Focus area description is required."), icon: String(formData.get("icon") ?? "blocks").trim() || "blocks", sortOrder: integerValue(formData.get("sortOrder")), updatedAt: new Date() }).where(eq(focusAreas.id, id));
    await tx.delete(focusAreaTags).where(eq(focusAreaTags.focusAreaId, id));
    if (tags.length) await tx.insert(focusAreaTags).values(tags.map((label, index) => ({ id: randomUUID(), focusAreaId: id, label, sortOrder: 1000 - index * 10 })));
  });
  await portfolioContentChanged(user.id, "focus_area", id);
  redirect("/admin/homepage?notice=focus-area-updated");
}

export async function deleteFocusArea(id: string) {
  const user = await requireAdmin(); await db.delete(focusAreas).where(eq(focusAreas.id, id));
  await portfolioContentChanged(user.id, "focus_area", id, "DELETE");
  redirect("/admin/homepage?notice=focus-area-deleted");
}

export async function createSkillGroup(formData: FormData) {
  const user = await requireAdmin(); const id = randomUUID(); const now = new Date(); const items = parseCommaList(formData.get("items"));
  await db.transaction(async (tx) => {
    await tx.insert(skillGroups).values({ id, title: requiredText(formData.get("title"), "Skill group title is required."), sortOrder: integerValue(formData.get("sortOrder")), createdAt: now, updatedAt: now });
    if (items.length) await tx.insert(skillItems).values(items.map((label, index) => ({ id: randomUUID(), groupId: id, label, sortOrder: 1000 - index * 10 })));
  });
  await portfolioContentChanged(user.id, "skill_group", id, "CREATE"); redirect("/admin/homepage?notice=skill-group-created");
}

export async function updateSkillGroup(id: string, formData: FormData) {
  const user = await requireAdmin(); const items = parseCommaList(formData.get("items"));
  await db.transaction(async (tx) => {
    await tx.update(skillGroups).set({ title: requiredText(formData.get("title"), "Skill group title is required."), sortOrder: integerValue(formData.get("sortOrder")), updatedAt: new Date() }).where(eq(skillGroups.id, id));
    await tx.delete(skillItems).where(eq(skillItems.groupId, id));
    if (items.length) await tx.insert(skillItems).values(items.map((label, index) => ({ id: randomUUID(), groupId: id, label, sortOrder: 1000 - index * 10 })));
  });
  await portfolioContentChanged(user.id, "skill_group", id); redirect("/admin/homepage?notice=skill-group-updated");
}

export async function deleteSkillGroup(id: string) {
  const user = await requireAdmin(); await db.delete(skillGroups).where(eq(skillGroups.id, id)); await portfolioContentChanged(user.id, "skill_group", id, "DELETE"); redirect("/admin/homepage?notice=skill-group-deleted");
}

export async function createEducationEntry(formData: FormData) {
  const user = await requireAdmin(); const id = randomUUID(); const now = new Date();
  await db.insert(educationEntries).values({ id, type: formData.get("type") === "CERTIFICATION" ? "CERTIFICATION" : "EDUCATION", title: requiredText(formData.get("title"), "Title is required."), institution: nullableText(formData.get("institution")), year: nullableText(formData.get("year")), detail: nullableText(formData.get("detail")), sortOrder: integerValue(formData.get("sortOrder")), createdAt: now, updatedAt: now });
  await portfolioContentChanged(user.id, "education_entry", id, "CREATE"); redirect("/admin/homepage?notice=education-created");
}

export async function updateEducationEntry(id: string, formData: FormData) {
  const user = await requireAdmin();
  await db.update(educationEntries).set({ type: formData.get("type") === "CERTIFICATION" ? "CERTIFICATION" : "EDUCATION", title: requiredText(formData.get("title"), "Title is required."), institution: nullableText(formData.get("institution")), year: nullableText(formData.get("year")), detail: nullableText(formData.get("detail")), sortOrder: integerValue(formData.get("sortOrder")), updatedAt: new Date() }).where(eq(educationEntries.id, id));
  await portfolioContentChanged(user.id, "education_entry", id); redirect("/admin/homepage?notice=education-updated");
}

export async function deleteEducationEntry(id: string) {
  const user = await requireAdmin(); await db.delete(educationEntries).where(eq(educationEntries.id, id)); await portfolioContentChanged(user.id, "education_entry", id, "DELETE"); redirect("/admin/homepage?notice=education-deleted");
}

export async function createAskStarterPrompt(formData: FormData) {
  const user = await requireAdmin(); const id = randomUUID(); const now = new Date();
  await db.insert(askStarterPrompts).values({ id, label: requiredText(formData.get("label"), "Prompt label is required."), question: requiredText(formData.get("question"), "Prompt question is required."), enabled: formData.get("enabled") === "on", sortOrder: integerValue(formData.get("sortOrder")), createdAt: now, updatedAt: now });
  await writeAudit({ userId: user.id, action: "CREATE", entity: "ask_starter_prompt", entityId: id }); revalidatePath("/ask"); redirect("/admin/ask-content?notice=prompt-created");
}

export async function updateAskStarterPrompt(id: string, formData: FormData) {
  const user = await requireAdmin();
  await db.update(askStarterPrompts).set({ label: requiredText(formData.get("label"), "Prompt label is required."), question: requiredText(formData.get("question"), "Prompt question is required."), enabled: formData.get("enabled") === "on", sortOrder: integerValue(formData.get("sortOrder")), updatedAt: new Date() }).where(eq(askStarterPrompts.id, id));
  await writeAudit({ userId: user.id, action: "UPDATE", entity: "ask_starter_prompt", entityId: id }); revalidatePath("/ask"); redirect("/admin/ask-content?notice=prompt-updated");
}

export async function deleteAskStarterPrompt(id: string) {
  const user = await requireAdmin(); await db.delete(askStarterPrompts).where(eq(askStarterPrompts.id, id)); await writeAudit({ userId: user.id, action: "DELETE", entity: "ask_starter_prompt", entityId: id }); revalidatePath("/ask"); redirect("/admin/ask-content?notice=prompt-deleted");
}

export async function createNavigationItem(formData: FormData) {
  const user = await requireAdmin(); const id = randomUUID(); const now = new Date();
  await db.insert(navigationItems).values({ id, placement: navigationPlacement(formData.get("placement")), label: requiredText(formData.get("label"), "Navigation label is required."), href: requiredText(formData.get("href"), "Navigation URL is required."), external: formData.get("external") === "on", enabled: formData.get("enabled") === "on", sortOrder: integerValue(formData.get("sortOrder")), createdAt: now, updatedAt: now });
  await portfolioContentChanged(user.id, "navigation_item", id, "CREATE"); redirect("/admin/navigation?notice=navigation-created");
}

export async function updateNavigationItem(id: string, formData: FormData) {
  const user = await requireAdmin();
  await db.update(navigationItems).set({ placement: navigationPlacement(formData.get("placement")), label: requiredText(formData.get("label"), "Navigation label is required."), href: requiredText(formData.get("href"), "Navigation URL is required."), external: formData.get("external") === "on", enabled: formData.get("enabled") === "on", sortOrder: integerValue(formData.get("sortOrder")), updatedAt: new Date() }).where(eq(navigationItems.id, id));
  await portfolioContentChanged(user.id, "navigation_item", id); redirect("/admin/navigation?notice=navigation-updated");
}

export async function deleteNavigationItem(id: string) {
  const user = await requireAdmin(); await db.delete(navigationItems).where(eq(navigationItems.id, id)); await portfolioContentChanged(user.id, "navigation_item", id, "DELETE"); redirect("/admin/navigation?notice=navigation-deleted");
}

export async function createSitePage(formData: FormData) {
  const user = await requireAdmin();
  const id = randomUUID(); const now = new Date();
  const slug = slugify(requiredText(formData.get("slug"), "Page slug is required."));
  await db.insert(sitePages).values({
    id, slug, route: requiredText(formData.get("route"), "Page route is required."),
    title: requiredText(formData.get("title"), "Page title is required."),
    seoTitle: nullableText(formData.get("seoTitle")), seoDescription: nullableText(formData.get("seoDescription")),
    status: formData.get("status") === "DRAFT" ? "DRAFT" : "PUBLISHED", createdAt: now, updatedAt: now,
  });
  await pageContentChanged(user.id, "site_page", id, "CREATE");
  redirect(`/admin/pages/${id}?notice=page-created`);
}

export async function updateSitePage(id: string, formData: FormData) {
  const user = await requireAdmin();
  const slug = slugify(requiredText(formData.get("slug"), "Page slug is required."));
  await db.update(sitePages).set({
    slug, route: requiredText(formData.get("route"), "Page route is required."),
    title: requiredText(formData.get("title"), "Page title is required."),
    seoTitle: nullableText(formData.get("seoTitle")), seoDescription: nullableText(formData.get("seoDescription")),
    status: formData.get("status") === "DRAFT" ? "DRAFT" : "PUBLISHED", updatedAt: new Date(),
  }).where(eq(sitePages.id, id));
  await pageContentChanged(user.id, "site_page", id);
  redirect(`/admin/pages/${id}?notice=page-updated`);
}

export async function deleteSitePage(id: string) {
  const user = await requireAdmin();
  await db.delete(sitePages).where(eq(sitePages.id, id));
  await pageContentChanged(user.id, "site_page", id, "DELETE");
  redirect("/admin/pages?notice=page-deleted");
}

export async function createPageSection(pageId: string, formData: FormData) {
  const user = await requireAdmin(); const id = randomUUID(); const now = new Date();
  await db.insert(pageSections).values({
    id, pageId, key: requiredText(formData.get("key"), "Section key is required."), component: requiredText(formData.get("component"), "Section component is required."),
    eyebrow: nullableText(formData.get("eyebrow")), title: nullableText(formData.get("title")), description: nullableText(formData.get("description")), body: sanitizeOptionalHtml(formData.get("body")),
    enabled: formData.get("enabled") === "on", sortOrder: integerValue(formData.get("sortOrder")), itemLimit: nullableInteger(formData.get("itemLimit")), createdAt: now, updatedAt: now,
  });
  await pageContentChanged(user.id, "page_section", id, "CREATE");
  redirect(`/admin/pages/${pageId}?notice=section-created`);
}

export async function updatePageSection(id: string, pageId: string, formData: FormData) {
  const user = await requireAdmin();
  await db.update(pageSections).set({
    key: requiredText(formData.get("key"), "Section key is required."), component: requiredText(formData.get("component"), "Section component is required."),
    eyebrow: nullableText(formData.get("eyebrow")), title: nullableText(formData.get("title")), description: nullableText(formData.get("description")), body: sanitizeOptionalHtml(formData.get("body")),
    enabled: formData.get("enabled") === "on", sortOrder: integerValue(formData.get("sortOrder")), itemLimit: nullableInteger(formData.get("itemLimit")), updatedAt: new Date(),
  }).where(eq(pageSections.id, id));
  await pageContentChanged(user.id, "page_section", id);
  redirect(`/admin/pages/${pageId}?notice=section-updated`);
}

export async function deletePageSection(id: string, pageId: string) {
  const user = await requireAdmin(); await db.delete(pageSections).where(eq(pageSections.id, id));
  await pageContentChanged(user.id, "page_section", id, "DELETE");
  redirect(`/admin/pages/${pageId}?notice=section-deleted`);
}

export async function createPageSectionItem(sectionId: string, pageId: string, formData: FormData) {
  const user = await requireAdmin(); const id = randomUUID();
  await db.insert(pageSectionItems).values({ id, sectionId, key: nullableText(formData.get("key")), title: nullableText(formData.get("title")), subtitle: nullableText(formData.get("subtitle")), description: nullableText(formData.get("description")), value: nullableText(formData.get("value")), href: nullableText(formData.get("href")), icon: nullableText(formData.get("icon")), enabled: formData.get("enabled") === "on", sortOrder: integerValue(formData.get("sortOrder")) });
  await pageContentChanged(user.id, "page_section_item", id, "CREATE"); redirect(`/admin/pages/${pageId}?notice=item-created`);
}

export async function updatePageSectionItem(id: string, pageId: string, formData: FormData) {
  const user = await requireAdmin();
  await db.update(pageSectionItems).set({ key: nullableText(formData.get("key")), title: nullableText(formData.get("title")), subtitle: nullableText(formData.get("subtitle")), description: nullableText(formData.get("description")), value: nullableText(formData.get("value")), href: nullableText(formData.get("href")), icon: nullableText(formData.get("icon")), enabled: formData.get("enabled") === "on", sortOrder: integerValue(formData.get("sortOrder")) }).where(eq(pageSectionItems.id, id));
  await pageContentChanged(user.id, "page_section_item", id); redirect(`/admin/pages/${pageId}?notice=item-updated`);
}

export async function deletePageSectionItem(id: string, pageId: string) {
  const user = await requireAdmin(); await db.delete(pageSectionItems).where(eq(pageSectionItems.id, id));
  await pageContentChanged(user.id, "page_section_item", id, "DELETE"); redirect(`/admin/pages/${pageId}?notice=item-deleted`);
}

export async function createPageSectionAction(sectionId: string, pageId: string, formData: FormData) {
  const user = await requireAdmin(); const id = randomUUID();
  await db.insert(pageSectionActions).values({ id, sectionId, key: nullableText(formData.get("key")), label: requiredText(formData.get("label"), "Action label is required."), href: String(formData.get("href") ?? "").trim(), variant: actionVariant(formData.get("variant")), external: formData.get("external") === "on", enabled: formData.get("enabled") === "on", sortOrder: integerValue(formData.get("sortOrder")) });
  await pageContentChanged(user.id, "page_section_action", id, "CREATE"); redirect(`/admin/pages/${pageId}?notice=action-created`);
}

export async function updatePageSectionAction(id: string, pageId: string, formData: FormData) {
  const user = await requireAdmin();
  await db.update(pageSectionActions).set({ key: nullableText(formData.get("key")), label: requiredText(formData.get("label"), "Action label is required."), href: String(formData.get("href") ?? "").trim(), variant: actionVariant(formData.get("variant")), external: formData.get("external") === "on", enabled: formData.get("enabled") === "on", sortOrder: integerValue(formData.get("sortOrder")) }).where(eq(pageSectionActions.id, id));
  await pageContentChanged(user.id, "page_section_action", id); redirect(`/admin/pages/${pageId}?notice=action-updated`);
}

export async function deletePageSectionAction(id: string, pageId: string) {
  const user = await requireAdmin(); await db.delete(pageSectionActions).where(eq(pageSectionActions.id, id));
  await pageContentChanged(user.id, "page_section_action", id, "DELETE"); redirect(`/admin/pages/${pageId}?notice=action-deleted`);
}

function nullableText(value: FormDataEntryValue | null) { const text = String(value ?? "").trim(); return text || null; }
function sanitizeOptionalHtml(value: FormDataEntryValue | null) { const text = nullableText(value); return text ? sanitizePostHtml(text) : null; }
function requiredText(value: FormDataEntryValue | null, message: string) { const text = String(value ?? "").trim(); if (!text) throw new Error(message); return text; }
function integerValue(value: FormDataEntryValue | null) { const parsed = Number(value ?? 0); return Number.isFinite(parsed) ? Math.trunc(parsed) : 0; }
function nullableInteger(value: FormDataEntryValue | null) { const text = String(value ?? "").trim(); if (!text) return null; const parsed = Number(text); return Number.isFinite(parsed) ? Math.trunc(parsed) : null; }
function actionVariant(value: FormDataEntryValue | null): "PRIMARY" | "SECONDARY" | "OUTLINE" | "GHOST" | "LINK" { const raw = String(value ?? "PRIMARY"); return raw === "SECONDARY" || raw === "OUTLINE" || raw === "GHOST" || raw === "LINK" ? raw : "PRIMARY"; }
function lineList(value: FormDataEntryValue | null, max = 100) { return String(value ?? "").split(/\r?\n/).map((item) => item.trim()).filter(Boolean).slice(0, max); }
function paragraphList(value: FormDataEntryValue | null, max = 100) { return String(value ?? "").split(/\n\s*\n/).map((item) => item.trim()).filter(Boolean).slice(0, max); }
function navigationPlacement(value: FormDataEntryValue | null): "HEADER" | "MOBILE" | "FOOTER" | "HEADER_CTA" { const p = String(value ?? "HEADER"); return p === "MOBILE" || p === "FOOTER" || p === "HEADER_CTA" ? p : "HEADER"; }
async function portfolioContentChanged(userId: string, entity: string, entityId: string | null, action = "UPDATE") {
  await writeAudit({ userId, action, entity, entityId });
  updateTag(CACHE_TAGS.profile); updateTag(CACHE_TAGS.pages); updateTag(CACHE_TAGS.content); scheduleAiReindex();
  revalidatePath("/", "layout");
}
async function pageContentChanged(userId: string, entity: string, entityId: string | null, action = "UPDATE") {
  await writeAudit({ userId, action, entity, entityId });
  updateTag(CACHE_TAGS.pages); updateTag(CACHE_TAGS.profile); updateTag(CACHE_TAGS.content); scheduleAiReindex();
  revalidatePath("/", "layout"); revalidatePath("/admin/pages");
}

export async function markMessageRead(id: string) {
  const user = await requireAdmin();
  await db.update(contactMessages).set({ readAt: new Date() }).where(eq(contactMessages.id, id));
  await writeAudit({ userId: user.id, action: "READ", entity: "contact_message", entityId: id });
  revalidatePath("/admin/messages");
  redirect("/admin/messages?notice=message-read");
}
