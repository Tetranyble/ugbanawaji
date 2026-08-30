import { createHash } from "crypto";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { rateLimitBuckets } from "@/db/schema";
import { env } from "@/lib/env";

export async function requestFingerprint(scope: string) {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || h.get("x-real-ip") || "unknown";
  return createHash("sha256").update(`${scope}|${ip}|${env.appKey || "local-rate-limit"}`).digest("hex");
}

export async function checkRateLimit(scope: string, limit: number, windowMs: number) {
  const key = `${scope}:${await requestFingerprint(scope)}`;
  const now = new Date();
  const [row] = await db.select().from(rateLimitBuckets).where(eq(rateLimitBuckets.id, key)).limit(1);
  if (!row || now.getTime() - row.windowStartedAt.getTime() >= windowMs) {
    if (row) await db.update(rateLimitBuckets).set({ hits: 1, windowStartedAt: now, updatedAt: now }).where(eq(rateLimitBuckets.id, key));
    else await db.insert(rateLimitBuckets).values({ id: key, hits: 1, windowStartedAt: now, updatedAt: now });
    return { allowed: true, remaining: Math.max(0, limit - 1) };
  }
  if (row.hits >= limit) return { allowed: false, remaining: 0 };
  await db.update(rateLimitBuckets).set({ hits: row.hits + 1, updatedAt: now }).where(eq(rateLimitBuckets.id, key));
  return { allowed: true, remaining: Math.max(0, limit - row.hits - 1) };
}
