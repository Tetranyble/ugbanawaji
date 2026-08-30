"use client";

import Link from "next/link";
import { Save, Trash2 } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { FieldError } from "@/components/forms/field-error";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAdminForm } from "@/hooks/use-admin-form";

const schema = z.object({
  title: z.string().trim().min(3, "Use at least 3 characters.").max(220),
  slug: z.string().trim().max(220).refine((value) => !value || /^[a-z0-9-]+$/.test(value), "Use lowercase letters, numbers and hyphens."),
  kind: z.string().trim().min(2, "Describe the system context."),
  summary: z.string().trim().min(20, "Write at least 20 characters.").max(3000),
  lifecycleStatus: z.enum(["PRODUCTION","ACTIVE_DEVELOPMENT","RESEARCH","OPEN_SOURCE","ARCHIVED"]),
  status: z.enum(["DRAFT","PUBLISHED"]),
  externalUrl: z.string().trim().refine((value) => !value || /^https?:\/\//i.test(value), "Use an http(s) URL."),
  repoUrl: z.string().trim().refine((value) => !value || /^https?:\/\//i.test(value), "Use an http(s) URL."),
  sortOrder: z.coerce.number().int().min(-100000).max(100000),
});
type Values = z.infer<typeof schema>;

type ProjectValue = {
  title?: string; slug?: string; kind?: string; lifecycleStatus?: "PRODUCTION"|"ACTIVE_DEVELOPMENT"|"RESEARCH"|"OPEN_SOURCE"|"ARCHIVED"; summary?: string;
  problem?: string|null; constraints?: string|null; challenge?: string|null; solution?: string|null; architecture?: string|null; decisions?: string|null; tradeoffs?: string|null;
  implementation?: string|null; reliabilitySecurity?: string|null; impact?: string|null; lessonsLearned?: string|null; whatDifferently?: string|null; confidentialityNote?: string|null;
  diagrams?: Array<{title:string;mermaid:string}>|null; codeSamples?: Array<{title:string;language:string;code:string;explanation?:string}>|null;
  techStack?: string[]; metrics?: Array<{label:string; value:string}>; featured?: boolean; status?: "DRAFT"|"PUBLISHED"; externalUrl?: string|null; repoUrl?: string|null; sortOrder?: number;
};

function diagramsText(value: ProjectValue["diagrams"]) { return (value ?? []).map((item) => `${item.title}\n${item.mermaid}`).join("\n---\n"); }
function codeText(value: ProjectValue["codeSamples"]) { return (value ?? []).map((item) => `${item.title}\nlanguage: ${item.language}\n${item.code}`).join("\n---\n"); }

export function ProjectEditor({ project = {}, action, deleteAction }: { project?: ProjectValue; action: (formData: FormData)=>void|Promise<void>; deleteAction?: ()=>void|Promise<void> }) {
  const fields: Array<[string,string,string | null | undefined,string]> = [
    ["problem","Problem",project.problem,"What business/engineering problem existed before the work?"],
    ["constraints","Constraints",project.constraints,"Regulatory, legacy, scale, latency, operational or delivery constraints."],
    ["challenge","Challenge",project.challenge,"What made the problem difficult?"],
    ["solution","Approach",project.solution,"The approach you selected and why."],
    ["architecture","Architecture",project.architecture,"Service boundaries, data flow, integrations and operational shape."],
    ["decisions","Key decisions",project.decisions,"Important technical decisions and the reasoning behind them."],
    ["tradeoffs","Trade-offs",project.tradeoffs,"What you deliberately accepted, rejected or deferred."],
    ["implementation","Implementation",project.implementation,"How the design was put into production."],
    ["reliabilitySecurity","Reliability & security",project.reliabilitySecurity,"Idempotency, failure isolation, observability, security, reconciliation, recovery."],
    ["impact","Measurable outcome",project.impact,"Business and engineering impact."],
    ["lessonsLearned","Lessons learned",project.lessonsLearned,"What the work reinforced or taught you."],
    ["whatDifferently","What I’d do differently",project.whatDifferently,"A practical reflection on the next iteration."],
  ];
  const { formRef, form, onSubmit } = useAdminForm<Values>({
    schema,
    action,
    defaultValues: { title: project.title ?? "", slug: project.slug ?? "", kind: project.kind ?? "", summary: project.summary ?? "", lifecycleStatus: project.lifecycleStatus ?? "ACTIVE_DEVELOPMENT", status: project.status ?? "DRAFT", externalUrl: project.externalUrl ?? "", repoUrl: project.repoUrl ?? "", sortOrder: project.sortOrder ?? 0 },
  });
  const { register, formState: { errors, isSubmitting } } = form;

  return <div className="max-w-6xl">
    <div className="mb-7 flex flex-wrap items-center justify-between gap-3"><div><p className="section-kicker">Portfolio</p><h1 className="mt-2 text-3xl font-extrabold">{project.title ? "Edit deep case study" : "New deep case study"}</h1></div><Button asChild variant="outline"><Link href="/admin/projects">Back to projects</Link></Button></div>
    <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-6">
      <Card><CardHeader><CardTitle>Overview</CardTitle><CardDescription>Frame the system and its maturity without exposing confidential implementation detail.</CardDescription></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2"><Label htmlFor="title">Title</Label><Input id="title" {...register("title")} aria-invalid={Boolean(errors.title)} /><FieldError message={errors.title?.message}/></div>
        <div className="space-y-2"><Label htmlFor="slug">Slug</Label><Input id="slug" {...register("slug")} aria-invalid={Boolean(errors.slug)} /><FieldError message={errors.slug?.message}/></div>
        <div className="space-y-2"><Label htmlFor="kind">Type / context</Label><Input id="kind" {...register("kind")} placeholder="Production Systems · Banking" aria-invalid={Boolean(errors.kind)} /><FieldError message={errors.kind?.message}/></div>
        <div className="space-y-2"><Label htmlFor="lifecycleStatus">Project status</Label><select id="lifecycleStatus" {...register("lifecycleStatus")} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"><option value="PRODUCTION">Production</option><option value="ACTIVE_DEVELOPMENT">Active Development</option><option value="RESEARCH">Research</option><option value="OPEN_SOURCE">Open Source</option><option value="ARCHIVED">Archived</option></select></div>
        <div className="space-y-2"><Label htmlFor="confidentialityNote">Confidentiality note</Label><Input id="confidentialityNote" name="confidentialityNote" defaultValue={project.confidentialityNote ?? ""} placeholder="Sanitized case study; proprietary implementation details omitted." /></div>
        <div className="space-y-2 sm:col-span-2"><Label htmlFor="summary">Executive summary</Label><Textarea id="summary" {...register("summary")} rows={5} aria-invalid={Boolean(errors.summary)} /><FieldError message={errors.summary?.message}/></div>
      </CardContent></Card>

      <Card><CardHeader><CardTitle>Engineering narrative</CardTitle><CardDescription>Structure the case study around context, decisions, trade-offs, operational safety, outcomes and reflection.</CardDescription></CardHeader><CardContent className="grid gap-5 lg:grid-cols-2">
        {fields.map(([name,label,value,help]) => <div key={name} className="space-y-2"><Label htmlFor={name}>{label}</Label><Textarea id={name} name={name} defaultValue={value ?? ""} rows={9}/><p className="text-xs text-muted-foreground">{help}</p></div>)}
      </CardContent></Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Architecture diagrams</CardTitle><CardDescription>Mermaid source. Separate multiple diagrams with a line containing only <code>---</code>.</CardDescription></CardHeader><CardContent><Textarea name="diagrams" defaultValue={diagramsText(project.diagrams)} rows={18} /></CardContent></Card>
        <Card><CardHeader><CardTitle>Sanitized code samples</CardTitle><CardDescription>Separate samples with <code>---</code>. First line = title, second line = <code>language: java</code>.</CardDescription></CardHeader><CardContent><Textarea name="codeSamples" defaultValue={codeText(project.codeSamples)} rows={18} className="font-mono text-xs" /></CardContent></Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Technology & evidence</CardTitle></CardHeader><CardContent className="space-y-5"><div className="space-y-2"><Label htmlFor="techStack">Tech stack</Label><Input id="techStack" name="techStack" defaultValue={(project.techStack??[]).join(", ")} /></div><div className="space-y-2"><Label htmlFor="metrics">Metrics</Label><Textarea id="metrics" name="metrics" defaultValue={(project.metrics??[]).map(m=>`${m.label}: ${m.value}`).join("\n")} rows={8}/><p className="text-xs text-muted-foreground">One per line: Uptime: 99.9%</p></div></CardContent></Card>
        <Card><CardHeader><CardTitle>Publishing</CardTitle></CardHeader><CardContent className="space-y-5"><div className="space-y-2"><Label>Status</Label><select {...register("status")} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option></select></div><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="featured" defaultChecked={project.featured}/> Featured on homepage</label><div className="space-y-2"><Label>Sort order</Label><Input type="number" {...register("sortOrder", { valueAsNumber: true })}/><FieldError message={errors.sortOrder?.message}/></div><div className="space-y-2"><Label>External URL</Label><Input {...register("externalUrl")} aria-invalid={Boolean(errors.externalUrl)}/><FieldError message={errors.externalUrl?.message}/></div><div className="space-y-2"><Label>Repository URL</Label><Input {...register("repoUrl")} aria-invalid={Boolean(errors.repoUrl)}/><FieldError message={errors.repoUrl?.message}/></div></CardContent></Card>
      </div>
      <Button type="submit" disabled={isSubmitting}><Save className="size-4"/> {isSubmitting ? "Saving…" : "Save case study"}</Button>
    </form>
    {deleteAction ? <form action={deleteAction} className="mt-8 border-t border-border pt-6"><ConfirmSubmitButton variant="destructive" message="Delete this case study permanently?"><Trash2 className="size-4"/> Delete case study</ConfirmSubmitButton></form> : null}
  </div>;
}
