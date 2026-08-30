import { marked } from "marked";
import { sanitizePostHtml } from "@/lib/content";
import { slugify } from "@/lib/utils";

export async function articleHtml(content: string, format: "HTML"|"MARKDOWN" = "HTML") {
  const raw = format === "MARKDOWN" ? await marked.parse(content) : content;
  const clean = sanitizePostHtml(raw);
  const seen = new Map<string, number>();
  return clean.replace(/<(h[2-4])([^>]*)>([\s\S]*?)<\/\1>/gi, (full, tag: string, attrs: string, inner: string) => {
    const text = inner.replace(/<[^>]*>/g, "").replace(/&[^;]+;/g, " ").trim();
    let id = slugify(text || "section") || "section"; const count = seen.get(id) ?? 0; seen.set(id,count+1); if (count) id = `${id}-${count+1}`;
    const safeAttrs = attrs.replace(/\sid=(['"]).*?\1/i, "");
    return `<${tag}${safeAttrs} id="${id}">${inner}</${tag}>`;
  });
}

export async function articleHeadings(content: string, format: "HTML"|"MARKDOWN" = "HTML") {
  const html = await articleHtml(content, format); const headings: Array<{ id:string; text:string; level:number }> = [];
  html.replace(/<h([2-4])[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/gi, (_full, level, id, inner) => { headings.push({ id, level:Number(level), text:String(inner).replace(/<[^>]*>/g, "").trim() }); return _full; });
  return headings;
}
