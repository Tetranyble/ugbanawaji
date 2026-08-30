"use client";

import Link from "next/link";
import { Save, Trash2 } from "lucide-react";
import { z } from "zod";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { MediaUrlInput } from "@/components/admin/media-url-input";
import { FieldError } from "@/components/forms/field-error";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAdminForm } from "@/hooks/use-admin-form";

const schema = z.object({
  title: z.string().trim().min(3, "Use at least 3 characters.").max(220),
  slug: z.string().trim().max(220).refine((value) => !value || /^[a-z0-9-]+$/.test(value), "Use lowercase letters, numbers and hyphens."),
  description: z.string().max(3000),
  status: z.enum(["DRAFT", "PUBLISHED"]),
});
type Values = z.infer<typeof schema>;

type SeriesValue = { title?: string; slug?: string; description?: string | null; coverImage?: string | null; status?: "DRAFT" | "PUBLISHED" };

export function SeriesEditor({ series = {}, action, deleteAction }: { series?: SeriesValue; action: (formData: FormData) => void | Promise<void>; deleteAction?: () => void | Promise<void> }) {
  const editing = Boolean(series.title);
  const { formRef, form, onSubmit } = useAdminForm<Values>({
    schema,
    action,
    defaultValues: { title: series.title ?? "", slug: series.slug ?? "", description: series.description ?? "", status: series.status ?? "DRAFT" },
  });
  const { register, formState: { errors, isSubmitting } } = form;

  return <div className="max-w-5xl">
    <AdminPageHeader eyebrow="Publishing" title={editing ? "Edit article series" : "Create article series"} description="Build curated reading paths around a technical subject. A series stays private until you publish it." actions={<Button asChild variant="outline"><Link href="/admin/series">Back to series</Link></Button>} />
    <form ref={formRef} onSubmit={onSubmit} noValidate className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,.65fr)]">
      <Card className="shadow-none"><CardHeader><CardTitle>Series details</CardTitle><CardDescription>Keep the title and description focused enough that a visitor immediately understands the learning path.</CardDescription></CardHeader><CardContent className="space-y-5">
        <div className="space-y-2"><Label htmlFor="title">Title</Label><Input id="title" {...register("title")} placeholder="Building Financial Infrastructure" aria-invalid={Boolean(errors.title)} /><FieldError message={errors.title?.message} /></div>
        <div className="space-y-2"><Label htmlFor="slug">Slug</Label><Input id="slug" {...register("slug")} placeholder="building-financial-infrastructure" aria-invalid={Boolean(errors.slug)} /><FieldError message={errors.slug?.message} /><p className="text-xs leading-5 text-muted-foreground">Leave blank to generate it from the title.</p></div>
        <div className="space-y-2"><Label htmlFor="description">Description</Label><Textarea id="description" {...register("description")} rows={7} placeholder="A practical series on reliability, ledgers, integrations and operational correctness in financial systems." /><FieldError message={errors.description?.message} /></div>
      </CardContent></Card>
      <div className="space-y-6"><Card className="shadow-none"><CardHeader><CardTitle>Publishing</CardTitle><CardDescription>Draft series are visible only in the CMS.</CardDescription></CardHeader><CardContent className="space-y-5">
        <div className="space-y-2"><Label htmlFor="status">Status</Label><select id="status" {...register("status")} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option></select></div>
        <div className="space-y-2"><Label>Cover image</Label><MediaUrlInput name="coverImage" defaultValue={series.coverImage ?? ""} /></div>
        <Button type="submit" className="w-full" disabled={isSubmitting}><Save className="size-4" /> {isSubmitting ? "Saving…" : editing ? "Save series" : "Create series"}</Button>
      </CardContent></Card></div>
    </form>
    {deleteAction ? <div className="mt-8 border-t border-border pt-6"><p className="mb-3 text-sm text-muted-foreground">Deleting a series does not delete its articles. They become ungrouped.</p><form action={deleteAction}><ConfirmSubmitButton variant="destructive" message="Delete this series? Its articles will remain published but ungrouped."><Trash2 className="size-4" /> Delete series</ConfirmSubmitButton></form></div> : null}
  </div>;
}
