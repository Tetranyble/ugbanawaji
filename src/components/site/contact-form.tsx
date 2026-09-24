"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { submitContact, type ContactState } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormStartedAt } from "@/components/forms/form-started-at";
import { FieldError } from "@/components/forms/field-error";
import { contactSchema } from "@/lib/validation";
import { toast } from "@/hooks/use-toast";

const initialState: ContactState = { ok: false, message: "" };
type ContactValues = z.input<typeof contactSchema>;
export type ContactFormCopy = {
  nameLabel: string; emailLabel: string; subjectLabel: string; subjectPlaceholder: string;
  messageLabel: string; submitLabel: string; sendingLabel: string; websiteLabel?: string;
  successTitle: string; errorTitle: string; invalidTitle: string; invalidDescription: string;
  nameError: string; emailError: string; subjectError: string; messageError: string;
};

export function ContactForm({ copy }: { copy: ContactFormCopy }) {
  const [serverState, setServerState] = React.useState<ContactState>(initialState);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ContactValues>({
    resolver: zodResolver(contactSchema), mode: "onBlur", defaultValues: { name: "", email: "", subject: "", message: "", website: "" },
  });
  const submit = handleSubmit(async (_values, event) => {
    const formElement = event?.target; if (!(formElement instanceof HTMLFormElement)) return;
    const result = await submitContact(initialState, new FormData(formElement)); setServerState(result);
    if (result.ok) { toast.success(copy.successTitle, { description: result.message }); reset(); }
    else toast.error(copy.errorTitle, { description: result.message });
  }, () => toast.error(copy.invalidTitle, { description: copy.invalidDescription }));

  return <form onSubmit={submit} noValidate className="space-y-5">
    <FormStartedAt />
    <div className="grid gap-5 sm:grid-cols-2">
      <div className="space-y-2"><Label htmlFor="name">{copy.nameLabel}</Label><Input id="name" {...register("name")} autoComplete="name" aria-invalid={Boolean(errors.name)} /><FieldError message={errors.name ? copy.nameError : undefined} /></div>
      <div className="space-y-2"><Label htmlFor="email">{copy.emailLabel}</Label><Input id="email" {...register("email")} type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} /><FieldError message={errors.email ? copy.emailError : undefined} /></div>
    </div>
    <div className="space-y-2"><Label htmlFor="subject">{copy.subjectLabel}</Label><Input id="subject" {...register("subject")} placeholder={copy.subjectPlaceholder} aria-invalid={Boolean(errors.subject)} /><FieldError message={errors.subject ? copy.subjectError : undefined} /></div>
    <div className="hidden" aria-hidden="true"><Label htmlFor="website">{copy.websiteLabel ?? ""}</Label><Input id="website" {...register("website")} tabIndex={-1} autoComplete="off" /></div>
    <div className="space-y-2"><Label htmlFor="message">{copy.messageLabel}</Label><Textarea id="message" {...register("message")} rows={7} aria-invalid={Boolean(errors.message)} /><FieldError message={errors.message ? copy.messageError : undefined} /></div>
    {serverState.message ? <p role="status" className={serverState.ok ? "text-sm text-emerald-500" : "text-sm text-destructive"}>{serverState.message}</p> : null}
    <Button type="submit" disabled={isSubmitting}>{isSubmitting ? copy.sendingLabel : copy.submitLabel}</Button>
  </form>;
}
