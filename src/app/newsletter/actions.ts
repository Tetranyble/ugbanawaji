"use server";

import { createHash, randomBytes, randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { analyticsEvents, newsletterSubscribers } from "@/db/schema";
import { sendMail } from "@/lib/mail";
import { newsletterSubscriberSchema } from "@/lib/validation";
import { getPublicProfile, getSitePage } from "@/lib/data";
import { checkRateLimit } from "@/lib/rate-limit";
import { formWasFilledTooFast, isDisposableEmail } from "@/lib/spam";
import { itemValue } from "@/lib/page-content";

export type NewsletterState = { ok: boolean; message: string; confirmationUrl?: string };

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  })[character] ?? character);
}

export async function subscribeNewsletter(_: NewsletterState, formData: FormData): Promise<NewsletterState> {
  const systemPage = await getSitePage("newsletter-system");
  const messages = systemPage?.sectionMap.messages;
  const copy = (key: string) => itemValue(messages, key);
  const parsed = newsletterSubscriberSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    name: String(formData.get("name") ?? ""),
    website: String(formData.get("website") ?? ""),
  });
  if (!parsed.success) return { ok: false, message: copy("invalidEmail") };
  if (formWasFilledTooFast(formData.get("startedAt"), 1200)) return { ok: false, message: copy("tooFast") };
  if (isDisposableEmail(parsed.data.email)) return { ok: false, message: copy("disposableEmail") };
  const rate = await checkRateLimit("newsletter-subscribe", 8, 60 * 60_000);
  if (!rate.allowed) return { ok: false, message: copy("rateLimited") };

  const email = parsed.data.email.toLowerCase();
  const now = new Date();
  const localLogMode = (process.env.APP_ENV ?? process.env.NODE_ENV) !== "production" && (process.env.MAIL_MAILER ?? "log").toLowerCase() === "log";
  const [existing] = await db.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.email, email)).limit(1);
  if (existing?.status === "ACTIVE") return { ok: true, message: copy("alreadySubscribed") };
  if (!localLogMode && existing?.confirmationSentAt && now.getTime() - existing.confirmationSentAt.getTime() < 10 * 60_000) return { ok: true, message: copy("recentlySent") };

  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expires = new Date(now.getTime() + 24 * 60 * 60_000);
  const id = existing?.id ?? randomUUID();
  if (existing) {
    await db.update(newsletterSubscribers).set({ name: parsed.data.name || existing.name, status: "PENDING", confirmationTokenHash: tokenHash, confirmationExpiresAt: expires, confirmationSentAt: null, unsubscribedAt: null, updatedAt: now }).where(eq(newsletterSubscribers.id, id));
  } else {
    await db.insert(newsletterSubscribers).values({ id, email, name: parsed.data.name || null, status: "PENDING", confirmationTokenHash: tokenHash, confirmationExpiresAt: expires, confirmationSentAt: null, confirmedAt: null, unsubscribedAt: null, source: "website", preferences: {}, createdAt: now, updatedAt: now });
  }

  const base = process.env.APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const confirmUrl = `${base}/newsletter/confirm?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;
  const profile = await getPublicProfile();
  const siteName = profile.siteName.replace(/[\r\n]+/g, " ").trim();
  const emailSubject = copy("emailSubject").replace("{siteName}", siteName);
  const intro = copy("emailIntro").replace("{siteName}", siteName);
  const confirmLabel = copy("emailConfirmLabel");
  const expiry = copy("emailExpiry");
  const emailText = copy("emailText").replace("{confirmUrl}", confirmUrl);
  try {
    await sendMail("transactional", { to: email, subject: emailSubject, html: `<p>${escapeHtml(intro)}</p><p><a href="${confirmUrl}">${escapeHtml(confirmLabel)}</a></p><p>${escapeHtml(expiry)}</p>`, text: emailText });
    await db.update(newsletterSubscribers).set({ confirmationSentAt: new Date(), updatedAt: new Date() }).where(eq(newsletterSubscribers.id, id));
    await db.insert(analyticsEvents).values({ id: randomUUID(), eventType: "newsletter_subscribe", path: "/newsletter", referrerHost: null, country: null, sessionHash: null, metadata: { source: "website" }, createdAt: new Date() }).catch(() => undefined);
    if (localLogMode) return { ok: true, message: copy("localLog"), confirmationUrl: confirmUrl };
    return { ok: true, message: copy("checkInbox") };
  } catch (error) {
    console.error("Newsletter confirmation email failed", error);
    return { ok: false, message: copy("sendFailed") };
  }
}
