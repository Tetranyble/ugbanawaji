import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { searchPublicContent } from "@/lib/platform-data";
import { getSitePage } from "@/lib/data";
import { itemValue,pageMetadata } from "@/lib/page-content";
import { PageHero } from "@/components/site/page-hero";
import { Card,CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SearchForm } from "@/components/site/search-form";
export async function generateMetadata():Promise<Metadata>{return pageMetadata(await getSitePage("search"))}
export default async function SearchPage({searchParams}:{searchParams:Promise<{q?:string}>}){const{q=""}=await searchParams;const[page,results]=await Promise.all([getSitePage("search"),searchPublicContent(q).catch(()=>[])]);if(!page)return null;return <main className="section-space"><div className="container-shell flex flex-col gap-8">{page.sections.map(section=>{if(section.component==="PAGE_HERO")return <PageHero key={section.id} section={section}/>;if(section.component!=="SEARCH")return null;return <section key={section.id}><SearchForm initialQuery={q} placeholder={itemValue(section,"placeholder")} ariaLabel={itemValue(section,"aria")} buttonLabel={itemValue(section,"button")}/>{q?<div className="mt-8"><p className="text-sm text-muted-foreground">{results.length} {results.length===1?itemValue(section,"resultSingular"):itemValue(section,"resultPlural")} {itemValue(section,"forLabel")} <strong className="text-foreground">“{q}”</strong></p><div className="mt-5 space-y-3">{results.length?results.map((r,i)=><Card key={`${r.url}-${i}`}><CardContent className="p-5"><div className="flex items-start justify-between gap-4"><div><Badge>{r.label}</Badge><h2 className="mt-3 text-xl font-bold"><Link href={r.url} className="hover:text-primary">{r.title}</Link></h2><p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{r.summary}</p></div><Search className="mt-1 size-4 shrink-0 text-primary"/></div></CardContent></Card>):<Card className="border-dashed"><CardContent className="p-8"><h2 className="text-xl font-bold">{itemValue(section,"emptyTitle")}</h2><p className="mt-2 text-muted-foreground">{itemValue(section,"emptyDescription")}</p></CardContent></Card>}</div></div>:null}</section>})}</div></main>}
