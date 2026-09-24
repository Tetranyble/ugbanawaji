import type { Metadata } from "next";
import Link from "next/link";
import { getNewsletterArchive } from "@/lib/platform-data";
import { getSitePage } from "@/lib/data";
import { itemValue,pageMetadata } from "@/lib/page-content";
import { PageHero } from "@/components/site/page-hero";
import { Card,CardContent,CardHeader,CardTitle } from "@/components/ui/card";
export const dynamic="force-dynamic";
export async function generateMetadata():Promise<Metadata>{return pageMetadata(await getSitePage("newsletter-archive"))}
export default async function ArchivePage(){const[rows,page]=await Promise.all([getNewsletterArchive().catch(()=>[]),getSitePage("newsletter-archive")]);if(!page)return null;return <main className="section-space"><div className="container-shell flex flex-col gap-10">{page.sections.map(section=>{if(section.component==="PAGE_HERO")return <PageHero key={section.id} section={section}/>;if(section.component!=="NEWSLETTER_ARCHIVE")return null;return <section key={section.id} className="space-y-4">{rows.length?rows.slice(0,section.itemLimit??rows.length).map(row=><Card key={row.id}><CardHeader><CardTitle><Link className="hover:text-primary" href={`/newsletter/archive/${row.slug}`}>{row.subject}</Link></CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">{row.preheader||row.title}{row.sentAt?` · ${row.sentAt.toLocaleDateString()}`:""}</CardContent></Card>):<Card className="border-dashed"><CardContent className="p-8 text-muted-foreground">{itemValue(section,"emptyLabel")}</CardContent></Card>}</section>})}</div></main>}
