"use client";
import { useEffect, useState } from "react";

type Section = { key:string; component?:string; eyebrow?:string|null; title?:string|null; description?:string|null; body?:string|null; items?:Array<{key?:string|null;value?:string|null}> };
type CopyPage = { sections: Section[] };
const emergency: CopyPage = { sections:[] };
const item=(section:Section,key:string,fallback="")=>section.items?.find(x=>x.key===key)?.value??fallback;

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const [page,setPage]=useState<CopyPage>(emergency);
  useEffect(()=>{console.error(error);void fetch("/api/site-copy/global-error",{cache:"no-store"}).then(r=>r.ok?r.json():null).then(data=>{if(data?.page?.sections?.length)setPage(data.page);}).catch(()=>undefined)},[error]);
  return <html lang="en" data-scroll-behavior="smooth"><body style={{ margin: 0, background: "#f7f7f9", color: "#17171b", fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" }}><main style={{ minHeight: "70vh", display: "grid", placeItems: "center", padding: "48px 20px" }}><div style={{ width:"min(100%, 680px)", display:"grid", gap:24 }}>{page.sections.map(section=>{
    if(section.component==="RICH_TEXT")return <section key={section.key} style={{ border:"1px solid #e4e4e7", borderRadius:20, background:"#fff", padding:28 }}><h2>{section.title}</h2>{section.description?<p>{section.description}</p>:null}{section.body?<div dangerouslySetInnerHTML={{__html:section.body}}/>:null}</section>;
    if(section.component!=="STATUS_MESSAGE")return null;
    return <section key={section.key} style={{ border: "1px solid #e4e4e7", borderRadius: 20, background: "#ffffff", padding: "clamp(28px, 6vw, 52px)" }}><div style={{ width: 44, height: 4, borderRadius: 999, background: "#ff014f", marginBottom: 28 }} />{section.eyebrow?<p style={{ margin: 0, fontSize: 12, fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase", color: "#71717a" }}>{section.eyebrow}</p>:null}{section.title?<h1 style={{ margin: "12px 0 0", fontSize: "clamp(32px, 7vw, 52px)", lineHeight: 1.05, letterSpacing: "-.04em" }}>{section.title}</h1>:null}{section.description?<p style={{ margin: "20px 0 0", maxWidth: 560, color: "#61616b", fontSize: 16, lineHeight: 1.7 }}>{section.description}</p>:null}<button type="button" onClick={reset} style={{ marginTop: 28, border: 0, borderRadius: 12, background: "#ff014f", color: "#fff", padding: "12px 18px", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>{item(section,"retryLabel")}</button></section>;
  })}</div></main></body></html>;
}
