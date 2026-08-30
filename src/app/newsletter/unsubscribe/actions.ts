"use server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { newsletterSubscribers } from "@/db/schema";
import { verifySignedValue } from "@/lib/crypto";

export async function unsubscribe(formData: FormData) {
  const id = String(formData.get("id") ?? ""); const token = String(formData.get("token") ?? "");
  const [subscriber] = await db.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.id, id)).limit(1);
  if (subscriber && verifySignedValue(`${subscriber.id}:${subscriber.email.toLowerCase()}`, token)) {
    await db.update(newsletterSubscribers).set({ status: "UNSUBSCRIBED", unsubscribedAt: new Date(), updatedAt: new Date() }).where(eq(newsletterSubscribers.id, id));
  }
  redirect("/newsletter/unsubscribe?done=1");
}
