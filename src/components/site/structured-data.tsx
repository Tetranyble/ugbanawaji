import { profile as defaultProfile } from "@/content/profile";

export function StructuredData({ profile = defaultProfile }: { profile?: typeof defaultProfile }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.displayName,
    alternateName: profile.name,
    url: profile.domain,
    image: new URL(profile.portrait, profile.domain).toString(),
    email: `mailto:${profile.email}`,
    jobTitle: profile.eyebrow,
    description: profile.headline,
    address: { "@type": "PostalAddress", addressLocality: profile.location },
    sameAs: [profile.linkedin, profile.github].filter(Boolean),
    knowsAbout: [
      "Software Engineering",
      "Financial Technology",
      "Distributed Systems",
      "Java",
      "Spring Boot",
      "Laravel",
      "Cloud Infrastructure",
      "Applied Artificial Intelligence",
    ],
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
