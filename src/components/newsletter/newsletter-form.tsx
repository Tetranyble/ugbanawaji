"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { subscribeNewsletter, type NewsletterState } from "@/app/newsletter/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormStartedAt } from "@/components/forms/form-started-at";
import { FieldError } from "@/components/forms/field-error";
import { newsletterSubscriberSchema } from "@/lib/validation";
import { toast } from "@/hooks/use-toast";

const initial: NewsletterState = { ok: false, message: "" };
type NewsletterValues = z.input<typeof newsletterSubscriberSchema>;
export type NewsletterFormCopy = {
  emailPlaceholder: string; emailAria: string; submitLabel: string; sendingLabel: string; privacyNote: string;
  successTitle?: string; errorTitle?: string; invalidTitle?: string; invalidDescription?: string; emailError?: string; localConfirmLabel?: string;
};

export function NewsletterForm({ compact = false, copy }: { compact?: boolean; copy: NewsletterFormCopy }) {
  const [serverState, setServerState] = React.useState<NewsletterState>(initial);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<NewsletterValues>({ resolver: zodResolver(newsletterSubscriberSchema), mode: "onBlur", defaultValues: { email: "", name: "", website: "" } });
  const submit = handleSubmit(async (_values, event) => {
    const formElement = event?.target; if (!(formElement instanceof HTMLFormElement)) return;
    const result = await subscribeNewsletter(initial, new FormData(formElement)); setServerState(result);
    if (result.ok) { toast.success(copy.successTitle ?? copy.submitLabel, { description: result.message }); if (!result.confirmationUrl) reset({ email: "", name: "", website: "" }); }
    else toast.error(copy.errorTitle ?? copy.submitLabel, { description: result.message });
  }, () => toast.error(copy.invalidTitle ?? copy.emailAria, { description: copy.invalidDescription ?? copy.emailPlaceholder }));
  return <form onSubmit={submit} noValidate className={compact ? "space-y-3" : "space-y-4"}>
    <FormStartedAt /><div className="hidden" aria-hidden="true"><Input {...register("website")} tabIndex={-1} autoComplete="off" /></div>
    <div className={compact ? "flex flex-col gap-2 sm:flex-row" : "grid gap-3 sm:grid-cols-[1fr_auto]"}><div className="min-w-0"><Input {...register("email")} type="email" autoComplete="email" placeholder={copy.emailPlaceholder} aria-label={copy.emailAria} aria-invalid={Boolean(errors.email)} /><FieldError message={errors.email ? (copy.emailError ?? copy.invalidDescription ?? copy.emailAria) : undefined} /></div><Button type="submit" disabled={isSubmitting}>{isSubmitting ? copy.sendingLabel : copy.submitLabel}</Button></div>
    {serverState.message ? <p role="status" className={serverState.ok ? "text-sm text-emerald-600 dark:text-emerald-400" : "text-sm text-destructive"}>{serverState.message}</p> : null}
    {serverState.confirmationUrl && copy.localConfirmLabel ? <Button asChild type="button" variant="outline"><a href={serverState.confirmationUrl}>{copy.localConfirmLabel}</a></Button> : null}
    {copy.privacyNote ? <p className="text-xs leading-5 text-muted-foreground">{copy.privacyNote}</p> : null}
  </form>;
}
