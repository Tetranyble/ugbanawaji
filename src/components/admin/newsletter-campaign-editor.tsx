"use client";
import Link from "next/link";
import { Save, Send } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { FieldError } from "@/components/forms/field-error";
import { SubmitButton } from "@/components/forms/submit-button";
import { useAdminForm } from "@/hooks/use-admin-form";

const schema = z.object({
  title: z.string().trim().min(3, "Add an internal title.").max(220),
  subject: z.string().trim().min(3, "Add an email subject.").max(220),
  preheader: z.string().max(320),
  slug: z.string().max(220).refine((value) => !value || /^[a-z0-9-]+$/.test(value), "Use lowercase letters, numbers and hyphens."),
  status: z.enum(["DRAFT","SCHEDULED","SENDING","SENT","PAUSED"]),
  scheduledAt: z.string().max(40),
});
type Values = z.infer<typeof schema>;
type Campaign = { title?:string; subject?:string; preheader?:string|null; content?:string; slug?:string|null; publicArchive?:boolean; status?:"DRAFT"|"SCHEDULED"|"SENDING"|"SENT"|"PAUSED"; scheduledAt?:Date|string|null; scheduledAtLocal?: string };

export function NewsletterCampaignEditor({ campaign={}, action, queueAction, retryAction, appTimeZone="Africa/Lagos" }: { campaign?:Campaign; action:(formData:FormData)=>void|Promise<void>; queueAction?:()=>void|Promise<void>; retryAction?:()=>void|Promise<void>; appTimeZone?: string }) {
  const locked = campaign.status === "SENDING" || campaign.status === "SENT";
  const { formRef, form, onSubmit } = useAdminForm<Values>({
    schema,
    action,
    defaultValues: { title: campaign.title ?? "", subject: campaign.subject ?? "", preheader: campaign.preheader ?? "", slug: campaign.slug ?? "", status: campaign.status ?? "DRAFT", scheduledAt: campaign.scheduledAtLocal ?? "" },
  });
  const { register, formState: { errors, isSubmitting } } = form;

  return <div className="max-w-5xl"><div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="section-kicker">Newsletter</p><h1 className="mt-2 text-3xl font-extrabold">{campaign.title ? "Edit campaign" : "New campaign"}</h1></div><Button asChild variant="outline"><Link href="/admin/newsletter">Back</Link></Button></div>
    <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-6"><Card><CardHeader><CardTitle>Campaign</CardTitle></CardHeader><CardContent className="space-y-5">
      <div className="space-y-2"><Label htmlFor="title">Internal title</Label><Input id="title" {...register("title")} disabled={locked} aria-invalid={Boolean(errors.title)}/><FieldError message={errors.title?.message}/></div>
      <div className="space-y-2"><Label htmlFor="subject">Email subject</Label><Input id="subject" {...register("subject")} disabled={locked} aria-invalid={Boolean(errors.subject)}/><FieldError message={errors.subject?.message}/></div>
      <div className="space-y-2"><Label htmlFor="preheader">Preheader</Label><Input id="preheader" {...register("preheader")} disabled={locked} aria-invalid={Boolean(errors.preheader)}/><FieldError message={errors.preheader?.message}/></div>
      <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="slug">Public archive slug</Label><Input id="slug" {...register("slug")} disabled={locked} aria-invalid={Boolean(errors.slug)}/><FieldError message={errors.slug?.message}/></div><label className="flex items-center gap-2 self-end pb-3 text-sm"><input type="checkbox" name="publicArchive" defaultChecked={campaign.publicArchive} disabled={locked}/> Publish this issue in the web archive after sending</label></div>
      <RichTextEditor name="content" initialHtml={campaign.content??""} label="Newsletter content" allowYoutube={false} emailMode editable={!locked} />
    </CardContent></Card>
    <Card><CardHeader><CardTitle>Delivery</CardTitle></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2">
      <div className="space-y-2"><Label htmlFor="status">Status</Label><select id="status" {...register("status")} disabled={locked} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"><option value="DRAFT">Draft</option><option value="SCHEDULED">Scheduled</option><option value="PAUSED">Paused</option>{campaign.status === "SENDING" ? <option value="SENDING">Sending</option>:null}{campaign.status === "SENT" ? <option value="SENT">Sent</option>:null}</select></div>
      <div className="space-y-2"><Label htmlFor="scheduledAt">Scheduled date & time</Label><Input id="scheduledAt" type="datetime-local" {...register("scheduledAt")} disabled={locked}/><FieldError message={errors.scheduledAt?.message}/><p className="text-xs text-muted-foreground">Times use {appTimeZone}.</p></div>
    </CardContent></Card>
    {!locked ? <Button type="submit" disabled={isSubmitting}><Save className="size-4"/> {isSubmitting ? "Saving…" : "Save campaign"}</Button> : null}
    </form>
    {retryAction && campaign.status === "SENT" ? <form action={retryAction} className="mt-4"><SubmitButton variant="outline" pendingText="Queueing…">Retry failed deliveries</SubmitButton><p className="mt-2 text-xs text-muted-foreground">Only failed recipients are reset and retried; successful deliveries are not duplicated.</p></form> : null}
    {queueAction && !locked ? <form action={queueAction} className="mt-4"><SubmitButton variant="secondary" pendingText="Queueing…"><Send className="size-4"/> Queue for delivery now</SubmitButton><p className="mt-2 text-xs text-muted-foreground">Delivery runs in batches through the protected newsletter worker endpoint.</p></form>:null}
  </div>;
}
