import { getPublicProfile, getPublishedPosts, getSitePage } from "@/lib/data";
import { itemValue } from "@/lib/page-content";

function cdata(value:string){return value.replace(/]]>/g,"]]]]><![CDATA[>");}
export async function GET(request:Request){
  const segment=new URL(request.url).pathname.split("/").pop()??"";
  const topic=decodeURIComponent(segment.replace(/\.xml$/, ""));
  const [profile,posts,chrome]=await Promise.all([getPublicProfile(),getPublishedPosts(),getSitePage("site-chrome")]);
  const needle=topic.toLowerCase();
  const filtered=posts.filter((p)=>[...(p.categories??[]),...(p.tags??[])].some((x:string)=>x.toLowerCase()===needle||x.toLowerCase().replace(/\s+/g,"-")===needle));
  const base=profile.domain.replace(/\/$/,"");
  const feedCopy=chrome?.sectionMap.feeds;
  const titleTemplate=itemValue(feedCopy,"titleTemplate");
  const title=titleTemplate.replace("{name}",profile.displayName).replace("{title}",topic);
  const description=itemValue(feedCopy,"topicDescriptionTemplate").replace("{topic}",topic);
  const xml=`<?xml version="1.0" encoding="UTF-8" ?><rss version="2.0"><channel><title><![CDATA[${cdata(title)}]]></title><link>${base}/blog</link><description><![CDATA[${cdata(description)}]]></description>${filtered.map((p)=>`<item><title><![CDATA[${cdata(p.title)}]]></title><link>${base}/blog/${p.slug}</link><guid>${base}/blog/${p.slug}</guid><description><![CDATA[${cdata(p.excerpt)}]]></description><pubDate>${(p.publishedAt??p.createdAt).toUTCString()}</pubDate></item>`).join("\n")}</channel></rss>`;
  return new Response(xml,{headers:{"Content-Type":"application/rss+xml; charset=utf-8","Cache-Control":"s-maxage=3600, stale-while-revalidate=86400"}})
}
