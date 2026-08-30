import Link from "next/link";
import { asc, desc, eq } from "drizzle-orm";
import { FileText, Pencil, Plus, Target } from "lucide-react";
import { db } from "@/db";
import { resumeVariants, siteSettings } from "@/db/schema";
import { saveAvailabilitySettings } from "@/app/admin/actions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AvailabilityForm } from "@/components/admin/availability-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function HireAdminPage() {
  const [[setting], resumes] = await Promise.all([
    db.select().from(siteSettings).where(eq(siteSettings.key, "availability")).limit(1),
    db.select().from(resumeVariants).orderBy(desc(resumeVariants.isDefault), asc(resumeVariants.sortOrder), asc(resumeVariants.name)),
  ]);
  const availability = (setting?.value ?? {}) as Record<string, unknown>;

  return (
    <div className="max-w-6xl">
      <AdminPageHeader
        eyebrow="Recruiter mode"
        title="Hire page & résumé variants"
        description="Keep recruiter-facing information concise, current and role-specific without changing the rest of your portfolio."
        actions={<><Button asChild variant="outline"><Link href="/hire" target="_blank">View /hire</Link></Button><Button asChild><Link href="/admin/hire/resumes/new"><Plus className="size-4" /> Add résumé</Link></Button></>}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,.85fr)]">
        <Card className="shadow-none">
          <CardHeader><CardTitle>Availability</CardTitle><CardDescription>This block can be hidden entirely when you are not actively open to opportunities.</CardDescription></CardHeader>
          <CardContent>
            <AvailabilityForm availability={availability} action={saveAvailabilitySettings} />
          </CardContent>
        </Card>

        <Card className="h-fit shadow-none">
          <CardHeader><CardTitle>Recruiter-mode guidance</CardTitle><CardDescription>Keep the signal high and avoid duplicating the full portfolio.</CardDescription></CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
            <div className="flex gap-3"><Target className="mt-1 size-4 shrink-0 text-primary" /><p>Use résumé variants only when the positioning genuinely differs by role.</p></div>
            <div className="flex gap-3"><FileText className="mt-1 size-4 shrink-0 text-primary" /><p>Publish one default résumé so recruiters always have a clear first choice.</p></div>
            <p className="rounded-xl bg-muted p-4">The public /hire page already combines these variants with your strongest measurable impact and core stack.</p>
          </CardContent>
        </Card>
      </div>

      <section className="mt-10">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-extrabold">Résumé variants</h2><p className="mt-1 text-sm text-muted-foreground">{resumes.length} configured</p></div><Button asChild size="sm" variant="outline"><Link href="/admin/hire/resumes/new"><Plus className="size-3.5" /> New variant</Link></Button></div>
        {resumes.length ? <div className="grid gap-4 md:grid-cols-2">{resumes.map((resume) => <Card key={resume.id} className="shadow-none"><CardContent className="p-5"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><Badge>{resume.status === "PUBLISHED" ? "Published" : "Draft"}</Badge>{resume.isDefault ? <Badge className="border-primary/25 text-primary">Default</Badge> : null}</div><h3 className="mt-3 font-extrabold">{resume.name}</h3><p className="mt-1 text-sm text-muted-foreground">{resume.targetRole}</p>{resume.summary ? <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{resume.summary}</p> : null}</div><Button asChild size="sm" variant="outline"><Link href={`/admin/hire/resumes/${resume.id}`}><Pencil className="size-3.5" /> Edit</Link></Button></div></CardContent></Card>)}</div> : <Card className="border-dashed shadow-none"><CardContent className="flex flex-col items-center py-12 text-center"><FileText className="size-6 text-primary" /><h3 className="mt-3 font-bold">No résumé variants yet</h3><p className="mt-2 max-w-md text-sm text-muted-foreground">Add role-specific versions when they materially improve your positioning.</p><Button asChild className="mt-5"><Link href="/admin/hire/resumes/new"><Plus className="size-4" /> Add first variant</Link></Button></CardContent></Card>}
      </section>
    </div>
  );
}
