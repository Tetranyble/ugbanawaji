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

export function ContactForm() {
  const [serverState, setServerState] = React.useState<ContactState>(initialState);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    mode: "onBlur",
    defaultValues: { name: "", email: "", subject: "", message: "", website: "" },
  });

  const submit = handleSubmit(async (_values, event) => {
    const formElement = event?.target;
    if (!(formElement instanceof HTMLFormElement)) return;
    const result = await submitContact(initialState, new FormData(formElement));
    setServerState(result);
    if (result.ok) {
      toast.success("Message sent", { description: result.message });
      reset();
    } else {
      toast.error("Message not sent", { description: result.message });
    }
  }, () => {
    toast.error("Please check the form", { description: "Fix the highlighted fields and try again." });
  });

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <FormStartedAt />
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" {...register("name")} autoComplete="name" aria-invalid={Boolean(errors.name)} />
          <FieldError message={errors.name?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" {...register("email")} type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} />
          <FieldError message={errors.email?.message} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="subject">Subject</Label>
        <Input id="subject" {...register("subject")} placeholder="What would you like to discuss?" aria-invalid={Boolean(errors.subject)} />
        <FieldError message={errors.subject?.message} />
      </div>
      <div className="hidden" aria-hidden="true">
        <Label htmlFor="website">Website</Label>
        <Input id="website" {...register("website")} tabIndex={-1} autoComplete="off" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="message">Message</Label>
        <Textarea id="message" {...register("message")} rows={7} aria-invalid={Boolean(errors.message)} />
        <FieldError message={errors.message?.message} />
      </div>
      {serverState.message ? <p role="status" className={serverState.ok ? "text-sm text-emerald-500" : "text-sm text-destructive"}>{serverState.message}</p> : null}
      <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Sending…" : "Send message"}</Button>
    </form>
  );
}
