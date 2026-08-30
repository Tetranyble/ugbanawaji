import { articleHtml } from "@/lib/article-html";
import { ArticleContentClient } from "@/components/site/article-content-client";
export async function PostContent({ content, format = "HTML" }: { content: string; format?: "HTML" | "MARKDOWN" }) {
  const html = await articleHtml(content, format);
  return <ArticleContentClient html={html}/>;
}
