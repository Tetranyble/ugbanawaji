import type { MetadataRoute } from "next";
import { getPublicProfile, getSitePage } from "@/lib/data";
import { itemValue } from "@/lib/page-content";

export const dynamic = "force-dynamic";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const [profile, chrome] = await Promise.all([getPublicProfile(), getSitePage("site-chrome")]);
  const nameTemplate = itemValue(chrome?.sectionMap.manifest, "nameTemplate");
  return {
    name: nameTemplate.replace("{name}", profile.displayName || profile.siteName),
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
