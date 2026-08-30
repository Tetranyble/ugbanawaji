import { articleHeadings } from "@/lib/article-html";
export async function ArticleToc({content,format="HTML"}:{content:string;format?:"HTML"|"MARKDOWN"}){
  const headings=await articleHeadings(content,format); if(headings.length<2)return null;
  return <aside className="hidden lg:block"><div className="sticky top-28 rounded-2xl border border-border bg-card p-4"><p className="text-xs font-extrabold uppercase tracking-[.12em] text-primary">On this page</p><nav className="mt-3 space-y-2">{headings.map(h=><a key={h.id} href={`#${h.id}`} className="block text-sm leading-5 text-muted-foreground hover:text-primary" style={{paddingLeft:(h.level-2)*12}}>{h.text}</a>)}</nav></div></aside>
}
