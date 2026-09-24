import type { Metadata } from "next";
import Link from "next/link";
import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSitePage } from "@/lib/data";
import { actionTarget,pageMetadata,sectionAction } from "@/lib/page-content";
export async function generateMetadata():Promise<Metadata>{return pageMetadata(await getSitePage("offline"))}
export default async function OfflinePage(){const page=await getSitePage("offline");if(!page)return null;return <main className="section-space"><div className="container-shell max-w-2xl flex flex-col gap-8">{page.sections.map(section=>{if(section.component==="STATUS_MESSAGE"){const action=sectionAction(section,"home");return <section key={section.id} className="text-center"><WifiOff className="mx-auto size-10 text-primary"/>{section.eyebrow?<p className="section-kicker mt-5">{section.eyebrow}</p>:null}{section.title?<h1 className="mt-5 text-4xl font-extrabold">{section.title}</h1>:null}{section.description?<p className="mt-4 leading-7 text-muted-foreground">{section.description}</p>:null}{action?<Button asChild className="mt-7"><Link href={action.href} {...actionTarget(action)}>{action.label}</Link></Button>:null}</section>}if(section.component==="RICH_TEXT")return <section key={section.id}>{section.title?<h2 className="text-2xl font-extrabold">{section.title}</h2>:null}{section.body?<div className="prose-portfolio mt-5" dangerouslySetInnerHTML={{__html:section.body}}/>:null}</section>;return null})}</div></main>}
