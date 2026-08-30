import { notFound } from "next/navigation";
import Link from "next/link";
import { getNewsletterArchiveEntry } from "@/lib/platform-data";
import { PostContent } from "@/components/site/post-content";
export const dynamic="force-dynamic";
export default async function IssuePage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;let row=null;try{row=await getNewsletterArchiveEntry(slug)}catch{}if(!row)notFound();return <main className="section-space"><article className="container-shell max-w-4xl"><Link href="/newsletter/archive" className="text-sm text-muted-foreground">← Newsletter archive</Link><header className="mt-8 border-b border-border pb-8"><p className="section-kicker">Engineering letter</p><h1 className="mt-3 text-4xl font-extrabold sm:text-5xl">{row.subject}</h1>{row.preheader?<p className="mt-4 text-lg text-muted-foreground">{row.preheader}</p>:null}</header><div className="prose-portfolio mt-10"><PostContent content={row.content}/></div></article></main>}
