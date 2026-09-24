import type { ReactNode } from "react";
import {
  createPageSection,
  createPageSectionAction,
  createPageSectionItem,
  deletePageSection,
  deletePageSectionAction,
  deletePageSectionItem,
  deleteSitePage,
  updatePageSection,
  updatePageSectionAction,
  updatePageSectionItem,
  updateSitePage,
} from "@/app/admin/actions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const sectionComponents = [
  "HOME_HERO", "HOME_SNAPSHOT", "PAGE_HERO", "FOCUS_AREAS", "FEATURED_PROJECTS", "PROJECT_LIST",
  "PRINCIPLES", "CURRENT_PROJECTS", "EXPERIENCE", "ABOUT", "BACKGROUND_CARD", "WRITING", "ASK_AI", "CONTACT",
  "BLOG_FILTERS", "POST_LIST", "EMPTY_STATE", "NEWSLETTER_SIGNUP", "SERIES_LIST", "ASK_CHAT", "AVAILABILITY",
  "SKILL_GROUPS", "RESUME_LIST", "CONTENT_COLLECTION", "RICH_TEXT", "SEARCH", "NEWSLETTER_ARCHIVE", "STATUS_MESSAGE",
  "NEWSLETTER_UNSUBSCRIBE", "PROJECT_HEADER", "PROJECT_METRICS", "PROJECT_NARRATIVE", "PROJECT_DIAGRAMS", "PROJECT_CODE", "RELATED_POSTS",
  "RELATED_PROJECTS", "POST_HEADER", "POST_BODY", "SERIES_HEADER", "SERIES_POSTS", "NEWSLETTER_ISSUE", "NEWSLETTER_BODY", "PAGE_ACTIONS", "LIBRARY_ENTRY", "LIBRARY_BODY",
  "SITE_HEADER", "MOBILE_NAV", "THEME_TOGGLE", "SITE_FOOTER", "SYSTEM_COPY",
] as const;

type PageValue = {
  id: string;
  slug: string;
  route: string;
  title: string;
  seoTitle: string | null;
  seoDescription: string | null;
  status: "DRAFT" | "PUBLISHED";
  sections: Array<{
    id: string;
    pageId: string;
    key: string;
    component: string;
    eyebrow: string | null;
    title: string | null;
    description: string | null;
    body: string | null;
    enabled: boolean;
    sortOrder: number;
    itemLimit: number | null;
    items: Array<{
      id: string;
      key: string | null;
      title: string | null;
      subtitle: string | null;
      description: string | null;
      value: string | null;
      href: string | null;
      icon: string | null;
      enabled: boolean;
      sortOrder: number;
    }>;
    actions: Array<{
      id: string;
      key: string | null;
      label: string;
      href: string;
      variant: "PRIMARY" | "SECONDARY" | "OUTLINE" | "GHOST" | "LINK";
      external: boolean;
      enabled: boolean;
      sortOrder: number;
    }>;
  }>;
};

export function PageEditor({ page }: { page: PageValue }) {
  return <div className="max-w-6xl">
    <AdminPageHeader
      eyebrow="Editable page"
      title={page.title}
      description="Every public section on this route is database-backed. Edit copy, order, visibility, repeated text items and actions here."
    />

    <Card className="shadow-none">
      <CardHeader><CardTitle>Page metadata</CardTitle><CardDescription>Route identity and SEO metadata.</CardDescription></CardHeader>
      <CardContent>
        <form action={updateSitePage.bind(null, page.id)} className="grid gap-5">
          <div className="grid gap-5 md:grid-cols-2"><Field label="Slug"><Input name="slug" defaultValue={page.slug} required /></Field><Field label="Route"><Input name="route" defaultValue={page.route} required /></Field></div>
          <Field label="Internal title"><Input name="title" defaultValue={page.title} required /></Field>
          <div className="grid gap-5 md:grid-cols-2"><Field label="SEO title"><Input name="seoTitle" defaultValue={page.seoTitle ?? ""} /></Field><Field label="Status"><select name="status" defaultValue={page.status} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"><option value="PUBLISHED">Published</option><option value="DRAFT">Draft</option></select></Field></div>
          <Field label="SEO description"><Textarea name="seoDescription" rows={3} defaultValue={page.seoDescription ?? ""} /></Field>
          <Button type="submit" className="w-fit">Save page</Button>
        </form>
      </CardContent>
    </Card>

    <section className="mt-8 space-y-5">
      <div><h2 className="text-xl font-extrabold">Sections</h2><p className="mt-1 text-sm text-muted-foreground">Sort order controls placement. Disable a section without deleting its content.</p></div>
      <Card className="border-dashed shadow-none"><CardHeader><CardTitle>Add section</CardTitle></CardHeader><CardContent><SectionForm action={createPageSection.bind(null, page.id)} /></CardContent></Card>

      {page.sections.map((section) => <details key={section.id} className="rounded-2xl border border-border bg-card" open>
        <summary className="cursor-pointer list-none px-6 py-5 font-extrabold"><span className="text-primary">{section.key}</span> <span className="ml-2 text-sm font-medium text-muted-foreground">{section.component}</span></summary>
        <div className="border-t border-border p-6">
          <SectionForm value={section} action={updatePageSection.bind(null, section.id, page.id)} />
          <form action={deletePageSection.bind(null, section.id, page.id)} className="mt-4"><ConfirmSubmitButton variant="destructive" size="sm" message="Delete this section and all its items/actions?">Delete section</ConfirmSubmitButton></form>

          <div className="mt-8 grid gap-6 xl:grid-cols-2">
            <div>
              <h3 className="font-extrabold">Section items</h3>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">Use items for editable labels, repeated snapshot values, template headings and component-specific text.</p>
              <Card className="mt-4 border-dashed shadow-none"><CardContent className="p-4"><ItemForm action={createPageSectionItem.bind(null, section.id, page.id)} /></CardContent></Card>
              <div className="mt-4 space-y-4">{section.items.map((item) => <Card key={item.id} className="shadow-none"><CardContent className="p-4"><ItemForm value={item} action={updatePageSectionItem.bind(null, item.id, page.id)} /><form action={deletePageSectionItem.bind(null, item.id, page.id)} className="mt-3"><ConfirmSubmitButton variant="destructive" size="sm" message="Delete this item?">Delete item</ConfirmSubmitButton></form></CardContent></Card>)}</div>
            </div>

            <div>
              <h3 className="font-extrabold">Section actions</h3>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">Buttons and links are independent records so labels, targets and variants stay editable.</p>
              <Card className="mt-4 border-dashed shadow-none"><CardContent className="p-4"><ActionForm action={createPageSectionAction.bind(null, section.id, page.id)} /></CardContent></Card>
              <div className="mt-4 space-y-4">{section.actions.map((action) => <Card key={action.id} className="shadow-none"><CardContent className="p-4"><ActionForm value={action} action={updatePageSectionAction.bind(null, action.id, page.id)} /><form action={deletePageSectionAction.bind(null, action.id, page.id)} className="mt-3"><ConfirmSubmitButton variant="destructive" size="sm" message="Delete this action?">Delete action</ConfirmSubmitButton></form></CardContent></Card>)}</div>
            </div>
          </div>
        </div>
      </details>)}
    </section>

    <form action={deleteSitePage.bind(null, page.id)} className="mt-10"><ConfirmSubmitButton variant="destructive" message="Delete this page and all sections?">Delete page</ConfirmSubmitButton></form>
  </div>;
}

export function NewPageForm({ action }: { action: (fd: FormData) => void | Promise<void> }) {
  return <div className="max-w-4xl"><AdminPageHeader eyebrow="Editable page" title="New page" description="Create the route metadata first, then add and order sections." /><Card className="shadow-none"><CardContent className="p-6"><form action={action} className="grid gap-5"><div className="grid gap-5 md:grid-cols-2"><Field label="Slug"><Input name="slug" required /></Field><Field label="Route"><Input name="route" placeholder="/new-page" required /></Field></div><Field label="Internal title"><Input name="title" required /></Field><div className="grid gap-5 md:grid-cols-2"><Field label="SEO title"><Input name="seoTitle" /></Field><Field label="Status"><select name="status" defaultValue="DRAFT" className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option></select></Field></div><Field label="SEO description"><Textarea name="seoDescription" rows={3} /></Field><Button type="submit" className="w-fit">Create page</Button></form></CardContent></Card></div>;
}

function SectionForm({ value, action }: { value?: PageValue["sections"][number]; action: (fd: FormData) => void | Promise<void> }) {
  return <form action={action} className="grid gap-4"><div className="grid gap-4 md:grid-cols-3"><Field label="Key"><Input name="key" required defaultValue={value?.key ?? ""} /></Field><Field label="Component"><select name="component" defaultValue={value?.component ?? "RICH_TEXT"} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm">{sectionComponents.map((item) => <option key={item} value={item}>{item}</option>)}</select></Field><Field label="Sort order"><Input name="sortOrder" type="number" defaultValue={value?.sortOrder ?? 0} /></Field></div><div className="grid gap-4 md:grid-cols-2"><Field label="Eyebrow"><Input name="eyebrow" defaultValue={value?.eyebrow ?? ""} /></Field><Field label="Item limit"><Input name="itemLimit" type="number" defaultValue={value?.itemLimit ?? ""} /></Field></div><Field label="Title"><Textarea name="title" rows={2} defaultValue={value?.title ?? ""} /></Field><Field label="Description"><Textarea name="description" rows={3} defaultValue={value?.description ?? ""} /></Field><Field label="Body (trusted HTML)"><Textarea name="body" rows={7} defaultValue={value?.body ?? ""} /></Field><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="enabled" defaultChecked={value?.enabled ?? true} /> Enabled</label><Button type="submit" size="sm" className="w-fit">Save section</Button></form>;
}

function ItemForm({ value, action }: { value?: PageValue["sections"][number]["items"][number]; action: (fd: FormData) => void | Promise<void> }) {
  return <form action={action} className="grid gap-3"><div className="grid gap-3 sm:grid-cols-2"><Field label="Key"><Input name="key" defaultValue={value?.key ?? ""} /></Field><Field label="Sort"><Input name="sortOrder" type="number" defaultValue={value?.sortOrder ?? 0} /></Field></div><Field label="Title"><Input name="title" defaultValue={value?.title ?? ""} /></Field><Field label="Subtitle"><Input name="subtitle" defaultValue={value?.subtitle ?? ""} /></Field><Field label="Description"><Textarea name="description" rows={2} defaultValue={value?.description ?? ""} /></Field><Field label="Value"><Textarea name="value" rows={2} defaultValue={value?.value ?? ""} /></Field><div className="grid gap-3 sm:grid-cols-2"><Field label="Href"><Input name="href" defaultValue={value?.href ?? ""} /></Field><Field label="Icon"><Input name="icon" defaultValue={value?.icon ?? ""} /></Field></div><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="enabled" defaultChecked={value?.enabled ?? true} /> Enabled</label><Button type="submit" size="sm" variant="outline" className="w-fit">Save item</Button></form>;
}

function ActionForm({ value, action }: { value?: PageValue["sections"][number]["actions"][number]; action: (fd: FormData) => void | Promise<void> }) {
  return <form action={action} className="grid gap-3"><div className="grid gap-3 sm:grid-cols-2"><Field label="Key"><Input name="key" defaultValue={value?.key ?? ""} /></Field><Field label="Sort"><Input name="sortOrder" type="number" defaultValue={value?.sortOrder ?? 0} /></Field></div><Field label="Label"><Input name="label" required defaultValue={value?.label ?? ""} /></Field><Field label="Href"><Input name="href" defaultValue={value?.href ?? ""} /></Field><div className="grid gap-3 sm:grid-cols-2"><Field label="Variant"><select name="variant" defaultValue={value?.variant ?? "PRIMARY"} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"><option>PRIMARY</option><option>SECONDARY</option><option>OUTLINE</option><option>GHOST</option><option>LINK</option></select></Field><div className="flex items-end gap-4 pb-2"><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="external" defaultChecked={value?.external ?? false} /> External</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="enabled" defaultChecked={value?.enabled ?? true} /> Enabled</label></div></div><Button type="submit" size="sm" variant="outline" className="w-fit">Save action</Button></form>;
}

function Field({ label, children }: { label: string; children: ReactNode }) { return <div className="space-y-2"><Label>{label}</Label>{children}</div>; }
