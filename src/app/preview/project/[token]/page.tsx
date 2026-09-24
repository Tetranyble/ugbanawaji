import { createHash } from "crypto";
import { and, eq, gt } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { previewTokens } from "@/db/schema";
import { getAdminProject, getSitePage } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { MermaidDiagram } from "@/components/site/mermaid-diagram";
import { CodeSample } from "@/components/site/code-sample";
import { itemValue } from "@/lib/page-content";

export const dynamic="force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function ProjectPreview({params}:{params:Promise<{token:string}>}){
  const{token}=await params;
  const hash=createHash("sha256").update(token).digest("hex");
  const[preview]=await db.select().from(previewTokens).where(and(eq(previewTokens.entityType,"PROJECT"),eq(previewTokens.tokenHash,hash),gt(previewTokens.expiresAt,new Date()))).limit(1);
  if(!preview)notFound();
  const[p,page]=await Promise.all([getAdminProject(preview.entityId),getSitePage("preview-project")]);
  if(!p||!page)notFound();
  const fields=Object.fromEntries(Object.entries(p));
  return <main className="section-space"><article className="container-shell max-w-5xl flex flex-col gap-8">{page.sections.map(section=>{
    if(section.component==="STATUS_MESSAGE")return <div key={section.id} className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">{section.title?<strong>{section.title}</strong>:null}{section.description?<> {section.description}</>:null}</div>;
    if(section.component==="PROJECT_HEADER")return <header key={section.id} className="border-b border-border pb-8"><div className="flex gap-2"><Badge>{p.kind}</Badge><Badge>{itemValue(section,p.lifecycleStatus)}</Badge></div><h1 className="mt-4 text-4xl font-extrabold sm:text-5xl">{p.title}</h1><p className="mt-4 text-lg text-muted-foreground">{p.summary}</p><div className="mt-5 flex flex-wrap gap-2">{p.techStack.map((tech)=><Badge key={tech}>{tech}</Badge>)}</div></header>;
    if(section.component==="PROJECT_NARRATIVE")return <section key={section.id} className="grid gap-6 lg:grid-cols-2">{section.items.map(item=>{const value=fields[item.key??""];if(typeof value!=="string"||!value)return null;return <div key={item.id} className="rounded-xl border border-border p-5">{item.title?<h2 className="font-bold">{item.title}</h2>:null}{item.description?<p className="mt-1 text-xs text-muted-foreground">{item.description}</p>:null}<p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{value}</p></div>})}</section>;
    if(section.component==="PROJECT_DIAGRAMS"){if(!p.diagrams?.length)return null;return <section key={section.id} className="grid gap-6">{p.diagrams.slice(0,section.itemLimit??p.diagrams.length).map((d,i)=><MermaidDiagram key={`${d.title}-${i}`} source={d.mermaid} title={d.title} defaultTitle={itemValue(section,"defaultTitle")} renderingLabel={itemValue(section,"renderingLabel")}/>)}</section>}
    if(section.component==="PROJECT_CODE"){if(!p.codeSamples?.length)return null;return <section key={section.id} className="grid gap-6">{p.codeSamples.slice(0,section.itemLimit??p.codeSamples.length).map((c,i)=><CodeSample key={`${c.title}-${i}`} {...c} copyLabel={itemValue(section,"copyLabel")} copiedLabel={itemValue(section,"copiedLabel")}/>)}</section>}
    if(section.component==="RICH_TEXT")return <section key={section.id}>{section.title?<h2 className="text-2xl font-extrabold">{section.title}</h2>:null}{section.body?<div className="prose-portfolio mt-5" dangerouslySetInnerHTML={{__html:section.body}}/>:null}</section>;
    return null;
  })}</article></main>;
}
