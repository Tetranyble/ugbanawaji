import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { Inbox, Mail, MessageSquareText } from "lucide-react";
import { db } from "@/db";
import { contactMessages } from "@/db/schema";
import { updateContactCrm } from "@/app/admin/actions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ContactCrmForm } from "@/components/admin/contact-crm-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

const statuses = ["NEW", "REPLIED", "OPPORTUNITY", "RECRUITER", "COLLABORATION", "SPAM", "CLOSED"] as const;
type Status = typeof statuses[number];

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status: rawStatus } = await searchParams;
  const selected = statuses.includes(rawStatus as Status) ? rawStatus as Status : null;
  const items = selected
    ? await db.select().from(contactMessages).where(eq(contactMessages.status, selected)).orderBy(desc(contactMessages.createdAt))
    : await db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt));

  return (
    <div className="max-w-6xl">
      <AdminPageHeader eyebrow="Contact CRM" title="Professional enquiries" description="Triage recruiter conversations, collaboration requests and opportunities without adding a third-party CRM." />

      <div className="mb-6 flex flex-wrap gap-2">
        <Button asChild size="sm" variant={!selected ? "default" : "outline"}><Link href="/admin/messages">All</Link></Button>
        {statuses.map((status) => <Button key={status} asChild size="sm" variant={selected === status ? "default" : "outline"}><Link href={`/admin/messages?status=${status}`}>{status.replaceAll("_", " ")}</Link></Button>)}
      </div>

      <div className="space-y-5">
        {items.map((message) => <Card key={message.id} className="shadow-none"><CardHeader><div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0"><div className="flex items-center gap-2"><MessageSquareText className="size-4 text-primary" /><CardTitle className="text-xl">{message.subject || "Portfolio enquiry"}</CardTitle></div><p className="mt-2 text-sm text-muted-foreground">{message.name} · <a className="hover:text-primary" href={`mailto:${message.email}`}>{message.email}</a> · {formatDate(message.createdAt)}</p></div><Badge>{message.status}</Badge></div></CardHeader><CardContent><p className="whitespace-pre-wrap rounded-xl bg-muted/40 p-4 leading-7 text-muted-foreground">{message.message}</p><ContactCrmForm status={message.status} internalNotes={message.internalNotes} action={updateContactCrm.bind(null, message.id)} /></CardContent></Card>)}
        {!items.length ? <Card className="border-dashed shadow-none"><CardContent className="flex flex-col items-center py-12 text-center"><Inbox className="size-7 text-primary" /><h2 className="mt-4 font-bold">No {selected ? selected.toLowerCase().replaceAll("_", " ") : "contact"} messages</h2><p className="mt-2 text-sm text-muted-foreground">New portfolio enquiries will appear here automatically.</p>{selected ? <Button asChild variant="outline" className="mt-4"><Link href="/admin/messages"><Mail className="size-4" /> View all messages</Link></Button> : null}</CardContent></Card> : null}
      </div>
    </div>
  );
}
