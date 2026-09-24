"use client";
import { useEffect, useRef } from "react";

const keywords: Record<string,string[]> = {
  java:["public","private","protected","class","interface","record","return","new","if","else","for","while","try","catch","throw","throws","final","static","void","boolean","int","long","double","var","extends","implements","package","import","switch","case"],
  typescript:["const","let","var","function","return","type","interface","class","extends","implements","import","export","from","async","await","if","else","for","while","new","throw","try","catch","public","private","readonly"],
  javascript:["const","let","var","function","return","class","import","export","from","async","await","if","else","for","while","new","throw","try","catch"],
  php:["function","class","public","private","protected","return","new","if","else","foreach","while","namespace","use","extends","implements","try","catch","throw"],
  sql:["select","from","where","join","left","right","inner","outer","on","group","by","order","insert","into","update","delete","create","table","alter","index","values","and","or","not","null","as","case","when","then","else","end"],
  bash:["if","then","else","fi","for","do","done","case","esac","function","export","local"],
};

function escapeHtml(value:string){return value.replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]||c));}
function highlight(code:string, language:string){
  const escaped=escapeHtml(code); const list=keywords[language]||keywords[language==="ts"?"typescript":language==="js"?"javascript":language]||[]; if(!list.length)return escaped;
  const pattern=new RegExp(`\\b(${list.join("|")})\\b`,"gi");
  return escaped.replace(pattern,'<span class="code-keyword">$1</span>');
}

async function ensureMermaid(){
  const w=window as typeof window & { mermaid?: { initialize:(x:unknown)=>void; render:(id:string,source:string)=>Promise<{svg:string}> } };
  if(w.mermaid)return w.mermaid;
  await new Promise<void>((resolve,reject)=>{ const existing=document.querySelector<HTMLScriptElement>('script[data-mermaid]'); if(existing){existing.addEventListener("load",()=>resolve(),{once:true});existing.addEventListener("error",()=>reject(),{once:true});return;} const script=document.createElement("script"); script.src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"; script.async=true; script.dataset.mermaid="true"; script.onload=()=>resolve(); script.onerror=()=>reject(); document.head.appendChild(script); });
  const loaded=(window as typeof window & { mermaid?: { initialize:(x:unknown)=>void; render:(id:string,source:string)=>Promise<{svg:string}> } }).mermaid;
  loaded?.initialize({ startOnLoad:false, securityLevel:"strict", theme:"neutral" }); return loaded;
}

export type ArticleContentCopy = { renderingDiagram: string; codeLabel: string; copyLabel: string; copiedLabel: string };

export function ArticleContentClient({ html, copy }: { html:string; copy: ArticleContentCopy }){
  const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const root=ref.current;if(!root)return;
    const blocks=Array.from(root.querySelectorAll("pre"));
    blocks.forEach((pre,index)=>{
      if(pre.dataset.enhanced)return; pre.dataset.enhanced="true"; const code=pre.querySelector("code"); if(!code)return;
      let text=code.textContent||"";
      if(text.startsWith("mermaid\n")){
        const source=text.slice(8); const container=document.createElement("div"); container.className="mermaid-runtime rounded-xl border border-border bg-card p-4"; container.textContent=copy.renderingDiagram; pre.replaceWith(container);
        void ensureMermaid().then(async(m)=>{if(!m){container.textContent=source;return;}try{const out=await m.render(`mermaid-${Date.now()}-${index}`,source);container.innerHTML=out.svg;}catch{container.innerHTML=`<pre><code>${escapeHtml(source)}</code></pre>`;}}).catch(()=>{container.textContent=source;}); return;
      }
      let language=""; const marker=text.match(/^language:([a-zA-Z0-9+#._-]+)\n/); if(marker){language=marker[1].toLowerCase(); text=text.slice(marker[0].length); code.innerHTML=highlight(text,language); code.classList.add(`language-${language}`);}
      const wrapper=document.createElement("div"); wrapper.className="code-block-shell"; pre.parentNode?.insertBefore(wrapper,pre); wrapper.appendChild(pre);
      const toolbar=document.createElement("div"); toolbar.className="code-block-toolbar"; const label=document.createElement("span");label.textContent=language||copy.codeLabel; const button=document.createElement("button");button.type="button";button.textContent=copy.copyLabel;button.addEventListener("click",()=>{void navigator.clipboard.writeText(text).then(()=>{button.textContent=copy.copiedLabel;window.setTimeout(()=>button.textContent=copy.copyLabel,1200);});}); toolbar.append(label,button);wrapper.insertBefore(toolbar,pre);
    });
  },[html,copy]);
  return <div ref={ref} dangerouslySetInnerHTML={{__html:html}}/>;
}
