import type { ReactNode } from "react";
import { desc } from "drizzle-orm";
import { createNavigationItem, deleteNavigationItem, updateNavigationItem } from "@/app/admin/actions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { db } from "@/db";
import { navigationItems } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function NavigationAdminPage() {
  const items = await db.select().from(navigationItems).orderBy(desc(navigationItems.sortOrder));
  return <div className="max-w-6xl"><AdminPageHeader eyebrow="Site navigation" title="Navigation" description="Header, mobile and footer links are stored in the database. Edit labels, destinations, visibility and order here." />
    <Card className="border-dashed shadow-none"><CardHeader><CardTitle>Add navigation item</CardTitle></CardHeader><CardContent><NavigationForm action={createNavigationItem} /></CardContent></Card>
    <div className="mt-8 grid gap-5 lg:grid-cols-2">{items.map((item) => <Card key={item.id} className="shadow-none"><CardHeader><CardTitle>{item.label} · {item.placement}</CardTitle></CardHeader><CardContent><NavigationForm value={item} action={updateNavigationItem.bind(null, item.id)} /><form action={deleteNavigationItem.bind(null, item.id)} className="mt-4"><ConfirmSubmitButton variant="destructive" size="sm" message="Delete this navigation item?">Delete</ConfirmSubmitButton></form></CardContent></Card>)}</div>
  </div>;
}

function Field({ label, children }: { label: string; children: ReactNode }) { return <div className="space-y-2"><Label>{label}</Label>{children}</div>; }
function NavigationForm({ value, action }: { value?: { placement?: "HEADER" | "MOBILE" | "FOOTER" | "HEADER_CTA"; label?: string; href?: string; external?: boolean; enabled?: boolean; sortOrder?: number }; action: (fd: FormData) => void | Promise<void> }) { return <form action={action} className="grid gap-4"><div className="grid gap-4 sm:grid-cols-2"><Field label="Placement"><select name="placement" defaultValue={value?.placement ?? "HEADER"} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"><option value="HEADER">Header</option><option value="HEADER_CTA">Header CTA</option><option value="MOBILE">Mobile</option><option value="FOOTER">Footer</option></select></Field><Field label="Sort order"><Input name="sortOrder" type="number" defaultValue={value?.sortOrder ?? 0} /></Field></div><Field label="Label"><Input name="label" required defaultValue={value?.label ?? ""} /></Field><Field label="URL"><Input name="href" required defaultValue={value?.href ?? ""} /></Field><div className="flex flex-wrap gap-6"><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="enabled" defaultChecked={value?.enabled ?? true} /> Enabled</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="external" defaultChecked={value?.external ?? false} /> External link</label></div><Button type="submit" className="w-fit">Save link</Button></form>; }
