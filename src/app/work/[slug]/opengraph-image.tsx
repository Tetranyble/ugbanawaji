import { ImageResponse } from "next/og";
import { getPublishedProject, getPublicProfile, getSitePage } from "@/lib/data";
import { itemValue } from "@/lib/page-content";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [project, profile, page] = await Promise.all([getPublishedProject(slug), getPublicProfile(), getSitePage("project-detail")]);
  const header=page?.sectionMap.header;
  let siteHost = profile.siteName;
  try { siteHost = new URL(profile.domain).hostname.replace(/^www\./, ""); } catch {}
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 64, background: "#0b1020", color: "white", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 28, fontWeight: 700 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: "#ff014f" }} />
        <span>{profile.displayName}</span>
        <span style={{ color: "#94a3b8", fontSize: 22 }}>· {itemValue(header,"ogLabel",profile.eyebrow)}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ fontSize: 58, fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.03em", maxWidth: 1040 }}>{project?.title ?? itemValue(header,"ogFallbackTitle",profile.headline)}</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 22, color: "#cbd5e1" }}>
          <span>{siteHost}</span>
          <span>{project?.kind ?? itemValue(header,"ogFallbackKind",profile.eyebrow)}</span>
        </div>
      </div>
    </div>,
    size,
  );
}
