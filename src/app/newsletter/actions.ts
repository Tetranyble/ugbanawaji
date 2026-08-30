"use server";

import { createHash, randomBytes, randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { analyticsEvents, newsletterSubscribers } from "@/db/schema";
import { sendMail } from "@/lib/mail";
import { newsletterSubscriberSchema } from "@/lib/validation";
import { getPublicProfile } from "@/lib/data";
import { checkRateLimit } from "@/lib/rate-limit";
import { formWasFilledTooFast, isDisposableEmail } from "@/lib/spam";

export type NewsletterState = { ok: boolean; message: string; confirmationUrl?: string };

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  })[character] ?? character);
}

export async function subscribeNewsletter(_: NewsletterState, formData: FormData): Promise<NewsletterState> {
  const parsed = newsletterSubscriberSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    name: String(formData.get("name") ?? ""),
    website: String(formData.get("website") ?? ""),
  });
  if (!parsed.success) return { ok: false, message: "Enter a valid email address." };
  if (formWasFilledTooFast(formData.get("startedAt"), 1200)) return { ok: false, message: "Please take a moment and try again." };
  if (isDisposableEmail(parsed.data.email)) return { ok: false, message: "Please use a regular email address." };
  const rate = await checkRateLimit("newsletter-subscribe", 8, 60 * 60_000);
  if (!rate.allowed) return { ok: false, message: "Too many subscription attempts. Please try again later." };

  const email = parsed.data.email.toLowerCase();
  const now = new Date();
  const localLogMode =
    (process.env.APP_ENV ?? process.env.NODE_ENV) !== "production" &&
    (process.env.MAIL_MAILER ?? "log").toLowerCase() === "log";
  const [existing] = await db.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.email, email)).limit(1);

  if (existing?.status === "ACTIVE") return { ok: true, message: "You’re already subscribed." };
  if (!localLogMode && existing?.confirmationSentAt && now.getTime() - existing.confirmationSentAt.getTime() < 10 * 60_000) {
    return { ok: true, message: "A confirmation email was sent recently. Check your inbox." };
  }

  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expires = new Date(now.getTime() + 24 * 60 * 60_000);
  const id = existing?.id ?? randomUUID();

  if (existing) {
    await db.update(newsletterSubscribers).set({
      name: parsed.data.name || existing.name,
      status: "PENDING",
      confirmationTokenHash: tokenHash,
      confirmationExpiresAt: expires,
      confirmationSentAt: null,
      unsubscribedAt: null,
      updatedAt: now,
    }).where(eq(newsletterSubscribers.id, id));
  } else {
    await db.insert(newsletterSubscribers).values({
      id,
      email,
      name: parsed.data.name || null,
      status: "PENDING",
      confirmationTokenHash: tokenHash,
      confirmationExpiresAt: expires,
      confirmationSentAt: null,
      confirmedAt: null,
      unsubscribedAt: null,
      source: "website",
      preferences: {},
      createdAt: now,
      updatedAt: now,
    });
  }

  const base = process.env.APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const confirmUrl = `${base}/newsletter/confirm?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;
  const profile = await getPublicProfile();
  const siteName = profile.siteName.replace(/[\r\n]+/g, " ").trim();

  try {
    await sendMail("transactional", {
      to: email,
      subject: `Confirm your ${siteName} newsletter subscription`,
      html: `<p>Confirm that you want occasional engineering notes from ${escapeHtml(siteName)}.</p><p><a href="${confirmUrl}">Confirm subscription</a></p><p>This confirmation link expires in 24 hours.</p>`,
      text: `Confirm your subscription: ${confirmUrl}`,
    });
    await db.update(newsletterSubscribers).set({ confirmationSentAt: new Date(), updatedAt: new Date() }).where(eq(newsletterSubscribers.id, id));
    await db.insert(analyticsEvents).values({ id: randomUUID(), eventType: "newsletter_subscribe", path: "/newsletter", referrerHost: null, country: null, sessionHash: null, metadata: { source: "website" }, createdAt: new Date() }).catch(() => undefined);
    if (localLogMode) {
      return {
        ok: true,
        message: "Local email delivery is in log mode. Use the button below to complete the double opt-in.",
        confirmationUrl: confirmUrl,
      };
    }
    return { ok: true, message: "Check your inbox and confirm your subscription." };
  } catch (error) {
    console.error("Newsletter confirmation email failed", error);
    return { ok: false, message: "Your subscription was saved, but the confirmation email could not be sent. Please try again shortly." };
  }
}
