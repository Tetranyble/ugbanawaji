import { BarChart3, Eye, Mail, MessageSquare, Search, UsersRound } from "lucide-react";
import { getAnalyticsSummary } from "@/lib/platform-data";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm leading-6 text-muted-foreground">{children}</p>;
}

export default async function AnalyticsPage() {
  let data: Awaited<ReturnType<typeof getAnalyticsSummary>>;
  try {
    data = await getAnalyticsSummary(30);
  } catch {
    data = { total: 0, sessions: 0, topPages: [], topReferrers: [], topSearches: [], topCountries: [], trafficTrend: [], activeSubscribers: 0, newSubscribers: 0, contactInquiries: 0, opportunityInquiries: 0, newsletterSent: 0, newsletterFailed: 0, days: 30 };
  }

  const deliveryTotal = data.newsletterSent + data.newsletterFailed;
  const deliveryRate = deliveryTotal ? Math.round((data.newsletterSent / deliveryTotal) * 100) : 0;
  const stats = [
    [Eye, "Page views", data.total, "Last 30 days"],
    [UsersRound, "Anonymous sessions", data.sessions, "No raw IP storage"],
    [Mail, "Active subscribers", data.activeSubscribers, `+${data.newSubscribers} in 30 days`],
    [MessageSquare, "Contact enquiries", data.contactInquiries, `${data.opportunityInquiries} high-intent`],
    [BarChart3, "Newsletter delivered", data.newsletterSent, deliveryTotal ? `${deliveryRate}% successful` : "No deliveries yet"],
    [Search, "Failed deliveries", data.newsletterFailed, "Review before retrying"],
  ] as const;
  const trend = data.trafficTrend.slice(-14);
  const maxViews = Math.max(1, ...trend.map((item) => item.views));

  return (
    <div className="max-w-7xl">
      <AdminPageHeader eyebrow="First-party analytics" title="Audience, publishing & opportunity signals" description="Privacy-conscious metrics owned by this application. Raw IP addresses and invasive browser fingerprints are not stored." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map(([Icon, label, value, note]) => <Card key={label} className="shadow-none"><CardContent className="flex items-center justify-between gap-5 p-5"><div><p className="text-3xl font-extrabold text-primary">{value}</p><p className="mt-1 font-semibold">{label}</p><p className="mt-1 text-xs text-muted-foreground">{note}</p></div><div className="grid size-11 place-items-center rounded-xl bg-muted"><Icon className="size-4 text-primary" /></div></CardContent></Card>)}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_.75fr]">
        <Card className="shadow-none">
          <CardHeader><CardTitle>Traffic trend</CardTitle><CardDescription>Page views for the last 14 recorded days.</CardDescription></CardHeader>
          <CardContent>{trend.length ? <div className="flex h-48 items-end gap-2 border-b border-border pb-2">{trend.map((item) => <div key={item.day} className="group flex min-w-0 flex-1 flex-col items-center justify-end gap-2" title={`${item.day}: ${item.views} views`}><span className="text-[10px] font-semibold text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">{item.views}</span><div className="w-full rounded-t-md bg-primary/80 transition-colors group-hover:bg-primary" style={{ height: `${Math.max(5, Math.round((item.views / maxViews) * 130))}px` }} /><span className="hidden text-[9px] text-muted-foreground sm:block">{item.day.slice(5)}</span></div>)}</div> : <Empty>No traffic events yet.</Empty>}</CardContent>
        </Card>

        <Card className="shadow-none"><CardHeader><CardTitle>What to act on</CardTitle><CardDescription>Signals worth turning into content or follow-up.</CardDescription></CardHeader><CardContent className="space-y-4 text-sm leading-6 text-muted-foreground"><p>Repeated site searches can become new articles, case studies or explicit portfolio sections.</p><p>Recruiter and opportunity statuses give you a lightweight conversion signal without a third-party CRM.</p><p>Newsletter failures remain visible so retries can be deliberate rather than silently duplicated.</p></CardContent></Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
        <Card className="shadow-none"><CardHeader><CardTitle>Top pages</CardTitle></CardHeader><CardContent className="space-y-3">{data.topPages.length ? data.topPages.slice(0,10).map((item) => <div key={item.path} className="flex justify-between gap-4 text-sm"><span className="truncate text-muted-foreground">{item.path}</span><strong>{item.views}</strong></div>) : <Empty>No page-view data yet.</Empty>}</CardContent></Card>
        <Card className="shadow-none"><CardHeader><CardTitle>Site searches</CardTitle></CardHeader><CardContent className="space-y-3">{data.topSearches.length ? data.topSearches.map((item) => <div key={item.query || "empty"} className="flex justify-between gap-4 text-sm"><span className="truncate text-muted-foreground">{item.query || "—"}</span><strong>{item.searches}</strong></div>) : <Empty>No searches yet.</Empty>}</CardContent></Card>
        <Card className="shadow-none"><CardHeader><CardTitle>Referrers</CardTitle></CardHeader><CardContent className="space-y-3">{data.topReferrers.length ? data.topReferrers.map((item) => <div key={item.referrerHost ?? "direct"} className="flex justify-between gap-4 text-sm"><span className="truncate text-muted-foreground">{item.referrerHost ?? "Direct"}</span><strong>{item.views}</strong></div>) : <Empty>No external referrers recorded yet.</Empty>}</CardContent></Card>
        <Card className="shadow-none"><CardHeader><CardTitle>Countries</CardTitle></CardHeader><CardContent className="space-y-3">{data.topCountries.length ? data.topCountries.map((item) => <div key={item.country ?? "unknown"} className="flex justify-between gap-4 text-sm"><span className="text-muted-foreground">{item.country ?? "Unknown"}</span><strong>{item.views}</strong></div>) : <Empty>Country appears only when the hosting edge provides a coarse country header.</Empty>}</CardContent></Card>
      </div>
    </div>
  );
}
