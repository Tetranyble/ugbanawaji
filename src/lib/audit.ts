import { randomUUID } from "crypto";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";

export async function writeAudit(input: {
  userId: string;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  await db.insert(auditLogs).values({
    id: randomUUID(),
    userId: input.userId,
    action: input.action,
    entity: input.entity,
    entityId: input.entityId ?? null,
    metadata: input.metadata ?? {},
    createdAt: new Date(),
  });
}
