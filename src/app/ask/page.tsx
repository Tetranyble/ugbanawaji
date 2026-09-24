import type { Metadata } from "next";
import { AskPageView } from "@/components/site/ask-page";
import { getSitePage } from "@/lib/data";
import { pageMetadata } from "@/lib/page-content";
export async function generateMetadata():Promise<Metadata>{return pageMetadata(await getSitePage("ask"))}
export default function AskPage(){return <AskPageView/>}
