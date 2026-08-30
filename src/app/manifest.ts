import type { MetadataRoute } from "next";
import { getPublicProfile } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const profile = await getPublicProfile();
  return {
    name: `${profile.displayName} — Engineering Portfolio`,
    short_name: profile.siteName,
    description: profile.eyebrow,
    start_url: "/",
    display: "standalone",
    background_color: "#212428",
    theme_color: "#ff014f",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
