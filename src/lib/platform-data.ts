import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  analyticsEvents,
  contactMessages,
  contentEntries,
  mixpanelEvents,
  newsletterCampaigns,
  newsletterDeliveries,
  newsletterSubscribers,
  posts,
  projects,
  resumeVariants,
  postSeries,
} from "@/db/schema";
import { collectPublicKnowledgeDocuments } from "@/lib/knowledge-base";

export type PublicContentType =
  | "PRINCIPLE"
  | "ADR"
  | "ENGINEERING_NOTE"
  | "OPEN_SOURCE"
  | "CODE_SAMPLE"
  | "SPEAKING"
  | "RECOMMENDATION"
  | "CHANGELOG"
  | "USES"
  | "NOW"
  | "READING_NOTE";

export async function getPublishedContent(type?: PublicContentType) {
  const where = type
    ? and(eq(contentEntries.type, type), eq(contentEntries.status, "PUBLISHED"))
    : eq(contentEntries.status, "PUBLISHED");
  return db.select().from(contentEntries).where(where).orderBy(desc(contentEntries.featured), desc(contentEntries.sortOrder), desc(contentEntries.publishedAt));
}

export async function getPublishedContentEntry(type: PublicContentType, slug: string) {
  const [row] = await db.select().from(contentEntries).where(and(eq(contentEntries.type, type), eq(contentEntries.slug, slug), eq(contentEntries.status, "PUBLISHED"))).limit(1);
  return row ?? null;
}

export async function getPublishedSeries() {
  return db.select().from(postSeries).where(eq(postSeries.status, "PUBLISHED")).orderBy(desc(postSeries.updatedAt));
}

export async function getPublishedResumes() {
  return db.select().from(resumeVariants).where(eq(resumeVariants.status, "PUBLISHED")).orderBy(desc(resumeVariants.isDefault), desc(resumeVariants.sortOrder));
}

export async function getNewsletterArchive() {
  return db.select().from(newsletterCampaigns)
    .where(and(eq(newsletterCampaigns.status, "SENT"), eq(newsletterCampaigns.publicArchive, true)))
    .orderBy(desc(newsletterCampaigns.sentAt));
}

export async function getNewsletterArchiveEntry(slug: string) {
  const [row] = await db.select().from(newsletterCampaigns)
    .where(and(eq(newsletterCampaigns.status, "SENT"), eq(newsletterCampaigns.publicArchive, true), eq(newsletterCampaigns.slug, slug)))
    .limit(1);
  return row ?? null;
}

export type SearchResult = {
  type: "post" | "project" | "content" | "experience" | "profile";
  title: string;
  summary: string;
  url: string;
  label: string;
};

function normalizeSearch(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9+#.]+/g, " ").replace(/\s+/g, " ").trim();
}

export async function searchPublicContent(query: string): Promise<SearchResult[]> {
  const q = query.trim().slice(0, 120);
  if (q.length < 2) return [];

  const normalized = normalizeSearch(q);
  const terms = Array.from(new Set(normalized.split(" ").filter((term) => term.length > 1)));
  const documents = await collectPublicKnowledgeDocuments();

  const typeMap: Record<string, SearchResult["type"]> = {
    POST: "post",
    PROJECT: "project",
    EXPERIENCE: "experience",
    PROFILE: "profile",
    PRINCIPLE: "content",
    CONTENT_ENTRY: "content",
  };

  return documents
    .map((document) => {
      const title = normalizeSearch(document.title);
      const summary = normalizeSearch(document.summary);
      const text = normalizeSearch(document.text);
      let score = 0;
      if (title.includes(normalized)) score += 12;
      if (summary.includes(normalized)) score += 7;
      if (text.includes(normalized)) score += 3;
      for (const term of terms) {
        if (title.includes(term)) score += 4;
        if (summary.includes(term)) score += 2;
        if (text.includes(term)) score += 0.75;
      }
      return { document, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.document.title.localeCompare(b.document.title))
    .slice(0, 30)
    .map(({ document }) => ({
      type: typeMap[document.sourceType] ?? "content",
      title: document.title,
      summary: document.summary,
      url: document.url,
      label: document.label,
    }));
}

export async function getAnalyticsSummary(days = 30) {
  const start = new Date(Date.now() - days * 86_400_000);
  const [
    topPages,
    totalRows,
    sessionRows,
    topReferrers,
    topSearches,
    topCountries,
    trafficTrend,
    activeSubscriberRows,
    newSubscriberRows,
    inquiryRows,
    opportunityRows,
    deliveryRows,
  ] = await Promise.all([
    db.select({ path: analyticsEvents.path, views: sql<number>`count(*)`.mapWith(Number) })
      .from(analyticsEvents)
      .where(and(eq(analyticsEvents.eventType, "page_view"), sql`${analyticsEvents.createdAt} >= ${start}`))
      .groupBy(analyticsEvents.path)
      .orderBy(desc(sql`count(*)`))
      .limit(15),
    db.select({ total: sql<number>`count(*)`.mapWith(Number) })
      .from(analyticsEvents)
      .where(and(eq(analyticsEvents.eventType, "page_view"), sql`${analyticsEvents.createdAt} >= ${start}`)),
    db.select({ sessions: sql<number>`count(distinct ${analyticsEvents.sessionHash})`.mapWith(Number) })
      .from(analyticsEvents)
      .where(and(eq(analyticsEvents.eventType, "page_view"), sql`${analyticsEvents.createdAt} >= ${start}`)),
    db.select({ referrerHost: analyticsEvents.referrerHost, views: sql<number>`count(*)`.mapWith(Number) })
      .from(analyticsEvents)
      .where(and(eq(analyticsEvents.eventType, "page_view"), sql`${analyticsEvents.createdAt} >= ${start}`, sql`${analyticsEvents.referrerHost} is not null`))
      .groupBy(analyticsEvents.referrerHost)
      .orderBy(desc(sql`count(*)`))
      .limit(10),
    db.select({ query: sql<string>`json_unquote(json_extract(${analyticsEvents.metadata}, '$.query'))`, searches: sql<number>`count(*)`.mapWith(Number) })
      .from(analyticsEvents)
      .where(and(eq(analyticsEvents.eventType, "site_search"), sql`${analyticsEvents.createdAt} >= ${start}`))
      .groupBy(sql`json_unquote(json_extract(${analyticsEvents.metadata}, '$.query'))`)
      .orderBy(desc(sql`count(*)`))
      .limit(10),
    db.select({ country: analyticsEvents.country, views: sql<number>`count(*)`.mapWith(Number) })
      .from(analyticsEvents)
      .where(and(eq(analyticsEvents.eventType, "page_view"), sql`${analyticsEvents.createdAt} >= ${start}`, sql`${analyticsEvents.country} is not null`))
      .groupBy(analyticsEvents.country)
      .orderBy(desc(sql`count(*)`))
      .limit(10),
    db.select({ day: sql<string>`date_format(${analyticsEvents.createdAt}, '%Y-%m-%d')`, views: sql<number>`count(*)`.mapWith(Number) })
      .from(analyticsEvents)
      .where(and(eq(analyticsEvents.eventType, "page_view"), sql`${analyticsEvents.createdAt} >= ${start}`))
      .groupBy(sql`date_format(${analyticsEvents.createdAt}, '%Y-%m-%d')`)
      .orderBy(sql`date_format(${analyticsEvents.createdAt}, '%Y-%m-%d')`),
    db.select({ total: sql<number>`count(*)`.mapWith(Number) }).from(newsletterSubscribers).where(eq(newsletterSubscribers.status, "ACTIVE")),
    db.select({ total: sql<number>`count(*)`.mapWith(Number) }).from(newsletterSubscribers).where(sql`${newsletterSubscribers.createdAt} >= ${start}`),
    db.select({ total: sql<number>`count(*)`.mapWith(Number) }).from(contactMessages).where(sql`${contactMessages.createdAt} >= ${start}`),
    db.select({ total: sql<number>`count(*)`.mapWith(Number) }).from(contactMessages).where(and(sql`${contactMessages.createdAt} >= ${start}`, inArray(contactMessages.status, ["OPPORTUNITY", "RECRUITER", "COLLABORATION"]))),
    db.select({ status: newsletterDeliveries.status, total: sql<number>`count(*)`.mapWith(Number) }).from(newsletterDeliveries).where(sql`${newsletterDeliveries.createdAt} >= ${start}`).groupBy(newsletterDeliveries.status),
  ]);

  const delivery = Object.fromEntries(deliveryRows.map((row) => [row.status, row.total])) as Record<string, number>;
  const mixpanel = await getMixpanelAnalyticsSummary(start);
  const useMixpanel = Boolean(mixpanel && mixpanel.total > 0);

  return {
    total: useMixpanel ? mixpanel!.total : (totalRows[0]?.total ?? 0),
    sessions: useMixpanel ? mixpanel!.sessions : (sessionRows[0]?.sessions ?? 0),
    topPages: useMixpanel ? mixpanel!.topPages : topPages,
    topReferrers: useMixpanel ? mixpanel!.topReferrers : topReferrers,
    topSearches,
    topCountries: useMixpanel ? mixpanel!.topCountries : topCountries,
    topCities: useMixpanel ? mixpanel!.topCities : [],
    topSources: useMixpanel ? mixpanel!.topSources : [],
    topCampaigns: useMixpanel ? mixpanel!.topCampaigns : [],
    topDevices: useMixpanel ? mixpanel!.topDevices : [],
    topBrowsers: useMixpanel ? mixpanel!.topBrowsers : [],
    trafficTrend: useMixpanel ? mixpanel!.trafficTrend : trafficTrend,
    analyticsSource: useMixpanel ? "mixpanel" as const : "first-party" as const,
    lastSyncedAt: useMixpanel ? mixpanel!.lastSyncedAt : null,
    activeSubscribers: activeSubscriberRows[0]?.total ?? 0,
    newSubscribers: newSubscriberRows[0]?.total ?? 0,
    contactInquiries: inquiryRows[0]?.total ?? 0,
    opportunityInquiries: opportunityRows[0]?.total ?? 0,
    newsletterSent: delivery.SENT ?? 0,
    newsletterFailed: delivery.FAILED ?? 0,
    days,
  };
}

async function getMixpanelAnalyticsSummary(start: Date) {
  const pageView = and(
    inArray(mixpanelEvents.eventType, ["$mp_web_page_view", "page_view"]),
    sql`${mixpanelEvents.occurredAt} >= ${start}`,
  );

  try {
    const [
      totalRows,
      sessionRows,
      topPages,
      topReferrers,
      topCountries,
      topCities,
      topSources,
      topCampaigns,
      topDevices,
      topBrowsers,
      trafficTrend,
      syncRows,
    ] = await Promise.all([
      db.select({ total: sql<number>`count(*)`.mapWith(Number) }).from(mixpanelEvents).where(pageView),
      db.select({ sessions: sql<number>`count(distinct coalesce(${mixpanelEvents.sessionHash}, ${mixpanelEvents.distinctIdHash}))`.mapWith(Number) }).from(mixpanelEvents).where(pageView),
      db.select({ path: mixpanelEvents.path, views: sql<number>`count(*)`.mapWith(Number) })
        .from(mixpanelEvents).where(and(pageView, sql`${mixpanelEvents.path} is not null`))
        .groupBy(mixpanelEvents.path).orderBy(desc(sql`count(*)`)).limit(15),
      db.select({ referrerHost: mixpanelEvents.referrerHost, views: sql<number>`count(*)`.mapWith(Number) })
        .from(mixpanelEvents).where(and(pageView, sql`${mixpanelEvents.referrerHost} is not null`))
        .groupBy(mixpanelEvents.referrerHost).orderBy(desc(sql`count(*)`)).limit(10),
      db.select({ country: mixpanelEvents.country, views: sql<number>`count(*)`.mapWith(Number) })
        .from(mixpanelEvents).where(and(pageView, sql`${mixpanelEvents.country} is not null`))
        .groupBy(mixpanelEvents.country).orderBy(desc(sql`count(*)`)).limit(10),
      db.select({ label: mixpanelEvents.city, views: sql<number>`count(*)`.mapWith(Number) })
        .from(mixpanelEvents).where(and(pageView, sql`${mixpanelEvents.city} is not null`))
        .groupBy(mixpanelEvents.city).orderBy(desc(sql`count(*)`)).limit(10),
      db.select({ label: mixpanelEvents.source, views: sql<number>`count(*)`.mapWith(Number) })
        .from(mixpanelEvents).where(and(pageView, sql`${mixpanelEvents.source} is not null`))
        .groupBy(mixpanelEvents.source).orderBy(desc(sql`count(*)`)).limit(10),
      db.select({ label: mixpanelEvents.campaign, views: sql<number>`count(*)`.mapWith(Number) })
        .from(mixpanelEvents).where(and(pageView, sql`${mixpanelEvents.campaign} is not null`))
        .groupBy(mixpanelEvents.campaign).orderBy(desc(sql`count(*)`)).limit(10),
      db.select({ label: mixpanelEvents.device, views: sql<number>`count(*)`.mapWith(Number) })
        .from(mixpanelEvents).where(and(pageView, sql`${mixpanelEvents.device} is not null`))
        .groupBy(mixpanelEvents.device).orderBy(desc(sql`count(*)`)).limit(10),
      db.select({ label: mixpanelEvents.browser, views: sql<number>`count(*)`.mapWith(Number) })
        .from(mixpanelEvents).where(and(pageView, sql`${mixpanelEvents.browser} is not null`))
        .groupBy(mixpanelEvents.browser).orderBy(desc(sql`count(*)`)).limit(10),
      db.select({ day: sql<string>`date_format(${mixpanelEvents.occurredAt}, '%Y-%m-%d')`, views: sql<number>`count(*)`.mapWith(Number) })
        .from(mixpanelEvents).where(pageView)
        .groupBy(sql`date_format(${mixpanelEvents.occurredAt}, '%Y-%m-%d')`)
        .orderBy(sql`date_format(${mixpanelEvents.occurredAt}, '%Y-%m-%d')`),
      db.select({ lastSyncedAt: sql<Date | null>`max(${mixpanelEvents.syncedAt})` }).from(mixpanelEvents),
    ]);

    return {
      total: totalRows[0]?.total ?? 0,
      sessions: sessionRows[0]?.sessions ?? 0,
      topPages,
      topReferrers,
      topCountries,
      topCities,
      topSources,
      topCampaigns,
      topDevices,
      topBrowsers,
      trafficTrend,
      lastSyncedAt: syncRows[0]?.lastSyncedAt ?? null,
    };
  } catch {
    // A new deployment can render before its migration and first sync have run.
    return null;
  }
}

export async function getSeriesById(id: string | null | undefined) {
  if (!id) return null;
  const [row] = await db.select().from(postSeries).where(and(eq(postSeries.id, id), eq(postSeries.status, "PUBLISHED"))).limit(1);
  return row ?? null;
}

export async function getSeriesWithPosts(slug: string) {
  const [series] = await db.select().from(postSeries).where(and(eq(postSeries.slug, slug), eq(postSeries.status, "PUBLISHED"))).limit(1);
  if (!series) return null;
  const rows = await db.select().from(posts).where(and(eq(posts.seriesId, series.id), inArray(posts.status,["PUBLISHED","SCHEDULED"]), sql`${posts.publishedAt} <= ${new Date()}`)).orderBy(posts.seriesOrder, posts.publishedAt);
  return { series, posts: rows };
}
