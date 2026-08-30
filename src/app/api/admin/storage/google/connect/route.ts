import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { signValue } from "@/lib/crypto";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") return NextResponse.redirect(new URL("/admin/login", process.env.APP_URL || "http://localhost:3000"));
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_DRIVE_REDIRECT_URI;
  if (!clientId || !redirectUri) return NextResponse.json({ error: "GOOGLE_DRIVE_CLIENT_ID and GOOGLE_DRIVE_REDIRECT_URI are required." }, { status: 500 });
  const payload = `${session.user.id}:${Date.now()}:${randomBytes(12).toString("hex")}`;
  const state = Buffer.from(`${payload}:${signValue(payload)}`).toString("base64url");
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: clientId, redirect_uri: redirectUri, response_type: "code", access_type: "offline", prompt: "consent", include_granted_scopes: "true",
    scope: "openid email https://www.googleapis.com/auth/drive.file", state,
  }).toString();
  return NextResponse.redirect(url);
}
