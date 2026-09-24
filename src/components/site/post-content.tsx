import { articleHtml } from "@/lib/article-html";
import { ArticleContentClient } from "@/components/site/article-content-client";
import { getSitePage } from "@/lib/data";
import { itemValue } from "@/lib/page-content";

export async function PostContent({ content, format = "HTML" }: { content: string; format?: "HTML" | "MARKDOWN" }) {
  const [html, chrome] = await Promise.all([articleHtml(content, format), getSitePage("site-chrome")]);
  const section = chrome?.sectionMap.article;
  return <ArticleContentClient html={html} copy={{
    renderingDiagram: itemValue(section, "renderingDiagram"),
    codeLabel: itemValue(section, "codeLabel"),
    copyLabel: itemValue(section, "copyLabel"),
    copiedLabel: itemValue(section, "copiedLabel"),
  }}/>;
}
