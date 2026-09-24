import Link from "next/link";
import type { ReactNode } from "react";
import { desc } from "drizzle-orm";
import {
  createEducationEntry,
  createFocusArea,
  createSkillGroup,
  deleteEducationEntry,
  deleteFocusArea,
  deleteSkillGroup,
  saveAboutCopy,
  updateEducationEntry,
  updateFocusArea,
  updateSkillGroup,
} from "@/app/admin/actions";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { db } from "@/db";
import { educationEntries, focusAreas, focusAreaTags, profileAboutParagraphs, skillGroups, skillItems } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function PortfolioDataAdminPage() {
  const [about, focus, focusTags, groups, items, education] = await Promise.all([
    db.select().from(profileAboutParagraphs).orderBy(desc(profileAboutParagraphs.sortOrder)),
    db.select().from(focusAreas).orderBy(desc(focusAreas.sortOrder)),
    db.select().from(focusAreaTags).orderBy(desc(focusAreaTags.sortOrder)),
    db.select().from(skillGroups).orderBy(desc(skillGroups.sortOrder)),
    db.select().from(skillItems).orderBy(desc(skillItems.sortOrder)),
    db.select().from(educationEntries).orderBy(desc(educationEntries.sortOrder)),
  ]);

  return <div className="max-w-6xl">
    <AdminPageHeader eyebrow="Portfolio data" title="Reusable portfolio content" description="Edit reusable data shared by page sections. Page copy, section order, labels, CTAs and visibility are managed in Pages & sections." />

    <Card className="mb-8 border-primary/20 shadow-none"><CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold">Page and section content</p><p className="mt-1 text-sm text-muted-foreground">Edit the homepage, snapshot, Work, Blog, Ask, Hire, utility pages and detail-template labels from the page builder.</p></div><Button asChild><Link href="/admin/pages">Open Pages & sections</Link></Button></CardContent></Card>

    <section className="space-y-5">
      <Card className="shadow-none"><CardHeader><CardTitle>About copy</CardTitle><CardDescription>Reusable About paragraphs shown by the About homepage section. Separate paragraphs with a blank line.</CardDescription></CardHeader><CardContent><form action={saveAboutCopy} className="space-y-4"><Textarea name="about" rows={10} defaultValue={about.map((item) => item.body).join("\n\n")} /><Button type="submit">Save About</Button></form></CardContent></Card>
    </section>

    <section className="mt-10 space-y-5">
      <div><h2 className="text-xl font-extrabold">Focus areas</h2><p className="mt-1 text-sm text-muted-foreground">Reusable capability cards rendered by FOCUS_AREAS sections.</p></div>
      <Card className="border-dashed shadow-none"><CardHeader><CardTitle>Add focus area</CardTitle></CardHeader><CardContent><FocusForm action={createFocusArea} /></CardContent></Card>
      <div className="grid gap-5 lg:grid-cols-2">{focus.map((area) => <Card key={area.id} className="shadow-none"><CardHeader><CardTitle>{area.title}</CardTitle></CardHeader><CardContent><FocusForm value={{...area, tags: focusTags.filter((tag) => tag.focusAreaId === area.id).map((tag) => tag.label)}} action={updateFocusArea.bind(null, area.id)} /><form action={deleteFocusArea.bind(null, area.id)} className="mt-4"><ConfirmSubmitButton variant="destructive" size="sm" message="Delete this focus area?">Delete</ConfirmSubmitButton></form></CardContent></Card>)}</div>
    </section>

    <section className="mt-10 space-y-5">
      <div><h2 className="text-xl font-extrabold">Skill groups</h2><p className="mt-1 text-sm text-muted-foreground">Reusable skill groups rendered by skill and background sections.</p></div>
      <Card className="border-dashed shadow-none"><CardHeader><CardTitle>Add skill group</CardTitle></CardHeader><CardContent><SkillForm action={createSkillGroup} /></CardContent></Card>
      <div className="grid gap-5 lg:grid-cols-2">{groups.map((group) => <Card key={group.id} className="shadow-none"><CardHeader><CardTitle>{group.title}</CardTitle></CardHeader><CardContent><SkillForm value={{...group, items: items.filter((item) => item.groupId === group.id).map((item) => item.label)}} action={updateSkillGroup.bind(null, group.id)} /><form action={deleteSkillGroup.bind(null, group.id)} className="mt-4"><ConfirmSubmitButton variant="destructive" size="sm" message="Delete this skill group?">Delete</ConfirmSubmitButton></form></CardContent></Card>)}</div>
    </section>

    <section className="mt-10 space-y-5">
      <div><h2 className="text-xl font-extrabold">Education & certifications</h2><p className="mt-1 text-sm text-muted-foreground">Reusable background entries rendered by profile/background sections.</p></div>
      <Card className="border-dashed shadow-none"><CardHeader><CardTitle>Add entry</CardTitle></CardHeader><CardContent><EducationForm action={createEducationEntry} /></CardContent></Card>
      <div className="grid gap-5 lg:grid-cols-2">{education.map((entry) => <Card key={entry.id} className="shadow-none"><CardHeader><CardTitle>{entry.title}</CardTitle></CardHeader><CardContent><EducationForm value={entry} action={updateEducationEntry.bind(null, entry.id)} /><form action={deleteEducationEntry.bind(null, entry.id)} className="mt-4"><ConfirmSubmitButton variant="destructive" size="sm" message="Delete this education/certification entry?">Delete</ConfirmSubmitButton></form></CardContent></Card>)}</div>
    </section>
  </div>;
}

function Field({ label, children }: { label: string; children: ReactNode }) { return <div className="space-y-2"><Label>{label}</Label>{children}</div>; }
function FocusForm({ value, action }: { value?: { title?: string; description?: string; icon?: string; sortOrder?: number; tags?: string[] }; action: (fd: FormData) => void | Promise<void> }) { return <form action={action} className="grid gap-4"><Field label="Title"><Input name="title" required defaultValue={value?.title ?? ""} /></Field><Field label="Description"><Textarea name="description" required rows={4} defaultValue={value?.description ?? ""} /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Icon key"><select name="icon" defaultValue={value?.icon ?? "blocks"} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"><option value="blocks">Blocks</option><option value="building">Building</option><option value="network">Network</option><option value="sparkles">Sparkles</option></select></Field><Field label="Sort order"><Input name="sortOrder" type="number" defaultValue={value?.sortOrder ?? 0} /></Field></div><Field label="Tags (comma separated)"><Input name="tags" defaultValue={(value?.tags ?? []).join(", ")} /></Field><Button type="submit" className="w-fit">Save focus area</Button></form>; }
function SkillForm({ value, action }: { value?: { title?: string; sortOrder?: number; items?: string[] }; action: (fd: FormData) => void | Promise<void> }) { return <form action={action} className="grid gap-4"><Field label="Group title"><Input name="title" required defaultValue={value?.title ?? ""} /></Field><Field label="Skills (comma separated)"><Textarea name="items" rows={3} defaultValue={(value?.items ?? []).join(", ")} /></Field><Field label="Sort order"><Input name="sortOrder" type="number" defaultValue={value?.sortOrder ?? 0} /></Field><Button type="submit" className="w-fit">Save skill group</Button></form>; }
function EducationForm({ value, action }: { value?: { type?: "EDUCATION" | "CERTIFICATION"; title?: string; institution?: string | null; year?: string | null; detail?: string | null; sortOrder?: number }; action: (fd: FormData) => void | Promise<void> }) { return <form action={action} className="grid gap-4"><div className="grid gap-4 sm:grid-cols-2"><Field label="Type"><select name="type" defaultValue={value?.type ?? "EDUCATION"} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"><option value="EDUCATION">Education</option><option value="CERTIFICATION">Certification</option></select></Field><Field label="Sort order"><Input name="sortOrder" type="number" defaultValue={value?.sortOrder ?? 0} /></Field></div><Field label="Title"><Input name="title" required defaultValue={value?.title ?? ""} /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Institution"><Input name="institution" defaultValue={value?.institution ?? ""} /></Field><Field label="Year"><Input name="year" defaultValue={value?.year ?? ""} /></Field></div><Field label="Detail"><Textarea name="detail" rows={3} defaultValue={value?.detail ?? ""} /></Field><Button type="submit" className="w-fit">Save entry</Button></form>; }
