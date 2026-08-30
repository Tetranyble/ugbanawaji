import type { StorageProvider, StorageProviderName } from "./types";
import { LocalStorageProvider } from "./local";
import { S3StorageProvider } from "./s3";
import { GoogleDriveStorageProvider } from "./google-drive";
import { env } from "@/lib/env";

export function defaultStorageProvider(): StorageProviderName {
  const disk = env.storage.disk;
  if (disk === "s3") return "S3";
  if (disk === "google_drive" || disk === "drive") return "GOOGLE_DRIVE";
  return "LOCAL";
}

export function getStorageProvider(name: StorageProviderName, userId?: string): StorageProvider {
  if (name === "S3") return new S3StorageProvider();
  if (name === "GOOGLE_DRIVE") {
    if (!userId) throw new Error("A user is required for Google Drive storage");
    return new GoogleDriveStorageProvider(userId);
  }
  return new LocalStorageProvider();
}
