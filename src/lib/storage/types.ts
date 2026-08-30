export type StorageProviderName = "LOCAL" | "S3" | "GOOGLE_DRIVE";

export type UploadInput = {
  buffer: Buffer;
  filename: string;
  mimeType: string;
};

export type StoredObject = {
  key: string;
  publicUrl?: string;
  metadata?: Record<string, unknown>;
};

export interface StorageProvider {
  name: StorageProviderName;
  upload(input: UploadInput): Promise<StoredObject>;
  read(key: string): Promise<{ body: Buffer; contentType?: string }>;
  remove?(key: string): Promise<void>;
}
