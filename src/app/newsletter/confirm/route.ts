import { createHash } from "crypto";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { newsletterSubscribers } from "@/db/schema";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const email = (url.searchParams.get("email") || "").toLowerCase();
  const token = url.searchParams.get("token") || "";
  const base = process.env.APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  if (!email || !token) return NextResponse.redirect(new URL("/newsletter/confirmed?status=invalid", base));
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const [subscriber] = await db.select().from(newsletterSubscribers).where(and(eq(newsletterSubscribers.email, email), eq(newsletterSubscribers.confirmationTokenHash, tokenHash))).limit(1);
  if (!subscriber || !subscriber.confirmationExpiresAt || subscriber.confirmationExpiresAt < new Date()) return NextResponse.redirect(new URL("/newsletter/confirmed?status=expired", base));
  await db.update(newsletterSubscribers).set({ status: "ACTIVE", confirmedAt: new Date(), confirmationTokenHash: null, confirmationExpiresAt: null, updatedAt: new Date() }).where(eq(newsletterSubscribers.id, subscriber.id));
  return NextResponse.redirect(new URL("/newsletter/confirmed?status=success", base));
}
