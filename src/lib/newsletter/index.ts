import { randomUUID } from "crypto";
import path from "path";
import { and, asc, eq, inArray, lt, lte, or } from "drizzle-orm";
import { db, pool } from "@/db";
import { newsletterCampaigns, newsletterDeliveries, newsletterSubscribers } from "@/db/schema";
import { sanitizeNewsletterHtml, stripHtml } from "@/lib/content";
import { sendMail } from "@/lib/mail";
import { signValue } from "@/lib/crypto";
import { getPublicProfile } from "@/lib/data";

const logoCid = "ugbanawaji-logo@ugbanawaji.com";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  })[character] ?? character);
}

function unsubscribeToken(subscriber: { id: string; email: string }) {
  return signValue(`${subscriber.id}:${subscriber.email.toLowerCase()}`);
}

export function unsubscribeUrl(subscriber: { id: string; email: string }) {
  const base = process.env.APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return `${base}/newsletter/unsubscribe?id=${encodeURIComponent(subscriber.id)}&token=${encodeURIComponent(unsubscribeToken(subscriber))}`;
}

export function unsubscribeApiUrl(subscriber: { id: string; email: string }) {
  const base = process.env.APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return `${base}/api/newsletter/unsubscribe?id=${encodeURIComponent(subscriber.id)}&token=${encodeURIComponent(unsubscribeToken(subscriber))}`;
}

async function processNewsletterBatchUnlocked() {
  const now = new Date();
  const [campaign] = await db.select().from(newsletterCampaigns)
    .where(or(eq(newsletterCampaigns.status, "SENDING"), and(eq(newsletterCampaigns.status, "SCHEDULED"), lte(newsletterCampaigns.scheduledAt, now))))
    .orderBy(asc(newsletterCampaigns.scheduledAt)).limit(1);
  if (!campaign) return { processed: 0, campaignId: null };
  const publicProfile = await getPublicProfile();
  const siteName = escapeHtml(publicProfile.siteName);
  const eyebrow = escapeHtml(publicProfile.eyebrow);

  if (campaign.status === "SCHEDULED") await db.update(newsletterCampaigns).set({ status: "SENDING", updatedAt: now }).where(eq(newsletterCampaigns.id, campaign.id));

  const existing = await db.select({ subscriberId: newsletterDeliveries.subscriberId }).from(newsletterDeliveries).where(eq(newsletterDeliveries.campaignId, campaign.id));
  if (!existing.length) {
    const subscribers = await db.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.status, "ACTIVE"));
    if (subscribers.length) {
      await db.insert(newsletterDeliveries).values(subscribers.map((subscriber) => ({
        id: randomUUID(), campaignId: campaign.id, subscriberId: subscriber.id, status: "PENDING" as const, attempts: 0, lastError: null, messageId: null, sentAt: null, createdAt: now, updatedAt: now,
      })));
    }
  }

  const batchSize = Math.min(100, Math.max(1, Number(process.env.NEWSLETTER_BATCH_SIZE || 25)));
  const rows = await db.select({ delivery: newsletterDeliveries, subscriber: newsletterSubscribers })
    .from(newsletterDeliveries)
    .innerJoin(newsletterSubscribers, eq(newsletterDeliveries.subscriberId, newsletterSubscribers.id))
    .where(and(
      eq(newsletterDeliveries.campaignId, campaign.id),
      inArray(newsletterDeliveries.status, ["PENDING", "FAILED"]),
      lt(newsletterDeliveries.attempts, 3),
    )).orderBy(asc(newsletterDeliveries.createdAt)).limit(batchSize);

  let processed = 0;
  for (const row of rows) {
    const { delivery, subscriber } = row;
    if (subscriber.status !== "ACTIVE") {
      await db.update(newsletterDeliveries).set({ status: "SKIPPED", updatedAt: new Date() }).where(eq(newsletterDeliveries.id, delivery.id));
      continue;
    }
    const unsub = unsubscribeUrl(subscriber);
    const oneClickUnsub = unsubscribeApiUrl(subscriber);
    const baseUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const browserUrl = `${baseUrl}/newsletter/campaigns/${encodeURIComponent(campaign.id)}`;
    const preheader = campaign.preheader
      ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${escapeHtml(campaign.preheader)}</div>`
      : "";
    const body = `<!doctype html><html><body style="margin:0;background:#f5f5f5;color:#18181b;font-family:Arial,sans-serif">${preheader}<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f5f5"><tr><td align="center" style="padding:24px 12px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid #e4e4e7;border-radius:16px"><tr><td style="padding:24px 28px;border-bottom:1px solid #e4e4e7"><table role="presentation" cellspacing="0" cellpadding="0"><tr><td><img src="cid:${logoCid}" width="48" height="48" alt="${siteName}" style="display:block;width:48px;height:48px;border-radius:12px;border:0"></td><td style="padding-left:14px"><strong style="font-size:18px">${siteName}</strong><br><span style="font-size:12px;color:#71717a">${eyebrow}</span></td></tr></table></td></tr><tr><td style="padding:16px 28px 0;text-align:right;font-size:12px"><a href="${browserUrl}" style="color:#52525b">View in browser</a></td></tr><tr><td style="padding:12px 28px 28px;line-height:1.65;font-size:16px">${sanitizeNewsletterHtml(campaign.content, baseUrl)}</td></tr><tr><td style="padding:20px 28px;border-top:1px solid #e4e4e7;font-size:12px;line-height:1.6;color:#71717a">You subscribed to technical notes from ${siteName}. <a href="${unsub}" style="color:#52525b">Unsubscribe</a>.</td></tr></table></td></tr></table></body></html>`;
    const text = `${campaign.preheader ? `${campaign.preheader}\n\n` : ""}${stripHtml(campaign.content)}\n\nView in browser: ${browserUrl}\nUnsubscribe: ${unsub}`;
    try {
      const result = await sendMail("newsletter", {
        to: subscriber.email,
        subject: campaign.subject,
        html: body,
        text,
        attachments: [{
          filename: "leonard-ekenekiso.jpg",
          path: path.join(process.cwd(), "public", "leonard-ekenekiso.jpg"),
          contentType: "image/jpeg",
          cid: logoCid,
        }],
        headers: {
          "List-Unsubscribe": `<${oneClickUnsub}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      });
      await db.update(newsletterDeliveries).set({ status: "SENT", attempts: delivery.attempts + 1, lastError: null, messageId: result.messageId || null, sentAt: new Date(), updatedAt: new Date() }).where(eq(newsletterDeliveries.id, delivery.id));
      processed++;
    } catch (error) {
      await db.update(newsletterDeliveries).set({ status: "FAILED", attempts: delivery.attempts + 1, lastError: String(error instanceof Error ? error.message : error).slice(0, 2000), updatedAt: new Date() }).where(eq(newsletterDeliveries.id, delivery.id));
    }
  }

  const remaining = await db.select({ id: newsletterDeliveries.id }).from(newsletterDeliveries)
    .where(and(eq(newsletterDeliveries.campaignId, campaign.id), inArray(newsletterDeliveries.status, ["PENDING", "FAILED"]), lt(newsletterDeliveries.attempts, 3))).limit(1);
  if (!remaining.length) await db.update(newsletterCampaigns).set({ status: "SENT", sentAt: new Date(), updatedAt: new Date() }).where(eq(newsletterCampaigns.id, campaign.id));
  return { processed, campaignId: campaign.id };
}


export async function processNewsletterBatch() {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query("SELECT GET_LOCK(?, 0) AS acquired", ["ugbanawaji_newsletter_worker"]);
    const lockRows = Array.isArray(rows) ? rows as Array<{ acquired?: number | string | null }> : [];
    if (Number(lockRows[0]?.acquired ?? 0) !== 1) return { processed: 0, campaignId: null, skipped: "worker-already-running" };
    try {
      return await processNewsletterBatchUnlocked();
    } finally {
      await connection.query("SELECT RELEASE_LOCK(?)", ["ugbanawaji_newsletter_worker"]);
    }
  } finally {
    connection.release();
  }
}
