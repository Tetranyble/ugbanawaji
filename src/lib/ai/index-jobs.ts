import { randomUUID } from "crypto";
import { and, desc, eq, lt, lte, or } from "drizzle-orm";
import { db, pool } from "@/db";
import { aiDocuments, aiIndexJobs, posts } from "@/db/schema";
import { reindexPublicPortfolio } from "@/lib/ai";
import { getEmbeddingProvider } from "@/lib/ai/provider";

const FULL_SOURCE_ID = "public-portfolio";
const WORKER_LOCK = "ugbanawaji_ai_index_worker";

function batchSize() {
  const value = Number(process.env.AI_INDEX_BATCH_SIZE ?? 2);
  return Number.isFinite(value) ? Math.max(1, Math.min(20, Math.trunc(value))) : 2;
}

function maxAttempts() {
  const value = Number(process.env.AI_INDEX_MAX_ATTEMPTS ?? 5);
  return Number.isFinite(value) ? Math.max(1, Math.min(20, Math.trunc(value))) : 5;
}

function retryDelayMs(attempt: number) {
  const baseSeconds = Number(process.env.AI_INDEX_RETRY_DELAY_SECONDS ?? 60);
  const base = Number.isFinite(baseSeconds) ? Math.max(10, Math.min(3600, baseSeconds)) : 60;
  return base * 1000 * Math.min(16, 2 ** Math.max(0, attempt - 1));
}

function staleLockBefore() {
  const minutes = Number(process.env.AI_INDEX_STALE_LOCK_MINUTES ?? 20);
  const safe = Number.isFinite(minutes) ? Math.max(5, Math.min(240, minutes)) : 20;
  return new Date(Date.now() - safe * 60_000);
}

export async function queuePublicPortfolioReindex({ priority = 50, availableAt = new Date() }: { priority?: number; availableAt?: Date } = {}) {
  const now = new Date();
  const safePriority = Math.max(1, Math.min(1000, Math.trunc(priority)));
  const [pending] = await db.select().from(aiIndexJobs).where(and(
    eq(aiIndexJobs.sourceType, "FULL"),
    eq(aiIndexJobs.sourceId, FULL_SOURCE_ID),
    eq(aiIndexJobs.status, "PENDING"),
  )).orderBy(desc(aiIndexJobs.priority)).limit(1);

  const provider = getEmbeddingProvider();
  if (pending) {
    await db.update(aiIndexJobs).set({
      priority: Math.max(pending.priority, safePriority),
      availableAt: pending.availableAt <= availableAt ? pending.availableAt : availableAt,
      embeddingProvider: provider.name,
      embeddingModel: provider.model,
      updatedAt: now,
    }).where(eq(aiIndexJobs.id, pending.id));
    return { queued: false, jobId: pending.id, coalesced: true };
  }

  const id = randomUUID();
  await db.insert(aiIndexJobs).values({
    id,
    sourceType: "FULL",
    sourceId: FULL_SOURCE_ID,
    action: "SYNC",
    status: "PENDING",
    priority: safePriority,
    attempts: 0,
    maxAttempts: maxAttempts(),
    availableAt,
    lockedAt: null,
    lockedBy: null,
    lastError: null,
    contentHash: null,
    embeddingProvider: provider.name,
    embeddingModel: provider.model,
    startedAt: null,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
  });
  return { queued: true, jobId: id, coalesced: false };
}

export async function queueDueAiVisibilitySync() {
  const now = new Date();
  const due = await db.select({ id: posts.id }).from(posts).where(and(
    eq(posts.status, "SCHEDULED"),
    lte(posts.publishedAt, now),
  ));
  if (!due.length) return { queued: false, reason: "no-due-scheduled-posts" };

  const indexedPosts = await db.select({ sourceId: aiDocuments.sourceId }).from(aiDocuments).where(eq(aiDocuments.sourceType, "POST"));
  const indexed = new Set(indexedPosts.map((row) => row.sourceId));
  if (!due.some((post) => !indexed.has(post.id))) return { queued: false, reason: "already-indexed" };
  return queuePublicPortfolioReindex({ priority: 90 });
}

async function recoverStaleJobs() {
  const now = new Date();
  await db.update(aiIndexJobs).set({
    status: "PENDING",
    lockedAt: null,
    lockedBy: null,
    availableAt: now,
    lastError: "Recovered after a stale worker lock.",
    updatedAt: now,
  }).where(and(eq(aiIndexJobs.status, "PROCESSING"), lt(aiIndexJobs.lockedAt, staleLockBefore())));
}

async function processAiIndexBatchUnlocked() {
  await recoverStaleJobs();
  await queueDueAiVisibilitySync();
  const now = new Date();
  const jobs = await db.select().from(aiIndexJobs).where(and(
    eq(aiIndexJobs.status, "PENDING"),
    lte(aiIndexJobs.availableAt, now),
  )).orderBy(desc(aiIndexJobs.priority), aiIndexJobs.availableAt).limit(batchSize());

  let completed = 0;
  let failed = 0;
  const results: Array<{ jobId: string; status: string; documents?: number; chunks?: number; error?: string }> = [];
  const workerId = `${process.pid}:${randomUUID().slice(0, 8)}`;

  for (const job of jobs) {
    const attempt = job.attempts + 1;
    await db.update(aiIndexJobs).set({
      status: "PROCESSING",
      attempts: attempt,
      lockedAt: new Date(),
      lockedBy: workerId,
      startedAt: job.startedAt ?? new Date(),
      lastError: null,
      updatedAt: new Date(),
    }).where(and(eq(aiIndexJobs.id, job.id), eq(aiIndexJobs.status, "PENDING")));

    try {
      const result = await reindexPublicPortfolio();
      await db.update(aiIndexJobs).set({
        status: "COMPLETED",
        completedAt: new Date(),
        lockedAt: null,
        lockedBy: null,
        lastError: null,
        embeddingProvider: result.provider,
        embeddingModel: result.model,
        updatedAt: new Date(),
      }).where(eq(aiIndexJobs.id, job.id));
      completed += 1;
      results.push({ jobId: job.id, status: "COMPLETED", documents: result.documents, chunks: result.chunks });
    } catch (error) {
      const message = String(error instanceof Error ? error.message : error).slice(0, 4000);
      const terminal = attempt >= job.maxAttempts;
      await db.update(aiIndexJobs).set({
        status: terminal ? "FAILED" : "PENDING",
        availableAt: terminal ? job.availableAt : new Date(Date.now() + retryDelayMs(attempt)),
        lockedAt: null,
        lockedBy: null,
        lastError: message,
        completedAt: terminal ? new Date() : null,
        updatedAt: new Date(),
      }).where(eq(aiIndexJobs.id, job.id));
      failed += 1;
      results.push({ jobId: job.id, status: terminal ? "FAILED" : "RETRY", error: message });
    }
  }

  return { processed: jobs.length, completed, failed, results };
}

export async function processAiIndexBatch() {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query("SELECT GET_LOCK(?, 0) AS acquired", [WORKER_LOCK]);
    const lockRows = Array.isArray(rows) ? rows as Array<{ acquired?: number | string | null }> : [];
    if (Number(lockRows[0]?.acquired ?? 0) !== 1) return { processed: 0, completed: 0, failed: 0, results: [], skipped: "worker-already-running" };
    try {
      return await processAiIndexBatchUnlocked();
    } finally {
      await connection.query("SELECT RELEASE_LOCK(?)", [WORKER_LOCK]);
    }
  } finally {
    connection.release();
  }
}

export async function supersedePendingAiIndexJobs(reason = "Superseded by manual re-index.") {
  const now = new Date();
  await db.update(aiIndexJobs).set({
    status: "COMPLETED",
    completedAt: now,
    lockedAt: null,
    lockedBy: null,
    lastError: reason,
    updatedAt: now,
  }).where(and(eq(aiIndexJobs.sourceType, "FULL"), eq(aiIndexJobs.sourceId, FULL_SOURCE_ID), eq(aiIndexJobs.status, "PENDING")));
}

export async function retryFailedAiIndexJobs() {
  const now = new Date();
  await db.update(aiIndexJobs).set({
    status: "PENDING",
    attempts: 0,
    availableAt: now,
    lockedAt: null,
    lockedBy: null,
    completedAt: null,
    lastError: null,
    updatedAt: now,
  }).where(eq(aiIndexJobs.status, "FAILED"));
}
