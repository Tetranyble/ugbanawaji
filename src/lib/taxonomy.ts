import { randomUUID } from "crypto";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { postCategories, postCategoryAssignments, postTagAssignments, tags } from "@/db/schema";
import { slugify } from "@/lib/utils";

async function ensureCategory(name: string) {
  const normalized = name.trim();
  const [found] = await db.select().from(postCategories).where(eq(postCategories.name, normalized)).limit(1);
  if (found) return found;
  const now = new Date();
  const created = { id: randomUUID(), name: normalized, slug: slugify(normalized), description: null, createdAt: now, updatedAt: now };
  await db.insert(postCategories).values(created);
  return created;
}

async function ensureTag(name: string) {
  const normalized = name.trim();
  const [found] = await db.select().from(tags).where(eq(tags.name, normalized)).limit(1);
  if (found) return found;
  const now = new Date();
  const created = { id: randomUUID(), name: normalized, slug: slugify(normalized), createdAt: now, updatedAt: now };
  await db.insert(tags).values(created);
  return created;
}

export async function syncPostTaxonomy(postId: string, categoryNames: string[], tagNames: string[]) {
  const uniqueCategories = [...new Set(categoryNames.map((x) => x.trim()).filter(Boolean))];
  const uniqueTags = [...new Set(tagNames.map((x) => x.trim()).filter(Boolean))];
  const categoryRows = await Promise.all(uniqueCategories.map(ensureCategory));
  const tagRows = await Promise.all(uniqueTags.map(ensureTag));
  await db.transaction(async (tx) => {
    await tx.delete(postCategoryAssignments).where(eq(postCategoryAssignments.postId, postId));
    await tx.delete(postTagAssignments).where(eq(postTagAssignments.postId, postId));
    if (categoryRows.length) await tx.insert(postCategoryAssignments).values(categoryRows.map((item) => ({ postId, categoryId: item.id })));
    if (tagRows.length) await tx.insert(postTagAssignments).values(tagRows.map((item) => ({ postId, tagId: item.id })));
  });
}

export async function getTaxonomyOptions() {
  const [categories, tagRows] = await Promise.all([
    db.select().from(postCategories).orderBy(postCategories.name),
    db.select().from(tags).orderBy(tags.name),
  ]);
  return { categories, tags: tagRows };
}

export async function getTaxonomyForPosts(postIds: string[]) {
  if (!postIds.length) return new Map<string, { categories: string[]; tags: string[] }>();
  const [categoryRows, tagRows] = await Promise.all([
    db.select({ postId: postCategoryAssignments.postId, name: postCategories.name })
      .from(postCategoryAssignments).innerJoin(postCategories, eq(postCategoryAssignments.categoryId, postCategories.id))
      .where(inArray(postCategoryAssignments.postId, postIds)),
    db.select({ postId: postTagAssignments.postId, name: tags.name })
      .from(postTagAssignments).innerJoin(tags, eq(postTagAssignments.tagId, tags.id))
      .where(inArray(postTagAssignments.postId, postIds)),
  ]);
  const map = new Map<string, { categories: string[]; tags: string[] }>();
  for (const id of postIds) map.set(id, { categories: [], tags: [] });
  for (const row of categoryRows) map.get(row.postId)?.categories.push(row.name);
  for (const row of tagRows) map.get(row.postId)?.tags.push(row.name);
  return map;
}
