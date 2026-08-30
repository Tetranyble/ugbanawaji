import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { storageConnections } from "@/db/schema";
import { encryptSecret, verifySignedValue } from "@/lib/crypto";

function adminUrl(path: string) { return new URL(path, process.env.APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"); }

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") return NextResponse.redirect(adminUrl("/admin/login"));
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state || url.searchParams.get("error")) return NextResponse.redirect(adminUrl("/admin/media?drive=cancelled"));
  try {
    const decoded = Buffer.from(state, "base64url").toString("utf8");
    const parts = decoded.split(":");
    const signature = parts.pop() || "";
    const payload = parts.join(":");
    const [userId, timestamp] = parts;
    if (userId !== session.user.id || !timestamp || Date.now() - Number(timestamp) > 10 * 60_000 || !verifySignedValue(payload, signature)) throw new Error("Invalid OAuth state");
    const redirectUri = process.env.GOOGLE_DRIVE_REDIRECT_URI || "";
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, cache: "no-store",
      body: new URLSearchParams({ code, client_id: process.env.GOOGLE_DRIVE_CLIENT_ID || "", client_secret: process.env.GOOGLE_DRIVE_CLIENT_SECRET || "", redirect_uri: redirectUri, grant_type: "authorization_code" }),
    });
    if (!tokenResponse.ok) throw new Error(`Google token exchange failed (${tokenResponse.status})`);
    const tokens = await tokenResponse.json() as { access_token: string; refresh_token?: string; scope?: string };
    const [existing] = await db.select().from(storageConnections).where(and(eq(storageConnections.userId, session.user.id), eq(storageConnections.provider, "GOOGLE_DRIVE"))).limit(1);
    const refreshToken = tokens.refresh_token || (existing ? null : undefined);
    if (!refreshToken && !existing) throw new Error("Google did not return a refresh token. Reconnect and grant offline access.");
    let email: string | null = existing?.accountEmail ?? null;
    if (tokens.access_token) {
      const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { Authorization: `Bearer ${tokens.access_token}` }, cache: "no-store" });
      if (profileResponse.ok) { const profile = await profileResponse.json() as { email?: string }; email = profile.email || email; }
    }
    const now = new Date();
    if (existing) {
      await db.update(storageConnections).set({
        accountEmail: email, refreshTokenEncrypted: refreshToken ? encryptSecret(refreshToken) : existing.refreshTokenEncrypted,
        scope: tokens.scope || existing.scope, updatedAt: now,
      }).where(eq(storageConnections.id, existing.id));
    } else {
      await db.insert(storageConnections).values({ id: randomUUID(), userId: session.user.id, provider: "GOOGLE_DRIVE", accountEmail: email, refreshTokenEncrypted: encryptSecret(refreshToken!), scope: tokens.scope || null, metadata: {}, createdAt: now, updatedAt: now });
    }
    return NextResponse.redirect(adminUrl("/admin/media?drive=connected"));
  } catch (error) {
    console.error("Google Drive OAuth failed", error);
    return NextResponse.redirect(adminUrl("/admin/media?drive=error"));
  }
}
