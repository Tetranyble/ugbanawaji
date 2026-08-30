import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { getPublicPortfolioData } from "@/lib/data";
import { getPublishedResumes } from "@/lib/platform-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function HirePage() {
  const [data, resumes, [setting]] = await Promise.all([
    getPublicPortfolioData(),
    getPublishedResumes().catch(() => []),
    db.select().from(siteSettings).where(eq(siteSettings.key, "availability")).limit(1).catch(() => []),
  ]);

  const availability = (setting?.value ?? {}) as Record<string, unknown>;
  const profile = data.profile;

  return (
    <main className="section-space">
      <div className="container-shell">
        <p className="section-kicker">Work with Leonard</p>
        <h1 className="section-title mt-3 max-w-4xl">
          Engineering for systems where reliability, correctness and operational clarity matter.
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">{String(profile.intro)}</p>

        {availability.visible ? (
          <Card className="mt-8 border-primary/25">
            <CardContent className="p-6">
              <p className="text-sm font-bold text-primary">{String(availability.status ?? "Open to the right opportunity")}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {Array.isArray(availability.targetRoles)
                  ? availability.targetRoles.map((role) => <Badge key={String(role)}>{String(role)}</Badge>)
                  : null}
                {Array.isArray(availability.workModes)
                  ? availability.workModes.map((mode) => <Badge key={String(mode)}>{String(mode)}</Badge>)
                  : null}
              </div>
              {availability.relocation ? (
                <p className="mt-3 text-sm text-muted-foreground">Relocation: {String(availability.relocation)}</p>
              ) : null}
              {availability.note ? (
                <p className="mt-2 text-sm text-muted-foreground">{String(availability.note)}</p>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Selected outcomes</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {(profile.metrics as Array<{ value: string; label: string }>).map((metric) => (
                <div key={metric.label} className="flex items-baseline justify-between gap-5 border-b border-border pb-3">
                  <span className="text-sm text-muted-foreground">{metric.label}</span>
                  <strong className="text-primary">{metric.value}</strong>
                </div>
              ))}
              <Button asChild className="mt-3"><Link href="/work">Read case studies</Link></Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Core stack</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(profile.stack as string[]).map((item) => <Badge key={item}>{item}</Badge>)}
              </div>
              <Button asChild variant="secondary" className="mt-6">
                <Link href={`mailto:${profile.email}`}>Contact me</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <section className="mt-12">
          <h2 className="text-2xl font-extrabold">Résumé variants</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {resumes.length ? resumes.map((resume) => (
              <Card key={resume.id}>
                <CardHeader><CardTitle>{resume.name}</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{resume.summary || resume.targetRole}</p>
                  <Button asChild variant="outline" className="mt-4">
                    <Link href={resume.fileUrl} target="_blank">Open résumé</Link>
                  </Button>
                </CardContent>
              </Card>
            )) : (
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground">Use the main résumé while role-specific variants are prepared.</p>
                  <Button asChild variant="outline" className="mt-4">
                    <Link href={String(profile.resume)} target="_blank">Open résumé</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
