import type { PublicPageSection } from "@/lib/data";

export function PageHero({ section, className = "" }: { section: PublicPageSection | null | undefined; className?: string }) {
  if (!section) return null;
  return <header className={className}>{section.eyebrow ? <p className="section-kicker">{section.eyebrow}</p> : null}<h1 className="section-title mt-3 max-w-4xl">{section.title}</h1>{section.description ? <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">{section.description}</p> : null}{section.body ? <div className="prose-portfolio mt-8 max-w-3xl" dangerouslySetInnerHTML={{ __html: section.body }} /> : null}</header>;
}
