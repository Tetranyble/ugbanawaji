import { and, desc, inArray, lte, ne } from "drizzle-orm";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { getTaxonomyForPosts } from "@/lib/taxonomy";
import { getPublishedProjects } from "@/lib/data";

function norm(value: string) { return value.trim().toLowerCase(); }

export async function getRelatedPosts(postId: string, categories: string[], tags: string[]) {
  const candidates = await db.select().from(posts)
    .where(and(inArray(posts.status, ["PUBLISHED", "SCHEDULED"]), lte(posts.publishedAt, new Date()), ne(posts.id, postId)))
    .orderBy(desc(posts.publishedAt)).limit(40);
  const taxonomy = await getTaxonomyForPosts(candidates.map((item) => item.id));
  return candidates.map((item) => {
    const t = taxonomy.get(item.id) ?? { categories: [], tags: [] };
    const score = t.categories.filter((item) => categories.includes(item)).length * 3 + t.tags.filter((item) => tags.includes(item)).length;
    return { ...item, score };
  }).filter((item) => item.score > 0).sort((a, b) => b.score - a.score).slice(0, 4);
}

export async function getRelatedProjectsForPost(categories: string[], tags: string[]) {
  const terms = new Set([...categories, ...tags].map(norm));
  const candidates = (await getPublishedProjects()).slice(0, 30);
  return candidates.map((project) => {
    const stack = project.techStack.map(norm);
    const body = `${project.kind} ${project.title} ${project.summary}`.toLowerCase();
    let score = stack.filter((tech) => terms.has(tech)).length * 3;
    for (const term of terms) if (term.length > 2 && body.includes(term)) score += 1;
    return { ...project, score };
  }).filter((project) => project.score > 0).sort((a, b) => b.score - a.score).slice(0, 3);
}

export async function getRelatedPostsForProject(techStack: string[], kind: string) {
  const candidates = await db.select().from(posts)
    .where(and(inArray(posts.status, ["PUBLISHED", "SCHEDULED"]), lte(posts.publishedAt, new Date())))
    .orderBy(desc(posts.publishedAt)).limit(50);
  const taxonomy = await getTaxonomyForPosts(candidates.map((item) => item.id));
  const projectTerms = new Set([...techStack, kind].map(norm));
  return candidates.map((post) => {
    const t = taxonomy.get(post.id) ?? { categories: [], tags: [] };
    const postTerms = [...t.categories, ...t.tags].map(norm);
    const score = postTerms.filter((term) => projectTerms.has(term)).length * 2 + [...projectTerms].filter((term) => post.title.toLowerCase().includes(term)).length;
    return { ...post, score };
  }).filter((post) => post.score > 0).sort((a, b) => b.score - a.score).slice(0, 4);
}
