import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { marked } from "marked";
import { db } from "@/db";
import { postRevisions, postSeries, posts } from "@/db/schema";
import { deletePost, generatePostPreviewToken, restorePostRevision, updatePost } from "@/app/admin/actions";
import { PostEditor } from "@/components/admin/post-editor";
import { getTaxonomyForPosts, getTaxonomyOptions } from "@/lib/taxonomy";
import { appTimeZone, formatAppDateTimeLocal } from "@/lib/time";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/forms/submit-button";

export default async function EditPostPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ previewToken?: string }> }) {
  const { id } = await params; const { previewToken } = await searchParams;
  const [[post], taxonomy, assignments, series, revisions] = await Promise.all([
    db.select().from(posts).where(eq(posts.id, id)).limit(1),
    getTaxonomyOptions(),
    getTaxonomyForPosts([id]),
    db.select({ id: postSeries.id, title: postSeries.title }).from(postSeries).orderBy(postSeries.title),
    db.select().from(postRevisions).where(eq(postRevisions.postId, id)).orderBy(desc(postRevisions.createdAt)).limit(12),
  ]);
  if (!post) notFound();
  const assigned = assignments.get(id) ?? { categories: [], tags: [] };
  const content = post.contentFormat === "MARKDOWN" ? await marked.parse(post.content) : post.content;
  const effectiveStatus = post.status === "SCHEDULED" && post.publishedAt && post.publishedAt <= new Date() ? "PUBLISHED" : post.status;
  const origin = process.env.APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return <div className="space-y-8">
    {previewToken ? <Card className="border-primary/30"><CardHeader><CardTitle>Shareable preview link</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">Expires in 72 hours. Anyone with the URL can read this unpublished article.</p><code className="mt-3 block break-all rounded-xl bg-muted p-3 text-xs">{`${origin}/preview/post/${previewToken}`}</code></CardContent></Card> : null}
    <PostEditor
      postId={id}
      post={{ ...post, status: effectiveStatus, publishedAtLocal: formatAppDateTimeLocal(post.publishedAt), content, ...assigned }}
      appTimeZone={appTimeZone()}
      action={updatePost.bind(null, id)}
      deleteAction={deletePost.bind(null, id)}
      previewHref={`/admin/posts/${id}/preview`}
      previewAction={generatePostPreviewToken.bind(null,id)}
      categoryOptions={taxonomy.categories.map((x) => x.name)}
      tagOptions={taxonomy.tags.map((x) => x.name)}
      seriesOptions={series}
    />
    <Card><CardHeader><CardTitle>Revision history</CardTitle></CardHeader><CardContent className="space-y-3">{revisions.length ? revisions.map((revision)=><div key={revision.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4"><div><p className="font-semibold">{revision.title}</p><p className="text-xs text-muted-foreground">Saved snapshot · {revision.createdAt.toLocaleString()}</p></div><form action={restorePostRevision.bind(null,id,revision.id)}><SubmitButton size="sm" variant="outline" pendingText="Restoring…">Restore</SubmitButton></form></div>) : <p className="text-sm text-muted-foreground">A revision is created automatically before each saved update.</p>}</CardContent></Card>
  </div>;
}
