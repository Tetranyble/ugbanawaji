import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSitePageByRoute } from "@/lib/data";
import { pageMetadata } from "@/lib/page-content";
import { PageHero } from "@/components/site/page-hero";

export const dynamic="force-dynamic";
export async function generateMetadata({params}:{params:Promise<{path:string[]}>}):Promise<Metadata>{const{path}=await params;return pageMetadata(await getSitePageByRoute(`/${path.join("/")}`))}
export default async function DatabasePage({params}:{params:Promise<{path:string[]}>}){const{path}=await params;const page=await getSitePageByRoute(`/${path.join("/")}`);if(!page)notFound();return <main className="section-space"><div className="container-shell flex flex-col gap-10">{page.sections.map(section=>{if(section.component==="PAGE_HERO")return <PageHero key={section.id} section={section}/>;if(section.component==="RICH_TEXT")return <section key={section.id} className="max-w-4xl">{section.eyebrow?<p className="section-kicker">{section.eyebrow}</p>:null}{section.title?<h2 className="mt-2 text-2xl font-extrabold">{section.title}</h2>:null}{section.description?<p className="mt-3 leading-7 text-muted-foreground">{section.description}</p>:null}{section.body?<div className="prose-portfolio mt-6" dangerouslySetInnerHTML={{__html:section.body}}/>:null}</section>;return null})}</div></main>}
