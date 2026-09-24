import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHero } from "@/components/site/page-hero";
import type { PublicContentType } from "@/lib/platform-data";
import { getPublishedContent } from "@/lib/platform-data";
import { getSitePage, type PublicPageSection } from "@/lib/data";
import { itemValue } from "@/lib/page-content";

const slugByType: Record<PublicContentType, string> = { PRINCIPLE:"principles", ADR:"decisions", ENGINEERING_NOTE:"notes", OPEN_SOURCE:"open-source", CODE_SAMPLE:"code", SPEAKING:"speaking", RECOMMENDATION:"recommendations", CHANGELOG:"changelog", USES:"uses", NOW:"now", READING_NOTE:"reading" };

function RichTextSection({section}:{section:PublicPageSection}){return <section>{section.eyebrow?<p className="section-kicker">{section.eyebrow}</p>:null}{section.title?<h2 className="mt-2 text-2xl font-extrabold">{section.title}</h2>:null}{section.description?<p className="mt-3 max-w-3xl leading-7 text-muted-foreground">{section.description}</p>:null}{section.body?<div className="prose-portfolio mt-6" dangerouslySetInnerHTML={{__html:section.body}}/>:null}</section>}

export async function ContentCollection({ type }: { type: PublicContentType }) {
  const [rows, page] = await Promise.all([getPublishedContent(type).catch(() => []), getSitePage(slugByType[type])]);
  if(!page)return null;
  return <main className="section-space"><div className="container-shell flex flex-col gap-10">{page.sections.map(section=>{
    if(section.component==="PAGE_HERO") return <PageHero key={section.id} section={section}/>;
    if(section.component==="RICH_TEXT") return <RichTextSection key={section.id} section={section}/>;
    if(section.component!=="CONTENT_COLLECTION") return null;
    const featuredLabel=itemValue(section,"featuredLabel"),readLabel=itemValue(section,"readLabel"),emptyTitle=itemValue(section,"emptyTitle"),emptyDescription=itemValue(section,"emptyDescription");
    return <section key={section.id}>{section.eyebrow?<p className="section-kicker">{section.eyebrow}</p>:null}{section.title?<h1 className="section-title mt-3 max-w-4xl">{section.title}</h1>:null}{section.description?<p className="mt-5 max-w-3xl leading-7 text-muted-foreground">{section.description}</p>:null}{section.body?<div className="prose-portfolio mt-8" dangerouslySetInnerHTML={{__html:section.body}}/>:null}{rows.length?<div className="mt-10 grid gap-5 lg:grid-cols-2">{rows.slice(0,section.itemLimit??rows.length).map(row=><Card key={row.id} className="group"><CardHeader><div className="flex flex-wrap items-center gap-2"><Badge>{row.featured&&featuredLabel?featuredLabel:section.eyebrow}</Badge>{row.publishedAt?<span className="text-xs text-muted-foreground">{row.publishedAt.toLocaleDateString()}</span>:null}</div><CardTitle className="mt-2 text-2xl">{row.title}</CardTitle><CardDescription>{row.summary}</CardDescription></CardHeader><CardContent><Link href={`/library/${type.toLowerCase().replaceAll("_","-")}/${row.slug}`} className="inline-flex items-center gap-2 text-sm font-semibold text-primary">{readLabel}<ArrowRight className="size-4"/></Link></CardContent></Card>)}</div>:emptyTitle||emptyDescription?<div className="mt-10 rounded-2xl border border-dashed border-border p-8">{emptyTitle?<h2 className="text-xl font-bold">{emptyTitle}</h2>:null}{emptyDescription?<p className="mt-2 text-muted-foreground">{emptyDescription}</p>:null}</div>:null}</section>;
  })}</div></main>;
}
