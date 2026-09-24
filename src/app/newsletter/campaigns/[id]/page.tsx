import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { newsletterCampaigns } from "@/db/schema";
import { sanitizeNewsletterHtml } from "@/lib/content";
import { Button } from "@/components/ui/button";
import { getPublicProfile, getSitePage } from "@/lib/data";
import { actionTarget, pageMetadata } from "@/lib/page-content";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> { const page = await getSitePage("newsletter-campaign"); return { ...pageMetadata(page), robots: { index: false, follow: false } }; }

export default async function NewsletterCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [campaign] = await db.select().from(newsletterCampaigns).where(and(eq(newsletterCampaigns.id, id),inArray(newsletterCampaigns.status, ["SENDING", "SENT"]))).limit(1);
  if (!campaign) notFound();
  const [profile,page] = await Promise.all([getPublicProfile(),getSitePage("newsletter-campaign")]);
  if(!page)return null;
  const baseUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return <main className="section-space"><article className="container-shell max-w-3xl flex flex-col gap-10">{page.sections.map(section=>{
    if(section.component==="NEWSLETTER_ISSUE"){const eyebrow=(section.eyebrow??"").replace("{siteName}",profile.siteName);return <header key={section.id} className="border-b border-border pb-8">{eyebrow?<p className="text-sm font-medium text-primary">{eyebrow}</p>:null}<h1 className="mt-3 text-balance text-4xl font-extrabold tracking-[-.04em] sm:text-5xl">{campaign.subject}</h1>{campaign.preheader?<p className="mt-4 text-lg leading-8 text-muted-foreground">{campaign.preheader}</p>:null}</header>}
    if(section.component==="NEWSLETTER_BODY")return <div key={section.id} className="prose-portfolio text-[1.03rem]" dangerouslySetInnerHTML={{__html:sanitizeNewsletterHtml(campaign.content,baseUrl)}}/>;
    if(section.component==="PAGE_ACTIONS")return <div key={section.id} className="flex flex-wrap gap-3">{section.actions.map(action=><Button key={action.id} asChild variant={action.variant==="PRIMARY"?"default":action.variant==="SECONDARY"?"secondary":action.variant==="GHOST"?"ghost":action.variant==="LINK"?"link":"outline"}><Link href={action.href} {...actionTarget(action)}>{action.label}</Link></Button>)}</div>;
    if(section.component==="RICH_TEXT")return <section key={section.id}>{section.title?<h2 className="text-2xl font-extrabold">{section.title}</h2>:null}{section.body?<div className="prose-portfolio mt-5" dangerouslySetInnerHTML={{__html:section.body}}/>:null}</section>;
    return null;
  })}</article></main>;
}
