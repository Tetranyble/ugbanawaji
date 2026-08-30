import { randomUUID, createHash } from "crypto";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { analyticsEvents } from "@/db/schema";
import { checkRateLimit } from "@/lib/rate-limit";
import { env } from "@/lib/env";

export async function POST(request: Request) {
  try {
    const rate = await checkRateLimit("analytics", 120, 60_000);
    if (!rate.allowed) return NextResponse.json({ ok: false }, { status: 429 });
    const body = await request.json() as { eventType?: string; path?: string; referrer?: string; sessionId?: string; metadata?: Record<string, unknown> };
    const eventType = String(body.eventType || "page_view").slice(0, 80);
    const path = String(body.path || "/").slice(0, 700);
    if (!path.startsWith("/") || path.startsWith("/admin") || path.startsWith("/api")) return NextResponse.json({ ok: true });
    let referrerHost: string | null = null;
    if (body.referrer) { try { referrerHost = new URL(body.referrer).hostname.slice(0,255); } catch {} }
    const h = await headers();
    const country = (h.get("x-vercel-ip-country") || h.get("cf-ipcountry") || "").slice(0, 8) || null;
    const sessionHash = body.sessionId ? createHash("sha256").update(`${body.sessionId}|${env.appKey || "analytics"}`).digest("hex") : null;
    await db.insert(analyticsEvents).values({
      id: randomUUID(), eventType, path, referrerHost, country, sessionHash,
      metadata: body.metadata && typeof body.metadata === "object" ? body.metadata : {}, createdAt: new Date(),
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
