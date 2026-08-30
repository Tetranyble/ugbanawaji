import { eq } from "drizzle-orm";
import { db } from "@/db";
import { newsletterSubscribers } from "@/db/schema";
import { verifySignedValue } from "@/lib/crypto";

export async function POST(request: Request) {
  const url = new URL(request.url); const id = url.searchParams.get("id") || ""; const token = url.searchParams.get("token") || "";
  const [subscriber] = await db.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.id, id)).limit(1);
  if (!subscriber || !verifySignedValue(`${subscriber.id}:${subscriber.email.toLowerCase()}`, token)) return new Response("Invalid", { status: 400 });
  await db.update(newsletterSubscribers).set({ status: "UNSUBSCRIBED", unsubscribedAt: new Date(), updatedAt: new Date() }).where(eq(newsletterSubscribers.id, id));
  return new Response("Unsubscribed", { status: 200 });
}
