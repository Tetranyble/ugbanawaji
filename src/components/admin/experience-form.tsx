"use client";

import { Save, Trash2 } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { FieldError } from "@/components/forms/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAdminForm } from "@/hooks/use-admin-form";

const schema = z.object({
  role: z.string().trim().min(2, "Add a role."),
  company: z.string().trim().min(2, "Add a company."),
  location: z.string().trim().min(2, "Add a location."),
  startDate: z.string().trim().min(2, "Add a start date."),
  endDate: z.string().max(80),
  summary: z.string().trim().min(20, "Write at least 20 characters."),
  highlights: z.string().max(20000),
  impactAreas: z.string().max(2000),
  sortOrder: z.coerce.number().int().min(-100000).max(100000),
});
type Values = z.infer<typeof schema>;

type ExperienceValue = { company?:string; role?:string; location?:string; startDate?:string; endDate?:string|null; current?:boolean; summary?:string; highlights?:string[]; impactAreas?:string[]|null; sortOrder?:number };

export function ExperienceForm({ value={}, action, deleteAction, compact=false }:{value?:ExperienceValue; action:(fd:FormData)=>void|Promise<void>; deleteAction?:()=>void|Promise<void>; compact?:boolean}){
  const { formRef, form, onSubmit } = useAdminForm<Values>({
    schema,
    action,
    defaultValues: {
      role: value.role ?? "",
      company: value.company ?? "",
      location: value.location ?? "",
      startDate: value.startDate ?? "",
      endDate: value.endDate ?? "",
      summary: value.summary ?? "",
      highlights: (value.highlights ?? []).join("\n"),
      impactAreas: (value.impactAreas ?? []).join(", "),
      sortOrder: value.sortOrder ?? 0,
    },
  });
  const { register, formState: { errors, isSubmitting } } = form;

  return <div><form ref={formRef} onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
    <div className="space-y-2"><Label>Role</Label><Input {...register("role")} aria-invalid={Boolean(errors.role)}/><FieldError message={errors.role?.message}/></div>
    <div className="space-y-2"><Label>Company</Label><Input {...register("company")} aria-invalid={Boolean(errors.company)}/><FieldError message={errors.company?.message}/></div>
    <div className="space-y-2"><Label>Location</Label><Input {...register("location")} aria-invalid={Boolean(errors.location)}/><FieldError message={errors.location?.message}/></div>
    <div className="grid gap-3 sm:grid-cols-2"><div className="min-w-0 space-y-2"><Label>Start</Label><Input {...register("startDate")} placeholder="Apr 2024" aria-invalid={Boolean(errors.startDate)}/><FieldError message={errors.startDate?.message}/></div><div className="min-w-0 space-y-2"><Label>End</Label><Input {...register("endDate")} placeholder="Present"/><FieldError message={errors.endDate?.message}/></div></div>
    <div className="space-y-2 sm:col-span-2"><Label>Summary</Label><Textarea {...register("summary")} rows={compact?3:5} aria-invalid={Boolean(errors.summary)}/><FieldError message={errors.summary?.message}/></div>
    <div className="space-y-2 sm:col-span-2"><Label>Highlights</Label><Textarea {...register("highlights")} rows={compact?5:8}/><FieldError message={errors.highlights?.message}/><p className="text-xs text-muted-foreground">One achievement per line.</p></div>
    <div className="space-y-2 sm:col-span-2"><Label>Impact areas</Label><Input {...register("impactAreas")} placeholder="Financial Infrastructure, Platform Reliability, Engineering Leadership, Cloud & DevOps, Applied AI"/><FieldError message={errors.impactAreas?.message}/><p className="text-xs text-muted-foreground">Comma-separated. Used by the public Experience → Impact view.</p></div>
    <div className="space-y-2"><Label>Sort order</Label><Input type="number" {...register("sortOrder", { valueAsNumber: true })} aria-invalid={Boolean(errors.sortOrder)}/><FieldError message={errors.sortOrder?.message}/></div>
    <label className="flex items-center gap-2 self-end pb-3 text-sm"><input type="checkbox" name="current" defaultChecked={value.current}/> Current role</label>
    <div className="sm:col-span-2"><Button type="submit" disabled={isSubmitting}><Save className="size-4"/> {isSubmitting ? "Saving…" : "Save"}</Button></div>
  </form>{deleteAction?<form action={deleteAction} className="mt-4"><ConfirmSubmitButton variant="destructive" size="sm" message="Delete this experience entry permanently?"><Trash2 className="size-4"/> Delete</ConfirmSubmitButton></form>:null}</div>;
}
