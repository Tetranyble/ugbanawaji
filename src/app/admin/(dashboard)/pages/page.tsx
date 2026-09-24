import Link from "next/link";
import { asc } from "drizzle-orm";
import { Pencil, Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/db";
import { sitePages } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function PagesAdminPage() {
  const pages = await db.select().from(sitePages).orderBy(asc(sitePages.route));
  return <div className="max-w-6xl"><AdminPageHeader eyebrow="Public content" title="Pages & sections" description="Every public route is represented here. Edit page metadata, section copy, order, visibility, repeated labels and actions without changing source code." actions={<Button asChild><Link href="/admin/pages/new"><Plus className="size-4" /> New page</Link></Button>} />
    <div className="grid gap-4 md:grid-cols-2">{pages.map((page) => <Card key={page.id} className="shadow-none"><CardContent className="flex flex-col items-start gap-4 p-5 sm:flex-row sm:justify-between"><div className="w-full min-w-0"><div className="flex min-w-0 flex-wrap items-center gap-2"><Badge className="shrink-0">{page.status}</Badge><code className="min-w-0 break-all text-xs text-muted-foreground">{page.route}</code></div><h2 className="mt-3 break-words font-extrabold">{page.title}</h2><p className="mt-1 break-all text-xs text-muted-foreground">CMS key: {page.slug}</p>{page.seoDescription ? <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{page.seoDescription}</p> : null}</div><Button asChild size="sm" variant="outline" className="shrink-0"><Link href={`/admin/pages/${page.id}`}><Pencil className="size-3.5" /> Edit</Link></Button></CardContent></Card>)}</div>
  </div>;
}
