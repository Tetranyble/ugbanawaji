"use client";

import type { ReactNode } from "react";
import { z } from "zod";
import { FieldError } from "@/components/forms/field-error";
import { ProfileAssetInput } from "@/components/admin/profile-asset-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAdminForm } from "@/hooks/use-admin-form";
import type { PortfolioProfile } from "@/lib/portfolio-types";

const optionalUrl = z.string().trim().max(1000).refine((value) => {
  if (!value) return true;
  if (value.startsWith("/")) return true;
  try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol); } catch { return false; }
}, "Use a valid http(s) URL or site-relative path.");

const profileSchema = z.object({
  siteName: z.string().trim().min(2, "Add the site name.").max(120),
  name: z.string().trim().min(2, "Add your full name.").max(180),
  displayName: z.string().trim().min(2, "Add a display name.").max(160),
  domain: z.string().trim().url("Use a valid website URL.").max(500),
  eyebrow: z.string().trim().min(2, "Add your public role.").max(180),
  headline: z.string().trim().min(10, "Add a clear headline.").max(320),
  intro: z.string().trim().min(20, "Add a short introduction.").max(5000),
  currentFocus: z.string().trim().max(5000),
  email: z.string().trim().email("Use a valid email address.").max(191),
  phone: z.string().trim().max(80),
  location: z.string().trim().max(180),
  linkedin: optionalUrl,
  github: optionalUrl,
  resume: optionalUrl,
  portrait: optionalUrl,
  contactIntro: z.string().trim().max(5000),
});
type Values = z.infer<typeof profileSchema>;

export function ProfileForm({ profile, action }: { profile: PortfolioProfile; action: (formData: FormData) => void | Promise<void> }) {
  const { formRef, form, onSubmit } = useAdminForm<Values>({
    schema: profileSchema,
    action,
    defaultValues: {
      siteName: profile.siteName,
      name: profile.name,
      displayName: profile.displayName,
      domain: profile.domain,
      eyebrow: profile.eyebrow,
      headline: profile.headline,
      intro: profile.intro,
      currentFocus: profile.currentFocus,
      email: profile.email,
      phone: profile.phone,
      location: profile.location,
      linkedin: profile.linkedin,
      github: profile.github,
      resume: profile.resume,
      portrait: profile.portrait,
      contactIntro: profile.contactIntro,
    },
  });
  const { register, formState: { errors, isSubmitting } } = form;

  return (
    <div className="max-w-5xl">
      <p className="section-kicker">Site identity</p>
      <h1 className="mt-2 text-3xl font-extrabold">Profile</h1>
      <p className="mt-2 max-w-3xl text-muted-foreground">Edit the identity, hero positioning, public contact details and assets used across the site. Homepage sections, skills and supporting content have their own editors.</p>

      <form ref={formRef} onSubmit={onSubmit} noValidate className="mt-8 space-y-7">
        <Card>
          <CardHeader><CardTitle>Identity & hero</CardTitle><CardDescription>Your current public positioning. Keep the role simple and let the work provide the evidence.</CardDescription></CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <Field label="Site name" error={errors.siteName?.message}><Input {...register("siteName")} /></Field>
            <Field label="Full name" error={errors.name?.message}><Input {...register("name")} /></Field>
            <Field label="Display name" error={errors.displayName?.message}><Input {...register("displayName")} /></Field>
            <Field label="Canonical website URL" error={errors.domain?.message}><Input {...register("domain")} type="url" /></Field>
            <Field label="Role / eyebrow" className="sm:col-span-2" error={errors.eyebrow?.message}><Input {...register("eyebrow")} /></Field>
            <Field label="Headline" className="sm:col-span-2" error={errors.headline?.message}><Textarea {...register("headline")} rows={3} /></Field>
            <Field label="Introduction" className="sm:col-span-2" error={errors.intro?.message}><Textarea {...register("intro")} rows={6} /></Field>
            <Field label="Current focus" className="sm:col-span-2" error={errors.currentFocus?.message}><Textarea {...register("currentFocus")} rows={5} /></Field>
            <ProfileAssetInput name="portrait" label="Landing page image" initialValue={profile.portrait} kind="image" />
            <ProfileAssetInput name="resume" label="Default résumé / CV" initialValue={profile.resume} kind="pdf" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Contact</CardTitle><CardDescription>Public contact and profile links.</CardDescription></CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <Field label="Email" error={errors.email?.message}><Input {...register("email")} type="email" /></Field>
            <Field label="Phone" error={errors.phone?.message}><Input {...register("phone")} /></Field>
            <Field label="Location" error={errors.location?.message}><Input {...register("location")} /></Field>
            <Field label="LinkedIn" error={errors.linkedin?.message}><Input {...register("linkedin")} /></Field>
            <Field label="GitHub" className="sm:col-span-2" error={errors.github?.message}><Input {...register("github")} /></Field>
            <Field label="Contact introduction" className="sm:col-span-2" error={errors.contactIntro?.message}><Textarea {...register("contactIntro")} rows={5} /></Field>
          </CardContent>
        </Card>

        <div className="sticky bottom-4 z-20 flex min-w-0 flex-col items-stretch gap-4 rounded-2xl border border-border bg-background/95 p-4 shadow-xl backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <p className="hidden text-xs leading-5 text-muted-foreground sm:block">Saved profile changes are used across the public site and metadata.</p>
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving…" : "Save profile"}</Button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, className = "", error, children }: { label: string; className?: string; error?: string; children?: ReactNode }) {
  return <div className={`space-y-2 ${className}`}><Label>{label}</Label>{children}<FieldError message={error} /></div>;
}
