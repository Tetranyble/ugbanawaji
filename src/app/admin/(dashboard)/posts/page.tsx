import Link from "next/link";
import { desc } from "drizzle-orm";
import { Plus } from "lucide-react";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { formatAppDateTime } from "@/lib/time";

export default async function AdminPostsPage() {
  const items = await db.select().from(posts).orderBy(desc(posts.updatedAt));
  const now = new Date();
  return <div className="max-w-6xl"><div className="flex flex-col items-start gap-5 sm:flex-row sm:items-end sm:justify-between"><div className="min-w-0"><p className="section-kicker">Writing</p><h1 className="mt-2 text-3xl font-extrabold">Posts</h1><p className="mt-2 text-muted-foreground">Draft, schedule and publish technical writing.</p></div><Button asChild className="shrink-0"><Link href="/admin/posts/new"><Plus className="size-4" /> New post</Link></Button></div><div className="mt-8 space-y-4">{items.map((post) => {
    const liveScheduled = post.status === "SCHEDULED" && post.publishedAt && post.publishedAt <= now;
    const label = liveScheduled ? "LIVE" : post.status;
    return <Card key={post.id}><CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-bold">{post.title}</h2><Badge>{label}</Badge></div><p className="mt-1 text-sm text-muted-foreground">/{post.slug} · Updated {formatDate(post.updatedAt)}{post.status === "SCHEDULED" && post.publishedAt ? ` · Scheduled ${formatAppDateTime(post.publishedAt)}` : ""}</p></div><Button asChild variant="outline" size="sm"><Link href={`/admin/posts/${post.id}`}>Edit</Link></Button></CardContent></Card>;
  })}{!items.length ? <Card><CardContent className="p-6 text-muted-foreground">No articles yet.</CardContent></Card> : null}</div></div>;
}
