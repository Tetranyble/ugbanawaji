import Link from "next/link";
import { asc, desc, eq, sql } from "drizzle-orm";
import { Plus, Pencil, LibraryBig } from "lucide-react";
import { db } from "@/db";
import { postSeries, posts } from "@/db/schema";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function SeriesPage() {
  const rows = await db
    .select({
      id: postSeries.id,
      title: postSeries.title,
      slug: postSeries.slug,
      description: postSeries.description,
      coverImage: postSeries.coverImage,
      status: postSeries.status,
      updatedAt: postSeries.updatedAt,
      postCount: sql<number>`count(${posts.id})`.mapWith(Number),
    })
    .from(postSeries)
    .leftJoin(posts, eq(posts.seriesId, postSeries.id))
    .groupBy(postSeries.id)
    .orderBy(desc(postSeries.updatedAt), asc(postSeries.title));

  return (
    <div className="max-w-6xl">
      <AdminPageHeader
        eyebrow="Publishing"
        title="Article series & collections"
        description="Create deliberate reading paths around your strongest engineering themes instead of leaving related articles disconnected."
        actions={<Button asChild><Link href="/admin/series/new"><Plus className="size-4" /> New series</Link></Button>}
      />

      {rows.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {rows.map((row) => (
            <Card key={row.id} className="group overflow-hidden shadow-none transition-colors hover:border-primary/35">
              <CardContent className="p-0">
                {row.coverImage ? <div className="aspect-[16/5] overflow-hidden border-b border-border bg-muted"><img src={row.coverImage} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.015]" /></div> : null}
                <div className="p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2"><Badge>{row.status === "PUBLISHED" ? "Published" : "Draft"}</Badge><span className="text-xs text-muted-foreground">{row.postCount} {row.postCount === 1 ? "article" : "articles"}</span></div>
                      <h2 className="mt-3 text-xl font-extrabold tracking-tight">{row.title}</h2>
                      <p className="mt-1 truncate text-xs text-muted-foreground">/series/{row.slug}</p>
                    </div>
                    <Button asChild size="sm" variant="outline"><Link href={`/admin/series/${row.id}`}><Pencil className="size-3.5" /> Edit</Link></Button>
                  </div>
                  {row.description ? <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted-foreground">{row.description}</p> : <p className="mt-4 text-sm italic text-muted-foreground">No description yet.</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed shadow-none">
          <CardContent className="flex flex-col items-center px-6 py-14 text-center">
            <div className="grid size-12 place-items-center rounded-2xl bg-muted"><LibraryBig className="size-5 text-primary" /></div>
            <h2 className="mt-4 text-lg font-bold">No article series yet</h2>
            <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">Start with one strong theme such as Building Financial Infrastructure, Applied AI in Regulated Systems or Java Architecture Notes.</p>
            <Button asChild className="mt-5"><Link href="/admin/series/new"><Plus className="size-4" /> Create first series</Link></Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
