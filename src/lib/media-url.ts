import { env } from "@/lib/env";

function appBaseUrl() {
  return env.appUrl.endsWith("/") ? env.appUrl : `${env.appUrl}/`;
}

export function absoluteMediaUrl(id: string, publicUrl?: string | null) {
  const value = publicUrl?.trim();
  if (value) return new URL(value).toString();
  return new URL(`/api/media/${encodeURIComponent(id)}`, appBaseUrl()).toString();
}
