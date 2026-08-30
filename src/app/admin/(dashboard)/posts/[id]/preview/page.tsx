import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PostContent } from "@/components/site/post-content";
import { YouTubeEmbed } from "@/components/site/youtube-embed";
import { getTaxonomyForPosts } from "@/lib/taxonomy";
import { formatDateTime } from "@/lib/utils";

export default async function PreviewPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [post] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  if (!post) notFound();
  const taxonomy = (await getTaxonomyForPosts([id])).get(id) ?? { categories: [], tags: [] };
  return <div className="mx-auto max-w-4xl">
    <div className="mb-8 flex items-center justify-between gap-3"><div><p className="section-kicker">Private preview</p><p className="mt-1 text-sm text-muted-foreground">{post.status}{post.publishedAt ? ` · ${formatDateTime(post.publishedAt)}` : ""}</p></div><Button asChild variant="outline"><Link href={`/admin/posts/${id}`}>Back to editor</Link></Button></div>
    <article>
      <header className="border-b border-border pb-10">
        <div className="flex flex-wrap gap-2">{taxonomy.categories.map((item) => <Badge key={item} className="border-primary/20 bg-primary/10 text-primary">{item}</Badge>)}{taxonomy.tags.map((item) => <Badge key={item}>{item}</Badge>)}</div>
        <h1 className="mt-5 text-4xl font-extrabold tracking-[-.045em] sm:text-5xl">{post.title}</h1>
        <p className="mt-5 text-lg leading-8 text-muted-foreground">{post.excerpt}</p>
        {post.coverImage ? <div className="mt-8 aspect-[16/8.5] overflow-hidden rounded-2xl border border-border bg-muted"><img src={post.coverImage} alt="" className="h-full w-full object-cover" /></div> : null}
        {post.youtubeUrl ? <div className="mt-8"><YouTubeEmbed url={post.youtubeUrl} title={`${post.title} video`} /></div> : null}
      </header>
      <div className="prose-portfolio mt-10 text-[1.03rem]"><PostContent content={post.content} format={post.contentFormat} /></div>
    </article>
  </div>;
}
