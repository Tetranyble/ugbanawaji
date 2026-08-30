"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { newsletterCampaigns, newsletterDeliveries } from "@/db/schema";
import { sanitizeNewsletterHtml } from "@/lib/content";
import { newsletterCampaignSchema } from "@/lib/validation";
import { writeAudit } from "@/lib/audit";
import { slugify } from "@/lib/utils";
import { parseAppDateTime } from "@/lib/time";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") redirect("/admin/login");
  return session.user;
}

function parseCampaign(formData: FormData) {
  return newsletterCampaignSchema.parse({
    title: String(formData.get("title") ?? ""), subject: String(formData.get("subject") ?? ""), preheader: String(formData.get("preheader") ?? ""),
    content: String(formData.get("content") ?? ""), slug: slugify(String(formData.get("slug") || formData.get("title") || "newsletter")), publicArchive: formData.get("publicArchive") === "on", status: String(formData.get("status") ?? "DRAFT"), scheduledAt: String(formData.get("scheduledAt") ?? ""),
  });
}

function scheduleDate(status: string, value: string) {
  if (status !== "SCHEDULED") return null;
  const date = value ? parseAppDateTime(value) : null;
  if (!date || date <= new Date()) throw new Error("A scheduled campaign requires a valid future date and time in APP_TIMEZONE.");
  return date;
}

export async function createNewsletterCampaign(formData: FormData) {
  const user = await requireAdmin(); const parsed = parseCampaign(formData); const id = randomUUID(); const now = new Date();
  await db.insert(newsletterCampaigns).values({ id, title: parsed.title, subject: parsed.subject, preheader: parsed.preheader || null, content: sanitizeNewsletterHtml(parsed.content), slug: parsed.slug || null, publicArchive: parsed.publicArchive, status: parsed.status, scheduledAt: scheduleDate(parsed.status, parsed.scheduledAt), sentAt: null, createdBy: user.id, createdAt: now, updatedAt: now });
  await writeAudit({ userId:user.id, action:"CREATE", entity:"newsletter_campaign", entityId:id, metadata:{ title:parsed.title } });
  revalidatePath("/admin/newsletter"); redirect(`/admin/newsletter/campaigns/${id}?notice=campaign-created`);
}

export async function updateNewsletterCampaign(id: string, formData: FormData) {
  const user = await requireAdmin(); const parsed = parseCampaign(formData);
  const [current] = await db.select().from(newsletterCampaigns).where(eq(newsletterCampaigns.id,id)).limit(1);
  if (!current) throw new Error("Campaign not found");
  if (["SENDING","SENT"].includes(current.status)) throw new Error("A sending or sent campaign cannot be edited.");
  await db.update(newsletterCampaigns).set({ title:parsed.title, subject:parsed.subject, preheader:parsed.preheader||null, content:sanitizeNewsletterHtml(parsed.content), slug: parsed.slug || null, publicArchive: parsed.publicArchive, status:parsed.status, scheduledAt:scheduleDate(parsed.status,parsed.scheduledAt), updatedAt:new Date() }).where(eq(newsletterCampaigns.id,id));
  await writeAudit({ userId:user.id, action:"UPDATE", entity:"newsletter_campaign", entityId:id, metadata:{ title:parsed.title } });
  revalidatePath("/admin/newsletter"); revalidatePath(`/admin/newsletter/campaigns/${id}`);
  redirect(`/admin/newsletter/campaigns/${id}?notice=campaign-updated`);
}

export async function queueNewsletterCampaign(id: string) {
  const user = await requireAdmin();
  const [campaign] = await db.select().from(newsletterCampaigns).where(eq(newsletterCampaigns.id,id)).limit(1);
  if (!campaign || campaign.status === "SENT") return;
  await db.update(newsletterCampaigns).set({ status:"SENDING", scheduledAt:new Date(), updatedAt:new Date() }).where(eq(newsletterCampaigns.id,id));
  await writeAudit({ userId:user.id, action:"QUEUE", entity:"newsletter_campaign", entityId:id, metadata:{ title:campaign.title } });
  revalidatePath("/admin/newsletter"); revalidatePath(`/admin/newsletter/campaigns/${id}`);
  redirect(`/admin/newsletter/campaigns/${id}?notice=campaign-queued`);
}


export async function retryFailedNewsletterDeliveries(id: string) {
  const user = await requireAdmin();
  const [campaign] = await db.select().from(newsletterCampaigns).where(eq(newsletterCampaigns.id, id)).limit(1);
  if (!campaign) throw new Error("Campaign not found");
  await db.update(newsletterDeliveries).set({
    status: "PENDING", attempts: 0, lastError: null, messageId: null, sentAt: null, updatedAt: new Date(),
  }).where(and(eq(newsletterDeliveries.campaignId, id), eq(newsletterDeliveries.status, "FAILED")));
  await db.update(newsletterCampaigns).set({ status: "SENDING", sentAt: null, scheduledAt: new Date(), updatedAt: new Date() }).where(eq(newsletterCampaigns.id, id));
  await writeAudit({ userId: user.id, action: "RETRY", entity: "newsletter_campaign", entityId: id, metadata: { title: campaign.title } });
  revalidatePath("/admin/newsletter");
  revalidatePath(`/admin/newsletter/campaigns/${id}`);
  redirect(`/admin/newsletter/campaigns/${id}?notice=campaign-retried`);
}
