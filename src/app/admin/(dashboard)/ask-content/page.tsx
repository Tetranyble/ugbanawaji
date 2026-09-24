import { desc } from "drizzle-orm";
import { createAskStarterPrompt, deleteAskStarterPrompt, updateAskStarterPrompt } from "@/app/admin/actions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { db } from "@/db";
import { askStarterPrompts } from "@/db/schema";

export const dynamic = "force-dynamic";
export default async function AskContentAdminPage() {
  const prompts = await db.select().from(askStarterPrompts).orderBy(desc(askStarterPrompts.sortOrder));
  return <div className="max-w-5xl"><AdminPageHeader eyebrow="Ask AI" title="Starter prompts" description="Edit the public prompt chips shown before a visitor starts a conversation. The Ask page title and description are edited under Pages." />
    <Card className="border-dashed shadow-none"><CardHeader><CardTitle>Add prompt</CardTitle></CardHeader><CardContent><PromptForm action={createAskStarterPrompt} /></CardContent></Card>
    <div className="mt-8 grid gap-5 lg:grid-cols-2">{prompts.map((prompt) => <Card key={prompt.id} className="shadow-none"><CardHeader><CardTitle>{prompt.label}</CardTitle></CardHeader><CardContent><PromptForm value={prompt} action={updateAskStarterPrompt.bind(null, prompt.id)} /><form action={deleteAskStarterPrompt.bind(null, prompt.id)} className="mt-4"><ConfirmSubmitButton variant="destructive" size="sm" message="Delete this starter prompt?">Delete</ConfirmSubmitButton></form></CardContent></Card>)}</div>
  </div>;
}
function PromptForm({ value, action }: { value?: { label?: string; question?: string; enabled?: boolean; sortOrder?: number }; action: (fd: FormData) => void | Promise<void> }) { return <form action={action} className="grid gap-4"><div className="space-y-2"><Label>Label</Label><Input name="label" required defaultValue={value?.label ?? ""} /></div><div className="space-y-2"><Label>Question</Label><Textarea name="question" required rows={4} defaultValue={value?.question ?? ""} /></div><div className="flex flex-wrap items-end gap-5"><div className="space-y-2"><Label>Sort order</Label><Input className="w-32" name="sortOrder" type="number" defaultValue={value?.sortOrder ?? 0} /></div><label className="flex items-center gap-2 pb-2 text-sm"><input type="checkbox" name="enabled" defaultChecked={value?.enabled ?? true} /> Enabled</label></div><Button type="submit" className="w-fit">Save prompt</Button></form>; }
