import { and, asc, desc, eq, inArray, lte } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db } from "@/db";
import {
  askStarterPrompts,
  educationEntries,
  experienceHighlights,
  experienceImpactAreas,
  experiences,
  focusAreas,
  focusAreaTags,
  pageSectionActions,
  pageSectionItems,
  pageSections,
  sitePages,
  navigationItems,
  posts,
  profileAboutParagraphs,
  projectMetrics,
  projects,
  projectTechnologies,
  siteProfiles,
  skillGroups,
  skillItems,
} from "@/db/schema";
import { getTaxonomyForPosts } from "@/lib/taxonomy";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { EMPTY_PROFILE, type FocusArea, type PublicExperience, type PublicProject, type SkillGroup } from "@/lib/portfolio-types";

const readPublicProfile = unstable_cache(
  async () => {
    const [row] = await db.select().from(siteProfiles).limit(1);
    return row ?? EMPTY_PROFILE;
  },
  ["public-profile-v2"],
  { tags: [CACHE_TAGS.profile], revalidate: 86_400 },
);

export type PublicPageSection = typeof pageSections.$inferSelect & {
  items: Array<typeof pageSectionItems.$inferSelect>;
  actions: Array<typeof pageSectionActions.$inferSelect>;
  itemMap: Record<string, typeof pageSectionItems.$inferSelect>;
  actionMap: Record<string, typeof pageSectionActions.$inferSelect>;
};

export type PublicSitePage = typeof sitePages.$inferSelect & {
  sections: PublicPageSection[];
  sectionMap: Record<string, PublicPageSection>;
};

const readSitePage = unstable_cache(
  async (slug: string): Promise<PublicSitePage | null> => {
    const [page] = await db.select().from(sitePages).where(and(eq(sitePages.slug, slug), eq(sitePages.status, "PUBLISHED"))).limit(1);
    if (!page) return null;
    const sections = await db.select().from(pageSections)
      .where(and(eq(pageSections.pageId, page.id), eq(pageSections.enabled, true)))
      .orderBy(desc(pageSections.sortOrder));
    const sectionIds = sections.map((section) => section.id);
    const [items, actions] = sectionIds.length ? await Promise.all([
      db.select().from(pageSectionItems).where(and(inArray(pageSectionItems.sectionId, sectionIds), eq(pageSectionItems.enabled, true))).orderBy(desc(pageSectionItems.sortOrder)),
      db.select().from(pageSectionActions).where(and(inArray(pageSectionActions.sectionId, sectionIds), eq(pageSectionActions.enabled, true))).orderBy(desc(pageSectionActions.sortOrder)),
    ]) : [[], []];
    const hydrated = sections.map((section) => {
      const sectionItems = items.filter((item) => item.sectionId === section.id);
      const sectionActions = actions.filter((action) => action.sectionId === section.id);
      return {
        ...section,
        items: sectionItems,
        actions: sectionActions,
        itemMap: Object.fromEntries(sectionItems.filter((item) => item.key).map((item) => [item.key!, item])),
        actionMap: Object.fromEntries(sectionActions.filter((action) => action.key).map((action) => [action.key!, action])),
      };
    });
    return { ...page, sections: hydrated, sectionMap: Object.fromEntries(hydrated.map((section) => [section.key, section])) };
  },
  ["site-page-v1"],
  { tags: [CACHE_TAGS.pages], revalidate: 3_600 },
);

const readAbout = unstable_cache(
  () => db.select().from(profileAboutParagraphs).orderBy(desc(profileAboutParagraphs.sortOrder)),
  ["profile-about-v1"],
  { tags: [CACHE_TAGS.profile], revalidate: 3_600 },
);

const readFocusAreas = unstable_cache(async (): Promise<FocusArea[]> => {
  const [areas, tags] = await Promise.all([
    db.select().from(focusAreas).orderBy(desc(focusAreas.sortOrder)),
    db.select().from(focusAreaTags).orderBy(desc(focusAreaTags.sortOrder)),
  ]);
  return areas.map((area) => ({ ...area, tags: tags.filter((tag) => tag.focusAreaId === area.id).map((tag) => tag.label) }));
}, ["focus-areas-v1"], { tags: [CACHE_TAGS.profile], revalidate: 3_600 });

const readSkillGroups = unstable_cache(async (): Promise<SkillGroup[]> => {
  const [groups, items] = await Promise.all([
    db.select().from(skillGroups).orderBy(desc(skillGroups.sortOrder)),
    db.select().from(skillItems).orderBy(desc(skillItems.sortOrder)),
  ]);
  return groups.map((group) => ({ ...group, items: items.filter((item) => item.groupId === group.id).map((item) => item.label) }));
}, ["skill-groups-v1"], { tags: [CACHE_TAGS.profile], revalidate: 3_600 });

const readEducation = unstable_cache(
  () => db.select().from(educationEntries).orderBy(desc(educationEntries.sortOrder)),
  ["education-v1"],
  { tags: [CACHE_TAGS.profile], revalidate: 3_600 },
);

const readNavigation = unstable_cache(
  () => db.select().from(navigationItems).where(eq(navigationItems.enabled, true)).orderBy(desc(navigationItems.sortOrder)),
  ["navigation-v1"],
  { tags: [CACHE_TAGS.profile], revalidate: 3_600 },
);

const readPublishedProjects = unstable_cache(async (): Promise<PublicProject[]> => {
  const [rows, tech, metrics] = await Promise.all([
    db.select().from(projects).where(eq(projects.status, "PUBLISHED")).orderBy(desc(projects.sortOrder)),
    db.select().from(projectTechnologies).orderBy(desc(projectTechnologies.sortOrder)),
    db.select().from(projectMetrics).orderBy(desc(projectMetrics.sortOrder)),
  ]);
  return rows.map((project) => ({
    ...project,
    techStack: tech.filter((item) => item.projectId === project.id).map((item) => item.label),
    metrics: metrics.filter((item) => item.projectId === project.id).map((item) => ({ label: item.label, value: item.value })),
  }));
}, ["public-projects-v2"], { tags: [CACHE_TAGS.projects], revalidate: 3_600 });

const readExperiences = unstable_cache(async (): Promise<PublicExperience[]> => {
  const [rows, highlights, impacts] = await Promise.all([
    db.select().from(experiences).orderBy(desc(experiences.sortOrder)),
    db.select().from(experienceHighlights).orderBy(desc(experienceHighlights.sortOrder)),
    db.select().from(experienceImpactAreas).orderBy(desc(experienceImpactAreas.sortOrder)),
  ]);
  return rows.map((experience) => ({
    ...experience,
    highlights: highlights.filter((item) => item.experienceId === experience.id).map((item) => item.body),
    impactAreas: impacts.filter((item) => item.experienceId === experience.id).map((item) => item.label),
  }));
}, ["public-experiences-v2"], { tags: [CACHE_TAGS.experiences], revalidate: 3_600 });

const readPublishedPosts = unstable_cache(
  async () => withPostTaxonomy(await db.select().from(posts).where(publicPostWhere()).orderBy(desc(posts.publishedAt))),
  ["public-posts-v2"],
  { tags: [CACHE_TAGS.posts], revalidate: 60 },
);

const readPublishedPost = unstable_cache(
  async (slug: string) => {
    const [post] = await db.select().from(posts).where(and(eq(posts.slug, slug), publicPostWhere())).limit(1);
    if (!post) return null;
    return (await withPostTaxonomy([post]))[0] ?? null;
  },
  ["public-post-v2"],
  { tags: [CACHE_TAGS.posts], revalidate: 60 },
);

function publicPostWhere() {
  return and(inArray(posts.status, ["PUBLISHED", "SCHEDULED"]), lte(posts.publishedAt, new Date()));
}

async function withPostTaxonomy<T extends { id: string }>(items: T[]) {
  const map = await getTaxonomyForPosts(items.map((item) => item.id));
  return items.map((item) => ({ ...item, ...(map.get(item.id) ?? { categories: [], tags: [] }) }));
}

export async function getPublicPortfolioData() {
  try {
    const [profile, homePage, aboutRows, focus, skillGroups, education, dbProjects, dbExperiences, publishedPosts] = await Promise.all([
      readPublicProfile(),
      readSitePage("home"),
      readAbout(),
      readFocusAreas(),
      readSkillGroups(),
      readEducation(),
      readPublishedProjects(),
      readExperiences(),
      readPublishedPosts(),
    ]);
    return {
      profile,
      homePage,
      sections: homePage?.sections ?? [],
      sectionMap: homePage?.sectionMap ?? {},
      about: aboutRows.map((row) => row.body),
      focusAreas: focus,
      skillGroups,
      education,
      projects: dbProjects.slice(0, 8),
      experiences: dbExperiences,
      posts: publishedPosts.slice(0, 3),
      databaseConnected: true,
    };
  } catch (error) {
    console.error("Portfolio data load failed", error);
    return {
      profile: EMPTY_PROFILE,
      sections: [],
      sectionMap: {},
      about: [],
      focusAreas: [],
      skillGroups: [],
      education: [],
      projects: [],
      experiences: [],
      posts: [],
      databaseConnected: false,
    };
  }
}

export async function getPublicProfile() {
  try { return await readPublicProfile(); } catch { return EMPTY_PROFILE; }
}

export async function getPublicNavigation() {
  try { return await readNavigation(); } catch { return []; }
}

export async function getSitePage(slug: string) {
  try { return await readSitePage(slug); } catch { return null; }
}


export async function getSitePageByRoute(route: string) {
  try {
    const [page] = await db.select().from(sitePages).where(and(eq(sitePages.route, route), eq(sitePages.status, "PUBLISHED"))).limit(1);
    if (!page || page.route.includes("[")) return null;
    const sections = await db.select().from(pageSections).where(and(eq(pageSections.pageId, page.id), eq(pageSections.enabled, true))).orderBy(desc(pageSections.sortOrder));
    const sectionIds = sections.map((section) => section.id);
    const [items, actions] = sectionIds.length ? await Promise.all([
      db.select().from(pageSectionItems).where(and(inArray(pageSectionItems.sectionId, sectionIds), eq(pageSectionItems.enabled, true))).orderBy(desc(pageSectionItems.sortOrder)),
      db.select().from(pageSectionActions).where(and(inArray(pageSectionActions.sectionId, sectionIds), eq(pageSectionActions.enabled, true))).orderBy(desc(pageSectionActions.sortOrder)),
    ]) : [[], []];
    const hydrated = sections.map((section) => {
      const sectionItems = items.filter((item) => item.sectionId === section.id);
      const sectionActions = actions.filter((action) => action.sectionId === section.id);
      return { ...section, items: sectionItems, actions: sectionActions, itemMap: Object.fromEntries(sectionItems.filter((item) => item.key).map((item) => [item.key!, item])), actionMap: Object.fromEntries(sectionActions.filter((action) => action.key).map((action) => [action.key!, action])) };
    });
    return { ...page, sections: hydrated, sectionMap: Object.fromEntries(hydrated.map((section) => [section.key, section])) } as PublicSitePage;
  } catch { return null; }
}

export async function getAdminSitePage(id: string) {
  const [page] = await db.select().from(sitePages).where(eq(sitePages.id, id)).limit(1);
  if (!page) return null;
  const sections = await db.select().from(pageSections).where(eq(pageSections.pageId, page.id)).orderBy(desc(pageSections.sortOrder));
  const sectionIds = sections.map((section) => section.id);
  const [items, actions] = sectionIds.length ? await Promise.all([
    db.select().from(pageSectionItems).where(inArray(pageSectionItems.sectionId, sectionIds)).orderBy(desc(pageSectionItems.sortOrder)),
    db.select().from(pageSectionActions).where(inArray(pageSectionActions.sectionId, sectionIds)).orderBy(desc(pageSectionActions.sortOrder)),
  ]) : [[], []];
  return {
    ...page,
    sections: sections.map((section) => ({
      ...section,
      items: items.filter((item) => item.sectionId === section.id),
      actions: actions.filter((action) => action.sectionId === section.id),
    })),
  };
}

export async function getAskStarterPrompts() {
  try { return await db.select().from(askStarterPrompts).where(eq(askStarterPrompts.enabled, true)).orderBy(desc(askStarterPrompts.sortOrder)); } catch { return []; }
}

export async function getPublishedPosts() {
  try { return await readPublishedPosts(); } catch { return []; }
}

export async function getPublishedPost(slug: string) {
  try { return await readPublishedPost(slug); } catch { return null; }
}

export async function getPublishedProjects() {
  try { return await readPublishedProjects(); } catch { return []; }
}

export async function getPublishedProject(slug: string) {
  try {
    const items = await readPublishedProjects();
    return items.find((item) => item.slug === slug) ?? null;
  } catch { return null; }
}

export async function getAdminProject(id: string) {
  const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  if (!project) return null;
  const [tech, metrics] = await Promise.all([
    db.select().from(projectTechnologies).where(eq(projectTechnologies.projectId, id)).orderBy(desc(projectTechnologies.sortOrder)),
    db.select().from(projectMetrics).where(eq(projectMetrics.projectId, id)).orderBy(desc(projectMetrics.sortOrder)),
  ]);
  return { ...project, techStack: tech.map((item) => item.label), metrics: metrics.map((item) => ({ label: item.label, value: item.value })) };
}

export async function getAdminExperiences() {
  const [rows, highlights, impacts] = await Promise.all([
    db.select().from(experiences).orderBy(desc(experiences.sortOrder)),
    db.select().from(experienceHighlights).orderBy(desc(experienceHighlights.sortOrder)),
    db.select().from(experienceImpactAreas).orderBy(desc(experienceImpactAreas.sortOrder)),
  ]);
  return rows.map((experience) => ({
    ...experience,
    highlights: highlights.filter((item) => item.experienceId === experience.id).map((item) => item.body),
    impactAreas: impacts.filter((item) => item.experienceId === experience.id).map((item) => item.label),
  }));
}
