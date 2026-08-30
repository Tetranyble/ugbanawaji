"use client";

import { z } from "zod";
import { FieldError } from "@/components/forms/field-error";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAdminForm } from "@/hooks/use-admin-form";

const statuses = ["NEW", "REPLIED", "OPPORTUNITY", "RECRUITER", "COLLABORATION", "SPAM", "CLOSED"] as const;
const crmSchema = z.object({
  status: z.enum(statuses),
  internalNotes: z.string().max(4000, "Keep internal notes below 4,000 characters."),
});
type Values = z.infer<typeof crmSchema>;

export function ContactCrmForm({
  status,
  internalNotes,
  action,
}: {
  status: Values["status"];
  internalNotes?: string | null;
  action: (formData: FormData) => void | Promise<void>;
}) {
  const { formRef, form, onSubmit } = useAdminForm<Values>({
    schema: crmSchema,
    action,
    defaultValues: { status, internalNotes: internalNotes ?? "" },
  });
  const { register, formState: { errors, isSubmitting } } = form;

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="mt-5 grid gap-4 lg:grid-cols-[220px_1fr_auto]">
      <div>
        <select {...register("status")} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30">
          {statuses.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}
        </select>
        <FieldError message={errors.status?.message} />
      </div>
      <div><Textarea {...register("internalNotes")} rows={3} placeholder="Internal notes — never visible to the sender" aria-invalid={Boolean(errors.internalNotes)} /><FieldError message={errors.internalNotes?.message} /></div>
      <Button type="submit" variant="outline" disabled={isSubmitting}>{isSubmitting ? "Saving…" : "Save CRM"}</Button>
    </form>
  );
}
