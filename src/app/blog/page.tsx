import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpenText, Rss, SearchX } from "lucide-react";
import { getPublishedPosts } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NewsletterForm } from "@/components/newsletter/newsletter-form";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Technical Writing", description: "Notes on software architecture, fintech infrastructure, reliability, distributed systems and applied AI." };

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ category?: string; tag?: string; type?: string }> }) {
  const params = await searchParams;
  const allPosts = await getPublishedPosts();
  const posts = allPosts.filter((post) => (!params.category || post.categories.some((x) => x.toLowerCase() === params.category!.toLowerCase())) && (!params.tag || post.tags.some((x) => x.toLowerCase() === params.tag!.toLowerCase())) && (!params.type || post.contentType === params.type));
  const filtered = Boolean(params.category || params.tag || params.type);
  return <main className="section-space"><div className="container-shell">
    <div className="flex flex-col gap-6 border-b border-border pb-12 sm:flex-row sm:items-end sm:justify-between"><div><p className="section-kicker">Technical writing</p><h1 className="section-title mt-3 max-w-4xl">Writing about systems that have to work when the happy path ends.</h1><p className="mt-5 max-w-3xl leading-7 text-muted-foreground">Architecture, payments, financial integrations, operational reliability, engineering leadership and auditable AI.</p></div><Button asChild variant="outline"><Link href="/feed.xml"><Rss className="size-4" /> RSS</Link></Button></div>
    {filtered ? <div className="mt-6 flex flex-wrap items-center gap-2"><span className="text-sm text-muted-foreground">Filtered by</span>{params.category?<Badge className="border-primary/20 text-foreground">Category: {params.category}</Badge>:null}{params.tag?<Badge>Tag: {params.tag}</Badge>:null}{params.type?<Badge>{params.type.replaceAll("_"," ")}</Badge>:null}<Button asChild size="sm" variant="ghost"><Link href="/blog">Clear filters</Link></Button></div>:null}
    {posts.length ? <div className="mt-12 grid gap-6 md:grid-cols-2">{posts.map((post)=><Card key={post.id} className="overflow-hidden transition-transform hover:-translate-y-1">
      {post.coverImage?<div className="aspect-[16/8] overflow-hidden bg-muted"><img src={post.coverImage} alt="" className="h-full w-full object-cover" loading="lazy"/></div>:null}
      <CardHeader><div className="flex flex-wrap gap-2"><Link href={`/blog?type=${encodeURIComponent(post.contentType)}`}><Badge>{post.contentType.replaceAll("_"," ")}</Badge></Link>{post.categories.map((category)=><Link key={category} href={`/blog?category=${encodeURIComponent(category)}`}><Badge className="border-primary/20 text-foreground">{category}</Badge></Link>)}{post.tags.slice(0,4).map((tag)=><Link key={tag} href={`/blog?tag=${encodeURIComponent(tag)}`}><Badge>{tag}</Badge></Link>)}</div><p className="pt-3 text-xs text-muted-foreground">{formatDate(post.publishedAt)} · {post.readingMinutes} min read</p><CardTitle className="pt-1 text-2xl"><Link href={`/blog/${post.slug}`} className="hover:text-primary">{post.title}</Link></CardTitle><CardDescription className="text-[15px]">{post.excerpt}</CardDescription><Link href={`/blog/${post.slug}`} className="inline-flex items-center gap-2 pt-4 text-sm font-semibold text-primary">Read article <ArrowRight className="size-4"/></Link></CardHeader>
    </Card>)}</div> : filtered ? <Card className="mt-12 border-dashed"><CardContent className="py-12 text-center"><SearchX className="mx-auto size-8 text-muted-foreground"/><h2 className="mt-4 text-xl font-bold">Nothing matches this filter yet.</h2><p className="mx-auto mt-2 max-w-xl text-muted-foreground">Try all technical writing instead. Categories and tags only appear once a published article uses them.</p><Button asChild variant="outline" className="mt-6"><Link href="/blog">Show all articles</Link></Button></CardContent></Card> : <div className="mt-12 grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
      <Card className="border-dashed"><CardContent className="py-12"><BookOpenText className="size-9 text-primary"/><h2 className="mt-5 text-2xl font-extrabold">The first engineering notes are being prepared.</h2><p className="mt-3 max-w-2xl leading-7 text-muted-foreground">This section will cover financial integrations, backend architecture, distributed systems, reliability and practical applied AI. I’d rather publish useful technical writing than fill the page with placeholder posts.</p><div className="mt-6 flex flex-wrap gap-3"><Button asChild><Link href="/#work">Explore engineering work <ArrowRight className="size-4"/></Link></Button><Button asChild variant="outline"><Link href="/#experience">View experience</Link></Button></div></CardContent></Card>
      <Card><CardHeader><CardTitle>Get new notes by email</CardTitle><CardDescription>The newsletter is managed directly by this site with double opt-in and first-party subscriber records.</CardDescription></CardHeader><CardContent><NewsletterForm compact/></CardContent></Card>
    </div>}
    {allPosts.length ? <Card className="mt-12"><CardHeader><CardTitle>Occasional engineering notes, without noise.</CardTitle><CardDescription>Subscribe for new articles on fintech infrastructure, backend systems and applied AI.</CardDescription></CardHeader><CardContent><NewsletterForm compact/></CardContent></Card>:null}
  </div></main>;
}
