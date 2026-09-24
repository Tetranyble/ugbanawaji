import { getPublicProfile, getSitePage } from "@/lib/data";
import { itemValue } from "@/lib/page-content";

export const dynamic = "force-dynamic";

export async function GET() {
  const [profile, chrome] = await Promise.all([getPublicProfile(), getSitePage("site-chrome")]);
  const section = chrome?.sectionMap.securityTxt;
  const base = profile.domain.replace(/\/$/, "");
  const policyPath = itemValue(section, "policyPath");
  const preferredLanguages = itemValue(section, "preferredLanguages");
  const contactLabel = itemValue(section, "contactLabel");
  const preferredLanguagesLabel = itemValue(section, "preferredLanguagesLabel");
  const canonicalLabel = itemValue(section, "canonicalLabel");
  const policyLabel = itemValue(section, "policyLabel");
  const expiresLabel = itemValue(section, "expiresLabel");
  const expires = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString();
  const body = [
    `${contactLabel}: mailto:${profile.email}`,
    `${preferredLanguagesLabel}: ${preferredLanguages}`,
    `${canonicalLabel}: ${base}/.well-known/security.txt`,
    `${policyLabel}: ${base}${policyPath.startsWith("/") ? policyPath : `/${policyPath}`}`,
    `${expiresLabel}: ${expires}`,
  ].join("\n") + "\n";
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=86400" } });
}
