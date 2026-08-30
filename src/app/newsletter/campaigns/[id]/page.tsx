import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { newsletterCampaigns } from "@/db/schema";
import { sanitizeNewsletterHtml } from "@/lib/content";
import { Button } from "@/components/ui/button";
import { getPublicProfile } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Newsletter",
  robots: { index: false, follow: false },
};

export default async function NewsletterCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [campaign] = await db
    .select()
    .from(newsletterCampaigns)
    .where(and(
      eq(newsletterCampaigns.id, id),
      inArray(newsletterCampaigns.status, ["SENDING", "SENT"]),
    ))
    .limit(1);

  if (!campaign) notFound();

  const profile = await getPublicProfile();
  const baseUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  return (
    <main className="section-space">
      <article className="container-shell max-w-3xl">
        <header className="border-b border-border pb-8">
          <p className="text-sm font-medium text-primary">{profile.siteName} newsletter</p>
          <h1 className="mt-3 text-balance text-4xl font-extrabold tracking-[-.04em] sm:text-5xl">
            {campaign.subject}
          </h1>
          {campaign.preheader ? (
            <p className="mt-4 text-lg leading-8 text-muted-foreground">{campaign.preheader}</p>
          ) : null}
        </header>

        <div
          className="prose-portfolio mt-10 text-[1.03rem]"
          dangerouslySetInnerHTML={{ __html: sanitizeNewsletterHtml(campaign.content, baseUrl) }}
        />

        <Button asChild variant="outline" className="mt-12">
          <Link href="/blog">Read more engineering notes</Link>
        </Button>
      </article>
    </main>
  );
}
