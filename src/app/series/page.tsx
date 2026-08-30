import Link from "next/link";
import { ArrowRight, LibraryBig } from "lucide-react";
import { getPublishedSeries, getSeriesWithPosts } from "@/lib/platform-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function SeriesIndexPage() {
  const series = await getPublishedSeries().catch(() => []);
  const enriched = await Promise.all(series.map(async (item) => {
    const data = await getSeriesWithPosts(item.slug).catch(() => null);
    return { ...item, articleCount: data?.posts.length ?? 0, firstArticle: data?.posts[0] ?? null };
  }));

  return (
    <main className="section-space">
      <div className="container-shell max-w-6xl">
        <p className="section-kicker">Reading paths</p>
        <h1 className="section-title mt-3 max-w-4xl">Technical series built around connected engineering problems.</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">Follow a topic from first principles through architecture decisions, implementation trade-offs and production lessons.</p>

        {enriched.length ? <div className="mt-10 grid gap-5 lg:grid-cols-2">{enriched.map((item) => (
          <Card key={item.id} className="group overflow-hidden shadow-none transition-colors hover:border-primary/35">
            <CardContent className="p-0">
              {item.coverImage ? <div className="aspect-[16/7] overflow-hidden border-b border-border bg-muted"><img src={item.coverImage} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" /></div> : null}
              <div className="p-6">
                <div className="flex flex-wrap items-center gap-2"><Badge>{item.articleCount} {item.articleCount === 1 ? "article" : "articles"}</Badge></div>
                <h2 className="mt-3 text-2xl font-extrabold tracking-tight"><Link href={`/series/${item.slug}`} className="hover:text-primary">{item.title}</Link></h2>
                {item.description ? <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.description}</p> : null}
                <Link href={`/series/${item.slug}`} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-primary">Explore series <ArrowRight className="size-4" /></Link>
              </div>
            </CardContent>
          </Card>
        ))}</div> : <div className="mt-10 rounded-2xl border border-dashed border-border p-10 text-center"><LibraryBig className="mx-auto size-7 text-primary" /><h2 className="mt-4 text-xl font-bold">Series are being prepared</h2><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Individual engineering notes are available in the blog while longer reading paths are being assembled.</p><Link href="/blog" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-primary">Browse engineering writing <ArrowRight className="size-4" /></Link></div>}
      </div>
    </main>
  );
}
