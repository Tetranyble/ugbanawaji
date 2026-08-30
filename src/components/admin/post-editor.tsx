"use client";

import Link from "next/link";
import { Save, Trash2 } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { FieldError } from "@/components/forms/field-error";
import { SubmitButton } from "@/components/forms/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { TaxonomyPicker } from "@/components/admin/taxonomy-picker";
import { MediaUrlInput } from "@/components/admin/media-url-input";
import { useAdminForm } from "@/hooks/use-admin-form";

const schema = z.object({
  title: z.string().trim().min(4, "Use at least 4 characters.").max(220),
  slug: z.string().trim().max(220).refine((value) => !value || /^[a-z0-9-]+$/.test(value), "Use lowercase letters, numbers and hyphens."),
  excerpt: z.string().trim().min(20, "Write at least 20 characters.").max(1000),
  status: z.enum(["DRAFT", "SCHEDULED", "PUBLISHED", "ARCHIVED"]),
  contentType: z.enum(["ARTICLE","ENGINEERING_NOTE","ADR","SYSTEM_DESIGN","READING_NOTE"]),
  publishedAt: z.string().max(40),
  seriesId: z.string().max(36),
  seriesOrder: z.coerce.number().int().min(0).max(10000),
  youtubeUrl: z.string().max(700).refine((value) => {
    if (!value) return true;
    try { const url = new URL(value); return ["youtube.com","www.youtube.com","m.youtube.com","music.youtube.com","youtu.be","www.youtube-nocookie.com","youtube-nocookie.com"].includes(url.hostname); } catch { return false; }
  }, "Use a valid YouTube URL."),
  seoTitle: z.string().max(220),
  seoDescription: z.string().max(320),
});
type Values = z.infer<typeof schema>;

type PostValue = {
  title?: string; slug?: string; excerpt?: string; content?: string; coverImage?: string | null; youtubeUrl?: string | null;
  categories?: string[]; tags?: string[]; status?: "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED"; contentType?: "ARTICLE"|"ENGINEERING_NOTE"|"ADR"|"SYSTEM_DESIGN"|"READING_NOTE"; seriesId?: string|null; seriesOrder?: number;
  publishedAt?: Date | string | null; publishedAtLocal?: string; seoTitle?: string | null; seoDescription?: string | null;
};

export function PostEditor({
  post = {}, postId, appTimeZone = "Africa/Lagos", action, deleteAction, previewHref, previewAction, categoryOptions = [], tagOptions = [], seriesOptions = [],
}: {
  post?: PostValue;
  postId?: string;
  appTimeZone?: string;
  action: (formData: FormData) => void | Promise<void>;
  deleteAction?: () => void | Promise<void>;
  previewHref?: string;
  previewAction?: () => void | Promise<void>;
  categoryOptions?: string[];
  tagOptions?: string[];
  seriesOptions?: Array<{ id: string; title: string }>;
}) {
  const { formRef, form, onSubmit } = useAdminForm<Values>({
    schema,
    action,
    defaultValues: {
      title: post.title ?? "",
      slug: post.slug ?? "",
      excerpt: post.excerpt ?? "",
      status: post.status ?? "DRAFT",
      contentType: post.contentType ?? "ARTICLE",
      publishedAt: post.publishedAtLocal ?? "",
      seriesId: post.seriesId ?? "",
      seriesOrder: post.seriesOrder ?? 0,
      youtubeUrl: post.youtubeUrl ?? "",
      seoTitle: post.seoTitle ?? "",
      seoDescription: post.seoDescription ?? "",
    },
  });
  const { register, formState: { errors, isSubmitting } } = form;

  return <div className="max-w-6xl">
    <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
      <div><p className="section-kicker">Writing</p><h1 className="mt-2 text-3xl font-extrabold">{post.title ? "Edit article" : "New article"}</h1></div>
      <div className="flex flex-wrap gap-2">{previewHref ? <Button asChild variant="secondary"><Link href={previewHref}>Preview</Link></Button> : null}{previewAction ? <form action={previewAction}><SubmitButton variant="outline" pendingText="Creating…">Create share preview</SubmitButton></form> : null}<Button asChild variant="outline"><Link href="/admin/posts">Back to posts</Link></Button></div>
    </div>
    <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-6">
      <Card><CardHeader><CardTitle>Article</CardTitle></CardHeader><CardContent className="space-y-5">
        <div className="space-y-2"><Label htmlFor="title">Title</Label><Input id="title" {...register("title")} aria-invalid={Boolean(errors.title)} /><FieldError message={errors.title?.message} /></div>
        <div className="space-y-2"><Label htmlFor="slug">Slug</Label><Input id="slug" {...register("slug")} placeholder="generated-from-title-if-empty" aria-invalid={Boolean(errors.slug)} /><FieldError message={errors.slug?.message} /><p className="text-xs text-muted-foreground">Lowercase letters, numbers and hyphens only.</p></div>
        <div className="space-y-2"><Label htmlFor="excerpt">Excerpt</Label><Textarea id="excerpt" {...register("excerpt")} rows={4} aria-invalid={Boolean(errors.excerpt)} /><FieldError message={errors.excerpt?.message} /></div>
        <RichTextEditor name="content" jsonName="contentJson" initialHtml={post.content ?? ""} label="Article content" autosaveKey={postId ? `post:${postId}` : "post:new"} />
      </CardContent></Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Publishing</CardTitle></CardHeader><CardContent className="space-y-5">
          <div className="space-y-2"><Label htmlFor="contentType">Content type</Label><select id="contentType" {...register("contentType")} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"><option value="ARTICLE">Article</option><option value="ENGINEERING_NOTE">Engineering Note</option><option value="ADR">Technical Decision / ADR</option><option value="SYSTEM_DESIGN">System Design</option><option value="READING_NOTE">Reading Note</option></select></div>
          <div className="space-y-2"><Label htmlFor="status">Status</Label><select id="status" {...register("status")} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"><option value="DRAFT">Draft</option><option value="SCHEDULED">Scheduled</option><option value="PUBLISHED">Published</option><option value="ARCHIVED">Archived</option></select></div>
          <div className="space-y-2"><Label htmlFor="publishedAt">Publish date & time</Label><Input id="publishedAt" type="datetime-local" {...register("publishedAt")} /><FieldError message={errors.publishedAt?.message} /><p className="text-xs text-muted-foreground">Times use {appTimeZone}. Scheduled articles become public automatically once the configured time arrives.</p></div>
          <div className="grid gap-3 sm:grid-cols-[1fr_120px]"><div className="space-y-2"><Label htmlFor="seriesId">Series / collection</Label><select id="seriesId" {...register("seriesId")} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"><option value="">No series</option>{seriesOptions.map((series)=><option key={series.id} value={series.id}>{series.title}</option>)}</select></div><div className="space-y-2"><Label htmlFor="seriesOrder">Order</Label><Input id="seriesOrder" type="number" min={0} {...register("seriesOrder", { valueAsNumber: true })}/><FieldError message={errors.seriesOrder?.message}/></div></div>
          <div className="space-y-2"><Label>Categories</Label><TaxonomyPicker name="categories" label="Categories" options={categoryOptions} initial={post.categories ?? []} max={6} placeholder="Architecture, Fintech…" /></div>
          <div className="space-y-2"><Label>Tags</Label><TaxonomyPicker name="tags" label="Tags" options={tagOptions} initial={post.tags ?? []} max={20} placeholder="Java, Reliability, Kafka…" /></div>
        </CardContent></Card>
        <Card><CardHeader><CardTitle>Media & SEO</CardTitle></CardHeader><CardContent className="space-y-5">
          <div className="space-y-2"><Label>Cover image (optional)</Label><MediaUrlInput name="coverImage" defaultValue={post.coverImage} /></div>
          <div className="space-y-2"><Label htmlFor="youtubeUrl">Featured YouTube video (optional)</Label><Input id="youtubeUrl" {...register("youtubeUrl")} placeholder="https://www.youtube.com/watch?v=…" aria-invalid={Boolean(errors.youtubeUrl)} /><FieldError message={errors.youtubeUrl?.message} /><p className="text-xs text-muted-foreground">Use this for one featured video. You can also embed additional YouTube videos directly inside the WYSIWYG editor.</p></div>
          <div className="space-y-2"><Label htmlFor="seoTitle">SEO title</Label><Input id="seoTitle" {...register("seoTitle")} aria-invalid={Boolean(errors.seoTitle)} /><FieldError message={errors.seoTitle?.message} /></div>
          <div className="space-y-2"><Label htmlFor="seoDescription">SEO description</Label><Textarea id="seoDescription" {...register("seoDescription")} rows={5} aria-invalid={Boolean(errors.seoDescription)} /><FieldError message={errors.seoDescription?.message} /></div>
        </CardContent></Card>
      </div>
      <div className="flex flex-wrap gap-3"><Button type="submit" disabled={isSubmitting}><Save className="size-4" /> {isSubmitting ? "Saving…" : "Save article"}</Button></div>
    </form>
    {deleteAction ? <form action={deleteAction} className="mt-8 border-t border-border pt-6"><ConfirmSubmitButton variant="destructive" message="Delete this article permanently?"><Trash2 className="size-4" /> Delete article</ConfirmSubmitButton></form> : null}
  </div>;
}
