"use client";

import Link from "next/link";
import { Save, Trash2 } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { FieldError } from "@/components/forms/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { useAdminForm } from "@/hooks/use-admin-form";

export const contentTypeLabels = {
  PRINCIPLE:"Engineering Principle", ADR:"Technical Decision / ADR", ENGINEERING_NOTE:"Engineering Note", OPEN_SOURCE:"Open Source", CODE_SAMPLE:"Code Sample", SPEAKING:"Speaking / Teaching", RECOMMENDATION:"Recommendation", CHANGELOG:"Changelog", USES:"Uses", NOW:"Now", READING_NOTE:"Reading Note",
} as const;

type Type = keyof typeof contentTypeLabels;
type Value = { id?:string; type?:Type; title?:string; slug?:string; summary?:string|null; content?:string|null; data?:Record<string,unknown>; status?:"DRAFT"|"PUBLISHED"|"ARCHIVED"; featured?:boolean; sortOrder?:number };

const schema = z.object({
  type: z.enum(Object.keys(contentTypeLabels) as [Type, ...Type[]]),
  title: z.string().trim().min(2, "Add a title.").max(220),
  slug: z.string().trim().min(1, "Add a slug.").max(220).regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and hyphens."),
  summary: z.string().max(3000),
  data: z.string().refine((value) => { try { JSON.parse(value || "{}"); return true; } catch { return false; } }, "Structured metadata must be valid JSON."),
  status: z.enum(["DRAFT","PUBLISHED","ARCHIVED"]),
  sortOrder: z.coerce.number().int().min(-100000).max(100000),
});
type Values = z.infer<typeof schema>;

export function ContentEntryEditor({entry={},action,deleteAction}:{entry?:Value;action:(formData:FormData)=>void|Promise<void>;deleteAction?:()=>void|Promise<void>}){
  const { formRef, form, onSubmit } = useAdminForm<Values>({
    schema,
    action,
    defaultValues: {
      type: entry.type ?? "ENGINEERING_NOTE",
      title: entry.title ?? "",
      slug: entry.slug ?? "",
      summary: entry.summary ?? "",
      data: JSON.stringify(entry.data ?? {}, null, 2),
      status: entry.status ?? "DRAFT",
      sortOrder: entry.sortOrder ?? 0,
    },
  });
  const { register, formState: { errors, isSubmitting } } = form;

  return <div className="max-w-6xl"><div className="mb-7 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between"><div className="min-w-0"><p className="section-kicker">Knowledge base</p><h1 className="mt-2 break-words text-3xl font-extrabold">{entry.id?"Edit content":"New structured content"}</h1></div><Button asChild variant="outline" className="shrink-0"><Link href="/admin/content">Back</Link></Button></div>
    <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-6">
      <Card><CardHeader><CardTitle>Content identity</CardTitle><CardDescription>This CMS powers the engineering-principles, ADR, open-source, speaking, now, uses, reading and changelog sections.</CardDescription></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2"><Label>Type</Label><select {...register("type")} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm">{Object.entries(contentTypeLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></div>
        <div className="space-y-2"><Label>Slug</Label><Input {...register("slug")} aria-invalid={Boolean(errors.slug)}/><FieldError message={errors.slug?.message}/></div>
        <div className="space-y-2 sm:col-span-2"><Label>Title</Label><Input {...register("title")} aria-invalid={Boolean(errors.title)}/><FieldError message={errors.title?.message}/></div>
        <div className="space-y-2 sm:col-span-2"><Label>Summary</Label><Textarea {...register("summary")} rows={4}/><FieldError message={errors.summary?.message}/></div>
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Body</CardTitle></CardHeader><CardContent><RichTextEditor name="content" initialHtml={entry.content??""} autosaveKey={`content:${entry.id??"new"}`} label="Rich content"/></CardContent></Card>
      <div className="grid gap-6 lg:grid-cols-2"><Card><CardHeader><CardTitle>Structured metadata</CardTitle><CardDescription>Optional JSON for type-specific data such as speaker role, repository URL, testimonial author, book author, event URL or code language.</CardDescription></CardHeader><CardContent><Textarea {...register("data")} rows={14} className="font-mono text-xs" aria-invalid={Boolean(errors.data)}/><FieldError message={errors.data?.message}/></CardContent></Card>
      <Card><CardHeader><CardTitle>Publishing</CardTitle></CardHeader><CardContent className="space-y-5"><div className="space-y-2"><Label>Status</Label><select {...register("status")} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option><option value="ARCHIVED">Archived</option></select></div><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="featured" defaultChecked={entry.featured}/> Feature this entry</label><div className="space-y-2"><Label>Sort order</Label><Input type="number" {...register("sortOrder", { valueAsNumber: true })} aria-invalid={Boolean(errors.sortOrder)}/><FieldError message={errors.sortOrder?.message}/></div></CardContent></Card></div>
      <Button type="submit" disabled={isSubmitting}><Save className="size-4"/> {isSubmitting ? "Saving…" : "Save content"}</Button>
    </form>
    {deleteAction?<form action={deleteAction} className="mt-8 border-t border-border pt-6"><ConfirmSubmitButton variant="destructive" message="Delete this content entry permanently?"><Trash2 className="size-4"/> Delete</ConfirmSubmitButton></form>:null}
  </div>;
}
