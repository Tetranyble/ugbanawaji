"use client";

import { z } from "zod";
import { FieldError } from "@/components/forms/field-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAdminForm } from "@/hooks/use-admin-form";

const availabilitySchema = z.object({
  visible: z.boolean(),
  availabilityStatus: z.string().trim().min(3, "Add a short availability status.").max(120),
  targetRoles: z.string().trim().min(3, "Add at least one target role.").max(400),
  workModes: z.string().trim().min(2, "Add at least one work mode.").max(200),
  relocation: z.string().trim().max(300),
  availabilityNote: z.string().trim().max(1200, "Keep the note below 1,200 characters."),
});

type Values = z.infer<typeof availabilitySchema>;

type Availability = {
  visible?: unknown;
  status?: unknown;
  targetRoles?: unknown;
  workModes?: unknown;
  relocation?: unknown;
  note?: unknown;
};

export function AvailabilityForm({
  availability,
  action,
}: {
  availability: Availability;
  action: (formData: FormData) => void | Promise<void>;
}) {
  const { formRef, form, onSubmit } = useAdminForm<Values>({
    schema: availabilitySchema,
    action,
    defaultValues: {
      visible: Boolean(availability.visible),
      availabilityStatus: String(availability.status ?? "Open to the right opportunity"),
      targetRoles: Array.isArray(availability.targetRoles) ? availability.targetRoles.join(", ") : "Backend Engineer, Platform Engineer, Engineering Lead",
      workModes: Array.isArray(availability.workModes) ? availability.workModes.join(", ") : "Remote, Hybrid",
      relocation: String(availability.relocation ?? ""),
      availabilityNote: String(availability.note ?? ""),
    },
  });
  const { register, formState: { errors, isSubmitting } } = form;

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-5">
      <label className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-4 text-sm">
        <input type="checkbox" {...register("visible")} className="mt-1 size-4 accent-[var(--primary)]" />
        <span><strong className="block text-foreground">Show availability publicly</strong><span className="mt-1 block leading-5 text-muted-foreground">When disabled, /hire still works but does not announce your job-search status.</span></span>
      </label>
      <div className="space-y-2"><Label htmlFor="availabilityStatus">Status</Label><Input id="availabilityStatus" {...register("availabilityStatus")} aria-invalid={Boolean(errors.availabilityStatus)} /><FieldError message={errors.availabilityStatus?.message} /></div>
      <div className="space-y-2"><Label htmlFor="targetRoles">Target roles</Label><Input id="targetRoles" {...register("targetRoles")} aria-invalid={Boolean(errors.targetRoles)} /><FieldError message={errors.targetRoles?.message} /><p className="text-xs text-muted-foreground">Comma-separated.</p></div>
      <div className="space-y-2"><Label htmlFor="workModes">Work modes</Label><Input id="workModes" {...register("workModes")} aria-invalid={Boolean(errors.workModes)} /><FieldError message={errors.workModes?.message} /><p className="text-xs text-muted-foreground">Comma-separated.</p></div>
      <div className="space-y-2"><Label htmlFor="relocation">Relocation</Label><Input id="relocation" {...register("relocation")} placeholder="Open to Europe / Canada for the right role" aria-invalid={Boolean(errors.relocation)} /><FieldError message={errors.relocation?.message} /></div>
      <div className="space-y-2"><Label htmlFor="availabilityNote">Note</Label><Textarea id="availabilityNote" {...register("availabilityNote")} rows={5} placeholder="A short recruiter-facing note about the kind of problems and teams you are interested in." aria-invalid={Boolean(errors.availabilityNote)} /><FieldError message={errors.availabilityNote?.message} /></div>
      <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving…" : "Save availability"}</Button>
    </form>
  );
}
