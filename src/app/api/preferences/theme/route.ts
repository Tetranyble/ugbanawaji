import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ ok: false }, { status: 401 });
  const body = await request.json().catch(() => ({})) as { theme?: string };
  const map = { system: "SYSTEM", light: "LIGHT", dark: "DARK" } as const;
  const value = map[body.theme as keyof typeof map];
  if (!value) return Response.json({ error: "Invalid theme" }, { status: 400 });
  await db.update(users).set({ themePreference: value, updatedAt: new Date() }).where(eq(users.id, session.user.id));
  return Response.json({ ok: true });
}
