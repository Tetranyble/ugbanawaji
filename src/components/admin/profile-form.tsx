"use client";

import type { ReactNode } from "react";
import { z } from "zod";
import { profile as defaultProfile } from "@/content/profile";
import { FieldError } from "@/components/forms/field-error";
import { ProfileAssetInput } from "@/components/admin/profile-asset-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAdminForm } from "@/hooks/use-admin-form";

const optionalUrl = z.string().trim().max(1000).refine((value) => {
  if (!value) return true;
  try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol); } catch { return false; }
}, "Use a valid http(s) URL.");

const profileSchema = z.object({
  siteName: z.string().trim().min(2, "Add the site name.").max(120),
  name: z.string().trim().min(2, "Add your full name.").max(180),
  displayName: z.string().trim().min(2, "Add a display name.").max(120),
  domain: z.string().trim().url("Use a valid website URL.").max(500),
  eyebrow: z.string().trim().min(3, "Add a positioning line.").max(220),
  headline: z.string().trim().min(10, "Add a clearer headline.").max(400),
  intro: z.string().trim().min(20, "Add a short introduction.").max(4000),
  currentFocus: z.string().trim().max(4000),
  metrics: z.string().trim().max(3000),
  about: z.string().trim().min(20, "Add at least one About paragraph.").max(12000),
  stack: z.string().trim().max(3000),
  educationDegree: z.string().trim().max(300),
  educationSchool: z.string().trim().max(300),
  educationYear: z.string().trim().max(40),
  educationCertification: z.string().trim().max(500),
  email: z.string().trim().email("Use a valid email address.").max(191),
  phone: z.string().trim().max(80),
  location: z.string().trim().max(180),
  linkedin: optionalUrl,
  github: optionalUrl,
  contactIntro: z.string().trim().max(3000),
});
type Values = z.infer<typeof profileSchema>;
type Profile = typeof defaultProfile;

export function ProfileForm({ profile: p, action }: { profile: Profile; action: (formData: FormData) => void | Promise<void> }) {
  const metricsText = p.metrics.map((item) => `${item.value} | ${item.label}`).join("\n");
  const aboutText = p.about.join("\n\n");
  const stackText = p.stack.join(", ");
  const { formRef, form, onSubmit } = useAdminForm<Values>({
    schema: profileSchema,
    action,
    defaultValues: {
      siteName: String(p.siteName), name: String(p.name), displayName: String(p.displayName), domain: String(p.domain),
      eyebrow: String(p.eyebrow), headline: String(p.headline), intro: String(p.intro), currentFocus: String(p.currentFocus),
      metrics: metricsText, about: aboutText, stack: stackText,
      educationDegree: p.education.degree, educationSchool: p.education.school, educationYear: p.education.year, educationCertification: p.education.certification,
      email: String(p.email), phone: String(p.phone), location: String(p.location), linkedin: String(p.linkedin ?? ""), github: String(p.github ?? ""), contactIntro: String(p.contactIntro ?? ""),
    },
  });
  const { register, formState: { errors, isSubmitting } } = form;

  return (
    <div className="max-w-5xl">
      <p className="section-kicker">Site content</p>
      <h1 className="mt-2 text-3xl font-extrabold">Profile & homepage</h1>
      <p className="mt-2 max-w-3xl text-muted-foreground">Update the public positioning, hero copy, focus areas, metrics, background and contact details without redeploying.</p>

      <form ref={formRef} onSubmit={onSubmit} noValidate className="mt-8 space-y-7">
        <Card>
          <CardHeader><CardTitle>Identity & hero</CardTitle><CardDescription>The first content recruiters and engineering leaders see.</CardDescription></CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <Field label="Site name" error={errors.siteName?.message}><Input {...register("siteName")} aria-invalid={Boolean(errors.siteName)} /></Field>
            <Field label="Full name" error={errors.name?.message}><Input {...register("name")} aria-invalid={Boolean(errors.name)} /></Field>
            <Field label="Display name" error={errors.displayName?.message}><Input {...register("displayName")} aria-invalid={Boolean(errors.displayName)} /></Field>
            <Field label="Canonical website URL" error={errors.domain?.message}><Input {...register("domain")} type="url" aria-invalid={Boolean(errors.domain)} /></Field>
            <Field label="Positioning line" error={errors.eyebrow?.message}><Input {...register("eyebrow")} aria-invalid={Boolean(errors.eyebrow)} /></Field>
            <Field label="Headline" className="sm:col-span-2" error={errors.headline?.message}><Textarea {...register("headline")} rows={3} aria-invalid={Boolean(errors.headline)} /></Field>
            <Field label="Introduction" className="sm:col-span-2" error={errors.intro?.message}><Textarea {...register("intro")} rows={6} aria-invalid={Boolean(errors.intro)} /></Field>
            <Field label="Current focus" className="sm:col-span-2" error={errors.currentFocus?.message}><Textarea {...register("currentFocus")} rows={6} aria-invalid={Boolean(errors.currentFocus)} /></Field>
            <ProfileAssetInput name="portrait" label="Landing page image" initialValue={String(p.portrait)} kind="image" />
            <ProfileAssetInput name="resume" label="Résumé / CV" initialValue={String(p.resume)} kind="pdf" />
          </CardContent>
        </Card>

        <Card><CardHeader><CardTitle>Impact metrics</CardTitle><CardDescription>One metric per line using <code>value | label</code>.</CardDescription></CardHeader><CardContent><Textarea {...register("metrics")} rows={6} aria-invalid={Boolean(errors.metrics)} /><FieldError message={errors.metrics?.message} /></CardContent></Card>

        <Card>
          <CardHeader><CardTitle>Focus area cards</CardTitle><CardDescription>These four cards summarize the engineering areas you work across.</CardDescription></CardHeader>
          <CardContent className="grid gap-6 lg:grid-cols-2">
            {p.specialties.map((item, index) => (
              <div key={index} className="rounded-2xl border border-border bg-muted/20 p-5">
                <p className="mb-4 text-sm font-bold text-primary">Card {index + 1}</p>
                <div className="space-y-4">
                  <Field label="Title"><Input name={`specialty_${index}_title`} defaultValue={item.title} /></Field>
                  <Field label="Description"><Textarea name={`specialty_${index}_description`} defaultValue={item.description} rows={4} /></Field>
                  <Field label="Tags (comma separated)"><Input name={`specialty_${index}_tags`} defaultValue={item.tags.join(", ")} /></Field>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>About & stack</CardTitle><CardDescription>Separate About paragraphs with a blank line.</CardDescription></CardHeader>
          <CardContent className="grid gap-5">
            <Field label="About copy" error={errors.about?.message}><Textarea {...register("about")} rows={11} aria-invalid={Boolean(errors.about)} /></Field>
            <Field label="Working stack (comma separated)" error={errors.stack?.message}><Textarea {...register("stack")} rows={4} aria-invalid={Boolean(errors.stack)} /></Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Degree" error={errors.educationDegree?.message}><Input {...register("educationDegree")} /></Field>
              <Field label="School" error={errors.educationSchool?.message}><Input {...register("educationSchool")} /></Field>
              <Field label="Year" error={errors.educationYear?.message}><Input {...register("educationYear")} /></Field>
              <Field label="Certification" error={errors.educationCertification?.message}><Input {...register("educationCertification")} /></Field>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Contact & availability</CardTitle><CardDescription>Public contact details stored with the profile in MySQL.</CardDescription></CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <Field label="Email" error={errors.email?.message}><Input {...register("email")} type="email" aria-invalid={Boolean(errors.email)} /></Field>
            <Field label="Phone" error={errors.phone?.message}><Input {...register("phone")} /></Field>
            <Field label="Location" error={errors.location?.message}><Input {...register("location")} /></Field>
            <Field label="LinkedIn" error={errors.linkedin?.message}><Input {...register("linkedin")} aria-invalid={Boolean(errors.linkedin)} /></Field>
            <Field label="GitHub (optional)" error={errors.github?.message}><Input {...register("github")} placeholder="https://github.com/…" aria-invalid={Boolean(errors.github)} /></Field>
            <Field label="Contact introduction" className="sm:col-span-2" error={errors.contactIntro?.message}><Textarea {...register("contactIntro")} rows={5} /></Field>
          </CardContent>
        </Card>

        <div className="sticky bottom-4 z-20 flex items-center justify-between gap-4 rounded-2xl border border-border bg-background/95 p-4 shadow-xl backdrop-blur">
          <p className="hidden text-xs leading-5 text-muted-foreground sm:block">Changes are stored in MySQL and reflected on the public homepage after save.</p>
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving…" : "Save homepage content"}</Button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, className = "", error, children }: { label: string; className?: string; error?: string; children?: ReactNode }) {
  return <div className={`space-y-2 ${className}`}><Label>{label}</Label>{children}<FieldError message={error} /></div>;
}
