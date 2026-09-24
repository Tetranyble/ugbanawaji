import Link from "next/link";
import { desc } from "drizzle-orm";
import { Plus } from "lucide-react";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function ProjectsAdminPage(){const items=await db.select().from(projects).orderBy(desc(projects.sortOrder));return <div className="max-w-6xl"><div className="flex flex-col items-start gap-5 sm:flex-row sm:items-end sm:justify-between"><div className="min-w-0"><p className="section-kicker">Portfolio</p><h1 className="mt-2 break-words text-3xl font-extrabold">Projects & case studies</h1><p className="mt-2 text-muted-foreground">Keep public engineering evidence current without editing code.</p></div><Button asChild className="shrink-0"><Link href="/admin/projects/new"><Plus className="size-4"/> New project</Link></Button></div><div className="mt-8 space-y-4">{items.map(p=><Card key={p.id}><CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="break-words font-bold">{p.title}</h2><Badge>{p.status}</Badge>{p.featured?<Badge>Featured</Badge>:null}</div><p className="mt-1 break-words text-sm text-muted-foreground">{p.kind} · /work/{p.slug}</p></div><Button asChild variant="outline" size="sm" className="shrink-0"><Link href={`/admin/projects/${p.id}`}>Edit</Link></Button></CardContent></Card>)}</div></div>}
