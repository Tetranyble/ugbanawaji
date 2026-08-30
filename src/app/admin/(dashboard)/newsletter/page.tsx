import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { Plus } from "lucide-react";
import { db } from "@/db";
import { newsletterCampaigns, newsletterSubscribers } from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatAppDateTime } from "@/lib/time";

export default async function NewsletterAdminPage() {
  const [campaigns, subscribers, [active], [pending], [unsubscribed]] = await Promise.all([
    db.select().from(newsletterCampaigns).orderBy(desc(newsletterCampaigns.updatedAt)),
    db.select().from(newsletterSubscribers).orderBy(desc(newsletterSubscribers.createdAt)).limit(50),
    db.select({ count: sql<number>`count(*)` }).from(newsletterSubscribers).where(eq(newsletterSubscribers.status, "ACTIVE")),
    db.select({ count: sql<number>`count(*)` }).from(newsletterSubscribers).where(eq(newsletterSubscribers.status, "PENDING")),
    db.select({ count: sql<number>`count(*)` }).from(newsletterSubscribers).where(eq(newsletterSubscribers.status, "UNSUBSCRIBED")),
  ]);

  return (
    <div className="max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-kicker">Audience</p>
          <h1 className="mt-2 text-3xl font-extrabold">Newsletter</h1>
          <p className="mt-2 text-muted-foreground">First-party subscribers, consent and campaign delivery records live in your MySQL database.</p>
        </div>
        <Button asChild><Link href="/admin/newsletter/campaigns/new"><Plus className="size-4" /> New campaign</Link></Button>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-5"><p className="text-3xl font-extrabold text-primary">{Number(active?.count || 0)}</p><p className="text-sm text-muted-foreground">Active subscribers</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-3xl font-extrabold">{Number(pending?.count || 0)}</p><p className="text-sm text-muted-foreground">Awaiting confirmation</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-3xl font-extrabold">{Number(unsubscribed?.count || 0)}</p><p className="text-sm text-muted-foreground">Unsubscribed</p></CardContent></Card>
      </div>

      <Card className="mt-7">
        <CardHeader><CardTitle>Campaigns</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="flex flex-col gap-3 border-b border-border pb-4 last:border-0 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2"><p className="font-semibold">{campaign.title}</p><Badge>{campaign.status}</Badge></div>
                <p className="mt-1 text-xs text-muted-foreground">{campaign.scheduledAt ? `Scheduled ${formatAppDateTime(campaign.scheduledAt)}` : `Updated ${formatAppDateTime(campaign.updatedAt)}`}</p>
              </div>
              <Button asChild size="sm" variant="outline"><Link href={`/admin/newsletter/campaigns/${campaign.id}`}>Open</Link></Button>
            </div>
          ))}
          {!campaigns.length ? <p className="text-sm text-muted-foreground">No campaigns yet.</p> : null}
        </CardContent>
      </Card>

      <Card className="mt-7">
        <CardHeader><CardTitle>Recent subscribers</CardTitle></CardHeader>
        <CardContent>
          {subscribers.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                  <tr><th className="py-3 pr-4">Subscriber</th><th className="py-3 pr-4">Status</th><th className="py-3 pr-4">Joined</th><th className="py-3">Confirmed</th></tr>
                </thead>
                <tbody>
                  {subscribers.map((subscriber) => (
                    <tr key={subscriber.id} className="border-b border-border/70 last:border-0">
                      <td className="py-4 pr-4"><p className="font-medium">{subscriber.name || "—"}</p><p className="text-xs text-muted-foreground">{subscriber.email}</p></td>
                      <td className="py-4 pr-4"><Badge>{subscriber.status}</Badge></td>
                      <td className="py-4 pr-4 text-muted-foreground">{formatAppDateTime(subscriber.createdAt)}</td>
                      <td className="py-4 text-muted-foreground">{subscriber.confirmedAt ? formatAppDateTime(subscriber.confirmedAt) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="text-sm text-muted-foreground">No subscribers yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
