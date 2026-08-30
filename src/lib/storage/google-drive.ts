import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { storageConnections } from "@/db/schema";
import { decryptSecret } from "@/lib/crypto";
import type { StorageProvider, UploadInput } from "./types";

async function getConnection(userId: string) {
  const [connection] = await db.select().from(storageConnections)
    .where(and(eq(storageConnections.userId, userId), eq(storageConnections.provider, "GOOGLE_DRIVE"))).limit(1);
  if (!connection) throw new Error("Google Drive is not connected. Connect it from Admin → Media first.");
  return connection;
}

async function getAccessToken(userId: string) {
  const connection = await getConnection(userId);
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_DRIVE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_DRIVE_CLIENT_SECRET || "",
      refresh_token: decryptSecret(connection.refreshTokenEncrypted),
      grant_type: "refresh_token",
    }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Google token refresh failed (${response.status})`);
  const data = await response.json() as { access_token: string };
  return { token: data.access_token, connection };
}

async function ensureFolder(userId: string, accessToken: string, currentMetadata: Record<string, unknown>) {
  const existing = typeof currentMetadata.folderId === "string" ? currentMetadata.folderId : null;
  if (existing) return existing;
  const name = process.env.GOOGLE_DRIVE_FOLDER_NAME || "Ugbanawaji Portfolio Media";
  const response = await fetch("https://www.googleapis.com/drive/v3/files?fields=id,name", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name, mimeType: "application/vnd.google-apps.folder" }),
  });
  if (!response.ok) throw new Error(`Google Drive folder creation failed (${response.status})`);
  const folder = await response.json() as { id: string };
  await db.update(storageConnections).set({ metadata: { ...currentMetadata, folderId: folder.id }, updatedAt: new Date() })
    .where(eq(storageConnections.userId, userId));
  return folder.id;
}

export class GoogleDriveStorageProvider implements StorageProvider {
  name = "GOOGLE_DRIVE" as const;
  constructor(private readonly userId: string) {}

  async upload(input: UploadInput) {
    const { token, connection } = await getAccessToken(this.userId);
    const folderId = await ensureFolder(this.userId, token, connection.metadata ?? {});
    const boundary = `ugbanawaji_${crypto.randomUUID()}`;
    const metadata = JSON.stringify({ name: input.filename, parents: [folderId] });
    const body = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: ${input.mimeType}\r\n\r\n`),
      input.buffer,
      Buffer.from(`\r\n--${boundary}--`),
    ]);
    const response = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": `multipart/related; boundary=${boundary}` },
      body,
    });
    if (!response.ok) throw new Error(`Google Drive upload failed (${response.status})`);
    const result = await response.json() as { id: string; name: string; mimeType: string; size?: string };
    return { key: result.id, metadata: result };
  }

  async read(key: string) {
    const { token } = await getAccessToken(this.userId);
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(key)}?alt=media`, {
      headers: { Authorization: `Bearer ${token}` }, cache: "no-store",
    });
    if (!response.ok) throw new Error(`Google Drive download failed (${response.status})`);
    return { body: Buffer.from(await response.arrayBuffer()), contentType: response.headers.get("content-type") || undefined };
  }

  async remove(key: string) {
    const { token } = await getAccessToken(this.userId);
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(key)}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${token}` }, cache: "no-store",
    });
    if (!response.ok && response.status !== 404) throw new Error(`Google Drive delete failed (${response.status})`);
  }
}
