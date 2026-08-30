import { notFound } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { newsletterCampaigns, newsletterDeliveries } from "@/db/schema";
import { NewsletterCampaignEditor } from "@/components/admin/newsletter-campaign-editor";
import { queueNewsletterCampaign, retryFailedNewsletterDeliveries, updateNewsletterCampaign } from "@/app/admin/newsletter-actions";
import { appTimeZone, formatAppDateTimeLocal } from "@/lib/time";
import { Card, CardContent } from "@/components/ui/card";

export default async function EditNewsletterCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [[campaign], counts] = await Promise.all([
    db.select().from(newsletterCampaigns).where(eq(newsletterCampaigns.id, id)).limit(1),
    db.select({ status: newsletterDeliveries.status, count: sql<number>`count(*)` })
      .from(newsletterDeliveries)
      .where(eq(newsletterDeliveries.campaignId, id))
      .groupBy(newsletterDeliveries.status),
  ]);
  if (!campaign) notFound();
  const totals = Object.fromEntries(counts.map((row) => [row.status, Number(row.count)]));

  return (
    <>
      <div className="mb-6 grid max-w-5xl gap-3 sm:grid-cols-4">
        {[["SENT", "Sent"], ["PENDING", "Pending"], ["FAILED", "Failed"], ["SKIPPED", "Skipped"]].map(([status, label]) => (
          <Card key={status}><CardContent className="p-4"><p className="text-2xl font-extrabold">{totals[status] ?? 0}</p><p className="text-xs text-muted-foreground">{label}</p></CardContent></Card>
        ))}
      </div>
      <NewsletterCampaignEditor
        campaign={{ ...campaign, scheduledAtLocal: formatAppDateTimeLocal(campaign.scheduledAt) }}
        appTimeZone={appTimeZone()}
        action={updateNewsletterCampaign.bind(null, id)}
        queueAction={queueNewsletterCampaign.bind(null, id)}
        retryAction={(totals.FAILED ?? 0) > 0 ? retryFailedNewsletterDeliveries.bind(null, id) : undefined}
      />
    </>
  );
}
