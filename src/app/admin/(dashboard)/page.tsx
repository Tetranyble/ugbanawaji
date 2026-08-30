import Link from "next/link";
import { desc } from "drizzle-orm";
import { ArrowRight, CalendarClock, FileText, FolderKanban, Mail, Newspaper, UsersRound } from "lucide-react";
import { db } from "@/db";
import { contactMessages, experiences, newsletterSubscribers, posts, projects } from "@/db/schema";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { getPublicProfile } from "@/lib/data";

export default async function AdminDashboard() {
  const [allPosts, allProjects, allExperience, messages, subscribers, profile] = await Promise.all([
    db.select().from(posts).orderBy(desc(posts.updatedAt)).catch(() => []),
    db.select().from(projects).orderBy(desc(projects.updatedAt)).catch(() => []),
    db.select().from(experiences).catch(() => []),
    db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt)).limit(5).catch(() => []),
    db.select({ status: newsletterSubscribers.status }).from(newsletterSubscribers).catch(() => []),
    getPublicProfile(),
  ]);

  const now = new Date();
  const livePosts = allPosts.filter((post) => (post.status === "PUBLISHED" || post.status === "SCHEDULED") && post.publishedAt && post.publishedAt <= now).length;
  const scheduledPosts = allPosts.filter((post) => post.status === "SCHEDULED" && post.publishedAt && post.publishedAt > now).length;
  const activeSubscribers = subscribers.filter((subscriber) => subscriber.status === "ACTIVE").length;
  const unreadMessages = messages.filter((message) => !message.readAt).length;

  const stats = [
    { label: "Articles", value: allPosts.length, note: `${livePosts} currently public`, icon: FileText },
    { label: "Scheduled", value: scheduledPosts, note: "Publishes automatically", icon: CalendarClock },
    { label: "Case studies", value: allProjects.length, note: `${allExperience.length} experience entries`, icon: FolderKanban },
    { label: "Subscribers", value: activeSubscribers, note: "Double opt-in audience", icon: UsersRound },
    { label: "Inbox", value: messages.length, note: `${unreadMessages} unread in recent messages`, icon: Mail },
  ];

  const host = profile.domain.replace(/^https?:\/\//, "").replace(/\/$/, "");

  return (
    <div className="max-w-7xl">
      <AdminPageHeader
        eyebrow="CMS overview"
        title="Your engineering platform at a glance"
        description={`Manage publishing, case studies, audience signals and the public profile for ${host}.`}
        actions={<><Button asChild variant="outline"><Link href="/admin/posts/new">New article</Link></Button><Button asChild><Link href="/admin/projects/new">New case study</Link></Button></>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map(({ label, value, note, icon: Icon }) => (
          <Card key={label} className="shadow-none">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4"><div><p className="text-3xl font-extrabold tracking-tight">{value}</p><p className="mt-1 font-semibold">{label}</p></div><div className="grid size-10 place-items-center rounded-xl bg-muted"><Icon className="size-4 text-primary" /></div></div>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">{note}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
        <Card className="shadow-none">
          <CardHeader className="flex-row items-start justify-between gap-4">
            <div><CardTitle>Recent publishing work</CardTitle><CardDescription className="mt-1">The latest articles you changed in the CMS.</CardDescription></div>
            <Button asChild variant="ghost" size="sm"><Link href="/admin/posts">All posts <ArrowRight className="size-4" /></Link></Button>
          </CardHeader>
          <CardContent>
            {allPosts.length ? <div className="divide-y divide-border">{allPosts.slice(0, 6).map((post) => (
              <Link key={post.id} href={`/admin/posts/${post.id}`} className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0">
                <div className="min-w-0"><p className="truncate font-semibold">{post.title}</p><p className="mt-1 text-xs text-muted-foreground">Updated {formatDate(post.updatedAt)} · {post.contentType.replaceAll("_", " ")}</p></div>
                <Badge variant={post.status === "PUBLISHED" ? "default" : "outline"}>{post.status}</Badge>
              </Link>
            ))}</div> : <p className="text-sm leading-6 text-muted-foreground">No articles yet. Create the first engineering note when you are ready.</p>}
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="flex-row items-start justify-between gap-4">
            <div><CardTitle>Recent enquiries</CardTitle><CardDescription className="mt-1">Recruiter, collaboration and reader messages.</CardDescription></div>
            <Button asChild variant="ghost" size="sm"><Link href="/admin/messages">Inbox <ArrowRight className="size-4" /></Link></Button>
          </CardHeader>
          <CardContent>
            {messages.length ? <div className="divide-y divide-border">{messages.map((message) => (
              <Link key={message.id} href="/admin/messages" className="block py-4 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between gap-3"><p className="truncate font-semibold">{message.name}</p>{!message.readAt ? <Badge>New</Badge> : <Badge variant="outline">{message.status}</Badge>}</div>
                <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">{message.message}</p>
              </Link>
            ))}</div> : <p className="text-sm leading-6 text-muted-foreground">No messages yet. New contact enquiries will appear here.</p>}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 shadow-none">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3"><div className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted"><Newspaper className="size-4 text-primary" /></div><div><p className="font-semibold">Publishing workflow</p><p className="mt-1 text-sm leading-6 text-muted-foreground">Draft, preview, schedule, publish and let the public search/AI index follow the same visibility rules.</p></div></div>
          <Button asChild variant="outline" className="shrink-0"><Link href="/admin/quality">Run content pre-flight</Link></Button>
        </CardContent>
      </Card>
    </div>
  );
}
