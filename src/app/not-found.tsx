import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSitePage } from "@/lib/data";
import { actionTarget } from "@/lib/page-content";

export default async function NotFound() {
  const page = await getSitePage("not-found");
  if(!page)return null;
  return <main className="section-space"><div className="container-shell max-w-2xl flex flex-col gap-8">{page.sections.map(section=>{
    if(section.component==="STATUS_MESSAGE")return <section key={section.id} className="text-center"><SearchX className="mx-auto size-11 text-primary"/>{section.eyebrow?<p className="section-kicker mt-5">{section.eyebrow}</p>:null}{section.title?<h1 className="mt-3 text-4xl font-extrabold">{section.title}</h1>:null}{section.description?<p className="mt-4 leading-7 text-muted-foreground">{section.description}</p>:null}<div className="mt-7 flex justify-center gap-3">{section.actions.map(action=><Button key={action.id} asChild variant={action.variant==="PRIMARY"?"default":action.variant==="SECONDARY"?"secondary":action.variant==="GHOST"?"ghost":action.variant==="LINK"?"link":"outline"}><Link href={action.href} {...actionTarget(action)}>{action.label}</Link></Button>)}</div></section>;
    if(section.component==="RICH_TEXT")return <section key={section.id}>{section.title?<h2 className="text-2xl font-extrabold">{section.title}</h2>:null}{section.body?<div className="prose-portfolio mt-5" dangerouslySetInnerHTML={{__html:section.body}}/>:null}</section>;
    return null;
  })}</div></main>;
}
