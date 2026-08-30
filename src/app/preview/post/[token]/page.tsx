import { createHash } from "crypto";
import { and, eq, gt } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { posts, previewTokens } from "@/db/schema";
import { PostContent } from "@/components/site/post-content";
import { getTaxonomyForPosts } from "@/lib/taxonomy";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function PreviewPostPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params; const hash = createHash("sha256").update(token).digest("hex");
  const [preview] = await db.select().from(previewTokens).where(and(eq(previewTokens.entityType,"POST"), eq(previewTokens.tokenHash,hash), gt(previewTokens.expiresAt,new Date()))).limit(1);
  if (!preview) notFound();
  const [post] = await db.select().from(posts).where(eq(posts.id,preview.entityId)).limit(1); if (!post) notFound();
  const taxonomy = (await getTaxonomyForPosts([post.id])).get(post.id) ?? { categories: [], tags: [] };
  return <main className="section-space"><article className="container-shell max-w-4xl"><div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm"><strong>Private preview.</strong> This article is not public yet. The link expires automatically.</div><Link href="/" className="mt-6 inline-block text-sm text-muted-foreground">← Back to site</Link><header className="mt-8 border-b border-border pb-8"><div className="flex flex-wrap gap-2">{taxonomy.categories.map(x=><Badge key={x}>{x}</Badge>)}{taxonomy.tags.map(x=><Badge key={x}>{x}</Badge>)}</div><h1 className="mt-5 text-4xl font-extrabold sm:text-5xl">{post.title}</h1><p className="mt-4 text-lg text-muted-foreground">{post.excerpt}</p></header><div className="prose-portfolio mt-10"><PostContent content={post.content} format={post.contentFormat}/></div></article></main>
}
