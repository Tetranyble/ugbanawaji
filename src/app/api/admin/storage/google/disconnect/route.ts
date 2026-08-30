import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { storageConnections } from "@/db/schema";
import { decryptSecret } from "@/lib/crypto";

function adminUrl(path: string) {
  return new URL(path, process.env.APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000");
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") return NextResponse.redirect(adminUrl("/admin/login"), 303);
  const [connection] = await db.select().from(storageConnections).where(and(
    eq(storageConnections.userId, session.user.id),
    eq(storageConnections.provider, "GOOGLE_DRIVE"),
  )).limit(1);
  if (connection) {
    try {
      const token = decryptSecret(connection.refreshTokenEncrypted);
      await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        cache: "no-store",
      });
    } catch (error) {
      console.warn("Google token revocation failed; removing the local connection anyway.", error);
    }
    await db.delete(storageConnections).where(eq(storageConnections.id, connection.id));
  }
  return NextResponse.redirect(adminUrl("/admin/media?drive=disconnected"), 303);
}
