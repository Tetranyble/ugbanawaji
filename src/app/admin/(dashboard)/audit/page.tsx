import { desc } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

export default async function AuditPage() {
  const items = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(100);
  return (
    <div className="max-w-6xl">
      <p className="section-kicker">Operations</p>
      <h1 className="mt-2 text-3xl font-extrabold">CMS audit trail</h1>
      <p className="mt-2 text-muted-foreground">The latest 100 content-management mutations and message-read actions.</p>
      <div className="mt-8 space-y-3">
        {items.map((item) => (
          <Card key={item.id}>
            <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div><div className="flex flex-wrap items-center gap-2"><Badge>{item.action}</Badge><strong>{item.entity}</strong>{item.entityId ? <code className="text-xs text-muted-foreground">{item.entityId}</code> : null}</div><p className="mt-2 text-xs text-muted-foreground">{formatDate(item.createdAt)} · user {item.userId}</p></div>
              <pre className="max-w-md overflow-x-auto text-xs text-muted-foreground">{JSON.stringify(item.metadata)}</pre>
            </CardContent>
          </Card>
        ))}
        {!items.length ? <Card><CardContent className="p-6 text-muted-foreground">No audit events yet.</CardContent></Card> : null}
      </div>
    </div>
  );
}
