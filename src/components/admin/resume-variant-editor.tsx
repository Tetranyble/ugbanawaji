"use client";

import Link from "next/link";
import { FileText, Save, Trash2 } from "lucide-react";
import { z } from "zod";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { FieldError } from "@/components/forms/field-error";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAdminForm } from "@/hooks/use-admin-form";

const schema = z.object({
  name: z.string().trim().min(2, "Name the résumé variant."),
  targetRole: z.string().trim().min(2, "Add a target role."),
  slug: z.string().trim().max(220).refine((value) => !value || /^[a-z0-9-]+$/.test(value), "Use lowercase letters, numbers and hyphens."),
  summary: z.string().max(2000),
  fileUrl: z.string().trim().min(1, "Add the résumé file path or URL."),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  sortOrder: z.coerce.number().int().min(0).max(100000),
});
type Values = z.infer<typeof schema>;

type ResumeValue = { name?: string; slug?: string; targetRole?: string; summary?: string | null; fileUrl?: string; isDefault?: boolean; status?: "DRAFT" | "PUBLISHED"; sortOrder?: number };

export function ResumeVariantEditor({ resume = {}, action, deleteAction }: { resume?: ResumeValue; action: (formData: FormData) => void | Promise<void>; deleteAction?: () => void | Promise<void> }) {
  const editing = Boolean(resume.name);
  const { formRef, form, onSubmit } = useAdminForm<Values>({
    schema,
    action,
    defaultValues: { name: resume.name ?? "", slug: resume.slug ?? "", targetRole: resume.targetRole ?? "", summary: resume.summary ?? "", fileUrl: resume.fileUrl ?? "", status: resume.status ?? "DRAFT", sortOrder: resume.sortOrder ?? 0 },
  });
  const { register, formState: { errors, isSubmitting } } = form;

  return <div className="max-w-5xl">
    <AdminPageHeader eyebrow="Recruiter mode" title={editing ? "Edit résumé variant" : "Create résumé variant"} description="Maintain role-specific résumé links without changing the main portfolio profile. Only published variants appear on /hire." actions={<Button asChild variant="outline"><Link href="/admin/hire">Back to hire settings</Link></Button>} />
    <form ref={formRef} onSubmit={onSubmit} noValidate className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,.7fr)]">
      <Card className="shadow-none"><CardHeader><CardTitle>Résumé positioning</CardTitle><CardDescription>Use one variant per audience, for example Backend Engineer, Platform Engineer, Engineering Lead or Technical Founder.</CardDescription></CardHeader><CardContent className="space-y-5">
        <div className="space-y-2"><Label htmlFor="name">Variant name</Label><Input id="name" {...register("name")} placeholder="Backend Engineer" aria-invalid={Boolean(errors.name)} /><FieldError message={errors.name?.message} /></div>
        <div className="space-y-2"><Label htmlFor="targetRole">Target role</Label><Input id="targetRole" {...register("targetRole")} placeholder="Backend / Platform Engineer" aria-invalid={Boolean(errors.targetRole)} /><FieldError message={errors.targetRole?.message} /></div>
        <div className="space-y-2"><Label htmlFor="slug">Slug</Label><Input id="slug" {...register("slug")} placeholder="backend-platform-engineer" aria-invalid={Boolean(errors.slug)} /><FieldError message={errors.slug?.message} /><p className="text-xs text-muted-foreground">Leave blank to generate it from the name.</p></div>
        <div className="space-y-2"><Label htmlFor="summary">Short description</Label><Textarea id="summary" {...register("summary")} rows={6} placeholder="Best for backend, distributed systems, fintech infrastructure and platform roles." /><FieldError message={errors.summary?.message} /></div>
        <div className="space-y-2"><Label htmlFor="fileUrl">Résumé file URL</Label><div className="relative"><FileText className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted-foreground" /><Input id="fileUrl" {...register("fileUrl")} className="pl-10" placeholder="/Leonard-Ekenekiso-CV.pdf" aria-invalid={Boolean(errors.fileUrl)} /></div><FieldError message={errors.fileUrl?.message} /><p className="text-xs leading-5 text-muted-foreground">Use a local public path or an HTTPS URL. PDF is recommended.</p></div>
      </CardContent></Card>
      <Card className="h-fit shadow-none"><CardHeader><CardTitle>Visibility</CardTitle><CardDescription>Control where this variant appears and which one is preferred.</CardDescription></CardHeader><CardContent className="space-y-5">
        <div className="space-y-2"><Label htmlFor="status">Status</Label><select id="status" {...register("status")} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option></select></div>
        <div className="space-y-2"><Label htmlFor="sortOrder">Sort order</Label><Input id="sortOrder" type="number" min={0} {...register("sortOrder", { valueAsNumber: true })} aria-invalid={Boolean(errors.sortOrder)} /><FieldError message={errors.sortOrder?.message} /></div>
        <label className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-4 text-sm"><input type="checkbox" name="isDefault" defaultChecked={Boolean(resume.isDefault)} className="mt-1 size-4 accent-[var(--primary)]" /><span><strong className="block text-foreground">Default résumé</strong><span className="mt-1 block leading-5 text-muted-foreground">Make this the preferred variant when multiple résumés are published.</span></span></label>
        <Button type="submit" className="w-full" disabled={isSubmitting}><Save className="size-4" /> {isSubmitting ? "Saving…" : editing ? "Save résumé" : "Create résumé"}</Button>
      </CardContent></Card>
    </form>
    {deleteAction ? <div className="mt-8 border-t border-border pt-6"><form action={deleteAction}><ConfirmSubmitButton variant="destructive" message="Delete this résumé variant permanently?"><Trash2 className="size-4" /> Delete résumé variant</ConfirmSubmitButton></form></div> : null}
  </div>;
}
