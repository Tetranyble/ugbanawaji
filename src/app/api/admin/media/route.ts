import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { mediaAssets } from "@/db/schema";
import { env } from "@/lib/env";
import { defaultStorageProvider, getStorageProvider } from "@/lib/storage";
import { absoluteMediaUrl } from "@/lib/media-url";
import type { StorageProviderName } from "@/lib/storage/types";

const allowed = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "application/pdf"]);
const extensions: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/avif": "avif", "application/pdf": "pdf" };

async function requireUser() {
  const session = await auth();
  return session?.user?.role === "ADMIN" && session.user.id ? session.user : null;
}

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const items = await db.select().from(mediaAssets).orderBy(desc(mediaAssets.createdAt)).limit(100);
  return NextResponse.json({ items: items.map((item) => ({ ...item, url: item.publicUrl })) });
}

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const data = await request.formData();
    const file = data.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Choose a file to upload." }, { status: 400 });
    if (!allowed.has(file.type)) return NextResponse.json({ error: "Only JPEG, PNG, WebP, GIF, AVIF and PDF files are allowed." }, { status: 415 });
    if (file.size > env.storage.uploadMaxMb * 1024 * 1024) return NextResponse.json({ error: `File exceeds the ${env.storage.uploadMaxMb} MB upload limit.` }, { status: 413 });
    const requested = String(data.get("provider") ?? "").toUpperCase();
    const providerName: StorageProviderName = ["LOCAL", "S3", "GOOGLE_DRIVE"].includes(requested) ? requested as StorageProviderName : defaultStorageProvider();
    const provider = getStorageProvider(providerName, user.id);
    const id = randomUUID();
    const filename = `${id}.${extensions[file.type] ?? "bin"}`;
    const stored = await provider.upload({ buffer: Buffer.from(await file.arrayBuffer()), filename, mimeType: file.type });
    const publicUrl = absoluteMediaUrl(id, stored.publicUrl);
    try {
      await db.insert(mediaAssets).values({
        id, provider: providerName, filename, originalName: file.name.slice(0, 255), mimeType: file.type, sizeBytes: file.size,
        storageKey: stored.key, publicUrl, metadata: stored.metadata ?? {}, createdBy: user.id, createdAt: new Date(),
      });
    } catch (error) {
      try {
        await provider.remove?.(stored.key);
      } catch (cleanupError) {
        console.warn("uploaded media rollback failed", cleanupError);
      }
      throw error;
    }
    return NextResponse.json({ id, provider: providerName, url: publicUrl }, { status: 201 });
  } catch (error) {
    console.error("media upload failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "File upload failed." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Media id is required" }, { status: 400 });
  const [asset] = await db.select().from(mediaAssets).where(eq(mediaAssets.id, id)).limit(1);
  if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try { await getStorageProvider(asset.provider, asset.createdBy).remove?.(asset.storageKey); } catch (error) { console.warn("storage delete failed", error); }
  await db.delete(mediaAssets).where(eq(mediaAssets.id, id));
  return NextResponse.json({ ok: true });
}
