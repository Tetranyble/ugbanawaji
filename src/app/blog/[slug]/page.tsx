import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getPublicProfile, getPublishedPost } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { PostContent } from "@/components/site/post-content";
import { YouTubeEmbed } from "@/components/site/youtube-embed";
import { NewsletterForm } from "@/components/newsletter/newsletter-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { db } from "@/db";
import { slugRedirects } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getRelatedPosts, getRelatedProjectsForPost } from "@/lib/related";
import { ArticleToc } from "@/components/site/article-toc";
import { getSeriesById } from "@/lib/platform-data";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; const post = await getPublishedPost(slug); if (!post) return { title: "Article not found" };
  return { title:post.seoTitle||post.title, description:post.seoDescription||post.excerpt, alternates:{canonical:`/blog/${post.slug}`}, openGraph:{type:"article",title:post.seoTitle||post.title,description:post.seoDescription||post.excerpt,publishedTime:post.publishedAt?.toISOString(),images:post.coverImage?[{url:post.coverImage}]:undefined} };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const [post, profile] = await Promise.all([getPublishedPost(slug), getPublicProfile()]); if (!post) { const [mapped] = await db.select().from(slugRedirects).where(and(eq(slugRedirects.entityType,"POST"), eq(slugRedirects.fromSlug,slug))).limit(1); if (mapped) redirect(`/blog/${mapped.toSlug}`); notFound(); }
  const [related, relatedProjects, series] = await Promise.all([getRelatedPosts(post.id, post.categories, post.tags), getRelatedProjectsForPost(post.categories, post.tags), getSeriesById(post.seriesId)]);
  return <main className="section-space"><article className="container-shell max-w-4xl"><Link href="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="size-4"/> All writing</Link>
    <header className="mt-10 border-b border-border pb-10"><div className="flex flex-wrap gap-2">{post.categories.map((item)=><Link key={item} href={`/blog?category=${encodeURIComponent(item)}`}><Badge className="border-primary/20 text-foreground">{item}</Badge></Link>)}{post.tags.map((item)=><Link key={item} href={`/blog?tag=${encodeURIComponent(item)}`}><Badge>{item}</Badge></Link>)}</div><h1 className="mt-5 text-balance text-4xl font-extrabold tracking-[-.045em] sm:text-5xl">{post.title}</h1><p className="mt-5 text-lg leading-8 text-muted-foreground">{post.excerpt}</p><p className="mt-5 text-sm text-muted-foreground">{formatDate(post.publishedAt)} · {post.readingMinutes} min read · {profile.displayName}</p>{series?<p className="mt-3 text-sm"><Link href={`/series/${series.slug}`} className="font-semibold text-primary">Part of: {series.title}</Link></p>:null}{post.coverImage?<div className="mt-8 aspect-[16/8.5] overflow-hidden rounded-2xl border border-border bg-muted"><img src={post.coverImage} alt="" className="h-full w-full object-cover"/></div>:null}{post.youtubeUrl?<div className="mt-8"><YouTubeEmbed url={post.youtubeUrl} title={`${post.title} video`}/></div>:null}</header>
    <div className="mt-10 grid gap-10 lg:grid-cols-[220px_1fr]"><ArticleToc content={post.content} format={post.contentFormat}/><div className="prose-portfolio min-w-0 text-[1.03rem]"><PostContent content={post.content} format={post.contentFormat}/></div></div>
    {related.length ? <section className="mt-14"><h2 className="text-2xl font-extrabold">Related engineering notes</h2><div className="mt-5 grid gap-4 sm:grid-cols-2">{related.map((item)=><Card key={item.id}><CardHeader><CardTitle className="text-lg"><Link href={`/blog/${item.slug}`}>{item.title}</Link></CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">{item.excerpt}</CardContent></Card>)}</div></section>:null}
    {relatedProjects.length ? <section className="mt-10"><h2 className="text-2xl font-extrabold">Related case studies</h2><div className="mt-5 grid gap-4 sm:grid-cols-2">{relatedProjects.map((item)=><Card key={item.id}><CardHeader><p className="text-xs font-bold uppercase tracking-[.12em] text-primary">{item.kind}</p><CardTitle className="text-lg"><Link href={`/work/${item.slug}`}>{item.title}</Link></CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">{item.summary}</CardContent></Card>)}</div></section>:null}
    <Card className="mt-14"><CardHeader><CardTitle>More engineering notes</CardTitle></CardHeader><CardContent><NewsletterForm compact/></CardContent></Card>
  </article></main>;
}
