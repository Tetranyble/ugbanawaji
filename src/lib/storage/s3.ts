import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { StorageProvider, UploadInput } from "./types";

function client() {
  return new S3Client({
    region: process.env.AWS_DEFAULT_REGION || "us-east-1",
    endpoint: process.env.AWS_ENDPOINT || undefined,
    forcePathStyle: process.env.AWS_FORCE_PATH_STYLE === "true",
    credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    } : undefined,
  });
}

function bucket() {
  const value = process.env.AWS_BUCKET;
  if (!value) throw new Error("AWS_BUCKET is required when using the S3 storage provider");
  return value;
}

function publicObjectUrl(key: string) {
  const baseUrl = process.env.AWS_PUBLIC_URL?.trim().replace(/\/+$/, "");
  if (!baseUrl) return undefined;
  const encodedKey = key.split("/").map(encodeURIComponent).join("/");
  return new URL(encodedKey, `${baseUrl}/`).toString();
}

export class S3StorageProvider implements StorageProvider {
  name = "S3" as const;

  async upload(input: UploadInput) {
    const now = new Date();
    const key = `portfolio/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${input.filename}`;
    const publicUrl = publicObjectUrl(key);
    await client().send(new PutObjectCommand({ Bucket: bucket(), Key: key, Body: input.buffer, ContentType: input.mimeType }));
    return { key, publicUrl };
  }

  async read(key: string) {
    const response = await client().send(new GetObjectCommand({ Bucket: bucket(), Key: key }));
    if (!response.Body) throw new Error("S3 object has no body");
    return { body: Buffer.from(await response.Body.transformToByteArray()), contentType: response.ContentType };
  }

  async remove(key: string) {
    await client().send(new DeleteObjectCommand({ Bucket: bucket(), Key: key }));
  }
}
