import { createHash } from "crypto";
import { and, eq, gt } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { posts, previewTokens } from "@/db/schema";
import { PostContent } from "@/components/site/post-content";
import { getTaxonomyForPosts } from "@/lib/taxonomy";
import { Badge } from "@/components/ui/badge";
import { getSitePage } from "@/lib/data";
import { actionTarget, sectionAction } from "@/lib/page-content";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function PreviewPostPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const hash = createHash("sha256").update(token).digest("hex");
  const [preview] = await db.select().from(previewTokens).where(and(eq(previewTokens.entityType,"POST"), eq(previewTokens.tokenHash,hash), gt(previewTokens.expiresAt,new Date()))).limit(1);
  if (!preview) notFound();
  const [[post], page] = await Promise.all([
    db.select().from(posts).where(eq(posts.id,preview.entityId)).limit(1),
    getSitePage("preview-post"),
  ]);
  if (!post || !page) notFound();
  const taxonomy = (await getTaxonomyForPosts([post.id])).get(post.id) ?? { categories: [], tags: [] };

  return <main className="section-space"><article className="container-shell max-w-4xl flex flex-col gap-8">{page.sections.map(section=>{
    if(section.component==="STATUS_MESSAGE"){
      const back=sectionAction(section,"back");
      return <section key={section.id}><div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">{section.title?<strong>{section.title}</strong>:null}{section.description?<> {section.description}</>:null}</div>{back?<Link href={back.href} {...actionTarget(back)} className="mt-5 inline-block text-sm text-muted-foreground hover:text-primary">← {back.label}</Link>:null}</section>;
    }
    if(section.component==="POST_HEADER")return <header key={section.id} className="border-b border-border pb-8"><div className="flex flex-wrap gap-2">{taxonomy.categories.map(x=><Badge key={x}>{x}</Badge>)}{taxonomy.tags.map(x=><Badge key={x}>{x}</Badge>)}</div><h1 className="mt-5 text-4xl font-extrabold sm:text-5xl">{post.title}</h1><p className="mt-4 text-lg text-muted-foreground">{post.excerpt}</p></header>;
    if(section.component==="POST_BODY")return <div key={section.id} className="prose-portfolio"><PostContent content={post.content} format={post.contentFormat}/></div>;
    if(section.component==="RICH_TEXT")return <section key={section.id}>{section.title?<h2 className="text-2xl font-extrabold">{section.title}</h2>:null}{section.description?<p className="mt-3 text-muted-foreground">{section.description}</p>:null}{section.body?<div className="prose-portfolio mt-5" dangerouslySetInnerHTML={{__html:section.body}}/>:null}</section>;
    return null;
  })}</article></main>;
}
