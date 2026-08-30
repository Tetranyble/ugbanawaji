import { and, desc, eq, inArray, lte } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db } from "@/db";
import { experiences, posts, projects, siteSettings } from "@/db/schema";
import { fallbackExperiences, fallbackProjects, profile } from "@/content/profile";
import { getTaxonomyForPosts } from "@/lib/taxonomy";
import { CACHE_TAGS } from "@/lib/cache-tags";

const readPublicProfile = unstable_cache(
  async () => mergeProfile(await db.select().from(siteSettings).where(eq(siteSettings.key, "profile"))),
  ["public-profile-v1"],
  { tags: [CACHE_TAGS.profile], revalidate: 86_400 },
);

const readPublishedProjects = unstable_cache(
  () => db.select().from(projects).where(eq(projects.status, "PUBLISHED")).orderBy(desc(projects.sortOrder)),
  ["public-projects-v1"],
  { tags: [CACHE_TAGS.projects], revalidate: 3_600 },
);

const readExperiences = unstable_cache(
  () => db.select().from(experiences).orderBy(desc(experiences.sortOrder)),
  ["public-experiences-v1"],
  { tags: [CACHE_TAGS.experiences], revalidate: 3_600 },
);

const readPublishedPosts = unstable_cache(
  async () => withPostTaxonomy(await db.select().from(posts).where(publicPostWhere()).orderBy(desc(posts.publishedAt))),
  ["public-posts-v1"],
  { tags: [CACHE_TAGS.posts], revalidate: 60 },
);

const readPublishedPost = unstable_cache(
  async (slug: string) => {
    const [post] = await db.select().from(posts).where(and(eq(posts.slug, slug), publicPostWhere())).limit(1);
    if (!post) return null;
    return (await withPostTaxonomy([post]))[0] ?? null;
  },
  ["public-post-v1"],
  { tags: [CACHE_TAGS.posts], revalidate: 60 },
);

const readPublishedProject = unstable_cache(
  async (slug: string) => {
    const [project] = await db.select().from(projects).where(and(eq(projects.slug, slug), eq(projects.status, "PUBLISHED"))).limit(1);
    return project ?? null;
  },
  ["public-project-v1"],
  { tags: [CACHE_TAGS.projects], revalidate: 3_600 },
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
    const [publicProfile, dbProjects, dbExperiences, publishedPosts] = await Promise.all([
      readPublicProfile(),
      readPublishedProjects(),
      readExperiences(),
      readPublishedPosts(),
    ]);
    return {
      profile: publicProfile,
      projects: (dbProjects.length ? dbProjects : fallbackProjects).slice(0, 6),
      experiences: dbExperiences.length ? dbExperiences : fallbackExperiences,
      posts: publishedPosts.slice(0, 3),
      databaseConnected: true,
    };
  } catch {
    return { profile, projects: fallbackProjects, experiences: fallbackExperiences, posts: [], databaseConnected: false };
  }
}

export async function getPublicProfile() {
  try { return await readPublicProfile(); } catch { return profile; }
}

export async function getPublishedPosts() {
  try { return await readPublishedPosts(); } catch { return []; }
}

export async function getPublishedPost(slug: string) {
  try { return await readPublishedPost(slug); } catch { return null; }
}

export async function getPublishedProjects() {
  try {
    const rows = await readPublishedProjects();
    return rows.length ? rows : fallbackProjects;
  } catch {
    return fallbackProjects;
  }
}

export async function getPublishedProject(slug: string) {
  try {
    return await readPublishedProject(slug) ?? fallbackProjects.find((item) => item.slug === slug) ?? null;
  } catch { return fallbackProjects.find((item) => item.slug === slug) ?? null; }
}

function mergeProfile(settings: Array<{ key: string; value: Record<string, unknown> }>) {
  const profileSetting = settings.find((item) => item.key === "profile")?.value ?? {};
  return { ...profile, ...profileSetting } as typeof profile;
}
