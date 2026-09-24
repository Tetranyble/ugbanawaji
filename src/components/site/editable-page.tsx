import { notFound } from "next/navigation";
import { getSitePage } from "@/lib/data";
import { PageHero } from "@/components/site/page-hero";

export async function EditablePage({ slug }: { slug: string }) {
  const page = await getSitePage(slug); if (!page) notFound();
  return <main className="section-space"><div className="container-shell max-w-4xl">{page.sections.map((section) => {
    if (section.component === "PAGE_HERO") return <PageHero key={section.id} section={section} />;
    if (section.component === "RICH_TEXT") return <section key={section.id} className="mt-10">{section.eyebrow ? <p className="section-kicker">{section.eyebrow}</p> : null}{section.title ? <h2 className="mt-2 text-2xl font-extrabold">{section.title}</h2> : null}{section.description ? <p className="mt-3 leading-7 text-muted-foreground">{section.description}</p> : null}{section.body ? <div className="prose-portfolio mt-6" dangerouslySetInnerHTML={{ __html: section.body }} /> : null}</section>;
    return null;
  })}</div></main>;
}
