import type { MetadataRoute } from "next";
import { getPublicProfile } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const profile = await getPublicProfile();
  const base = profile.domain.replace(/\/$/, "");
  return {
    rules: [{
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/", "/preview/", "/offline"],
    }],
    sitemap: `${base}/sitemap.xml`,
  };
}
