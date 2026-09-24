import type { PortfolioProfile } from "@/lib/portfolio-types";

export function StructuredData({ profile }: { profile: PortfolioProfile }) {
  if (!profile.domain || !profile.displayName) return null;
  const image = profile.portrait ? new URL(profile.portrait, profile.domain).toString() : undefined;
  const data = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.displayName,
    alternateName: profile.name,
    url: profile.domain,
    image,
    email: profile.email ? `mailto:${profile.email}` : undefined,
    jobTitle: profile.eyebrow,
    description: profile.headline,
    address: profile.location ? { "@type": "PostalAddress", addressLocality: profile.location } : undefined,
    sameAs: [profile.linkedin, profile.github].filter(Boolean),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
