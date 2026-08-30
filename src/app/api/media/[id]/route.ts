import { eq } from "drizzle-orm";
import { db } from "@/db";
import { mediaAssets } from "@/db/schema";
import { getStorageProvider } from "@/lib/storage";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [asset] = await db.select().from(mediaAssets).where(eq(mediaAssets.id, id)).limit(1);
  if (!asset) return new Response("Not found", { status: 404 });
  try {
    const result = await getStorageProvider(asset.provider, asset.createdBy).read(asset.storageKey);
    const body = new Uint8Array(result.body.byteLength);
    body.set(result.body);
    return new Response(body, {
      headers: {
        "Content-Type": result.contentType || asset.mimeType,
        "Content-Length": String(result.body.byteLength),
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("media read failed", error);
    return new Response("Media unavailable", { status: 503 });
  }
}
