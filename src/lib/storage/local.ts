import { mkdir, readFile, rm, writeFile } from "fs/promises";
import path from "path";
import type { StorageProvider, UploadInput } from "./types";

const root = process.env.LOCAL_STORAGE_ROOT?.trim()
  ? path.resolve(process.env.LOCAL_STORAGE_ROOT)
  : path.join(process.cwd(), ".storage", "media");

export class LocalStorageProvider implements StorageProvider {
  name = "LOCAL" as const;

  async upload(input: UploadInput) {
    const now = new Date();
    const key = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${input.filename}`;
    const target = path.join(root, key);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, input.buffer);
    return { key };
  }

  async read(key: string) {
    const safe = path.normalize(key).replace(/^(\.\.(\/|\\|$))+/, "");
    return { body: await readFile(path.join(root, safe)) };
  }

  async remove(key: string) {
    const safe = path.normalize(key).replace(/^(\.\.(\/|\\|$))+/, "");
    await rm(path.join(root, safe), { force: true });
  }
}
