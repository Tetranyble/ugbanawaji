"use client";
import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

type Section = { key:string; component?:string; eyebrow?:string|null; title?:string|null; description?:string|null; body?:string|null; items?:Array<{key?:string|null;value?:string|null}> };
type CopyPage = { sections: Section[] };
const emergency: CopyPage = { sections:[] };
const item=(section:Section,key:string,fallback="")=>section.items?.find(x=>x.key===key)?.value??fallback;

export default function ErrorPage({error,reset}:{error:Error&{digest?:string};reset:()=>void}){
  const [page,setPage]=useState<CopyPage>(emergency);
  useEffect(()=>{console.error(error);void fetch("/api/site-copy/error",{cache:"no-store"}).then(r=>r.ok?r.json():null).then(data=>{if(data?.page?.sections?.length)setPage(data.page);}).catch(()=>undefined)},[error]);
  return <main className="section-space"><div className="container-shell max-w-2xl flex flex-col gap-8">{page.sections.map(section=>{
    if(section.component==="RICH_TEXT")return <section key={section.key}>{section.title?<h2 className="text-2xl font-extrabold">{section.title}</h2>:null}{section.description?<p className="mt-3 text-muted-foreground">{section.description}</p>:null}{section.body?<div className="prose-portfolio mt-5" dangerouslySetInnerHTML={{__html:section.body}}/>:null}</section>;
    if(section.component!=="STATUS_MESSAGE")return null;
    return <section key={section.key} className="text-center"><AlertTriangle className="mx-auto size-11 text-primary"/>{section.eyebrow?<p className="section-kicker mt-5">{section.eyebrow}</p>:null}{section.title?<h1 className="mt-3 text-4xl font-extrabold">{section.title}</h1>:null}{section.description?<p className="mt-4 leading-7 text-muted-foreground">{section.description}</p>:null}<Button className="mt-7" onClick={reset}>{item(section,"retryLabel")}</Button></section>;
  })}</div></main>;
}
