import Link from "next/link";
import { ArrowRight, BriefcaseBusiness } from "lucide-react";
import { getPublishedProjects } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function WorkIndexPage() {
  const projects = await getPublishedProjects();
  return (
    <main className="section-space">
      <div className="container-shell max-w-6xl">
        <p className="section-kicker">Case studies</p>
        <h1 className="section-title mt-3 max-w-4xl">Engineering decisions, trade-offs and measurable outcomes.</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">Sanitized case studies focus on the problem-solving and engineering reasoning without exposing employer-confidential implementation details.</p>

        {projects.length ? <div className="mt-10 grid gap-6 lg:grid-cols-2">{projects.map((project) => (
          <Card key={project.id ?? project.slug} className="group flex flex-col shadow-none transition-colors hover:border-primary/35">
            <CardHeader className="flex-1">
              <div className="flex flex-wrap items-center gap-2"><Badge>{String(project.lifecycleStatus ?? "PRODUCTION").replaceAll("_", " ")}</Badge><span className="text-xs font-semibold uppercase tracking-[.12em] text-primary">{project.kind}</span></div>
              <CardTitle className="mt-3 text-2xl"><Link href={`/work/${project.slug}`} className="hover:text-primary">{project.title}</Link></CardTitle>
              <CardDescription className="mt-3 text-[15px] leading-7">{project.summary}</CardDescription>
              <div className="mt-5 flex flex-wrap gap-2">{(project.techStack ?? []).slice(0, 6).map((tech: string) => <Badge key={tech}>{tech}</Badge>)}</div>
            </CardHeader>
            <CardContent>
              {(project.metrics ?? []).length ? <div className="mb-5 grid grid-cols-2 gap-3">{(project.metrics ?? []).slice(0, 2).map((metric: { label: string; value: string }) => <div key={metric.label} className="rounded-xl bg-muted p-3"><strong className="block text-foreground">{metric.value}</strong><span className="mt-1 block text-xs text-muted-foreground">{metric.label}</span></div>)}</div> : null}
              <Link href={`/work/${project.slug}`} className="inline-flex items-center gap-2 text-sm font-bold text-primary">Read case study <ArrowRight className="size-4" /></Link>
            </CardContent>
          </Card>
        ))}</div> : <div className="mt-10 rounded-2xl border border-dashed border-border p-10 text-center"><BriefcaseBusiness className="mx-auto size-7 text-primary" /><h2 className="mt-4 text-xl font-bold">Case studies are being prepared</h2><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">The portfolio is ready for deep case studies; published work will appear here.</p></div>}
      </div>
    </main>
  );
}
