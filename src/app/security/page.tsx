import type { Metadata } from "next";
import { EditablePage } from "@/components/site/editable-page";
import { getSitePage } from "@/lib/data";
import { pageMetadata } from "@/lib/page-content";
export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> { return pageMetadata(await getSitePage("security")); }
export default function Page(){return <EditablePage slug="security"/>}
