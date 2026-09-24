import { desc, eq, sql } from "drizzle-orm";
import { Bot, CircleAlert, Clock3, DatabaseZap, MessagesSquare, RefreshCw, RotateCcw, ThumbsDown, ThumbsUp } from "lucide-react";
import { db } from "@/db";
import { aiDocumentChunks, aiDocuments, aiFeedback, aiIndexJobs, aiMessages } from "@/db/schema";
import { queueAiKnowledgeReindex, reindexAiKnowledge, retryAiKnowledgeIndexJobs } from "@/app/admin/actions";
import { getAiConfigurationSummary } from "@/lib/ai/provider";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/forms/submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function normalizeQuestion(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9+#. ]+/g, " ").replace(/\s+/g, " ").trim();
}

export default async function AiAdminPage() {
  const aiConfig = getAiConfigurationSummary();
  const [docs, chunks, messages, feedback, lastIndexed, pendingJobs, processingJobs, failedJobs, recentJobs] = await Promise.all([
    db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(aiDocuments).then((r) => r[0]?.count ?? 0).catch(() => 0),
    db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(aiDocumentChunks).then((r) => r[0]?.count ?? 0).catch(() => 0),
    db.select().from(aiMessages).orderBy(desc(aiMessages.createdAt)).limit(300).catch(() => []),
    db.select({ rating: aiFeedback.rating, count: sql<number>`count(*)`.mapWith(Number) }).from(aiFeedback).groupBy(aiFeedback.rating).catch(() => []),
    db.select({ indexedAt: aiDocuments.indexedAt }).from(aiDocuments).orderBy(desc(aiDocuments.indexedAt)).limit(1).then((r) => r[0]?.indexedAt ?? null).catch(() => null),
    db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(aiIndexJobs).where(eq(aiIndexJobs.status, "PENDING")).then((r) => r[0]?.count ?? 0).catch(() => 0),
    db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(aiIndexJobs).where(eq(aiIndexJobs.status, "PROCESSING")).then((r) => r[0]?.count ?? 0).catch(() => 0),
    db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(aiIndexJobs).where(eq(aiIndexJobs.status, "FAILED")).then((r) => r[0]?.count ?? 0).catch(() => 0),
    db.select().from(aiIndexJobs).orderBy(desc(aiIndexJobs.createdAt)).limit(8).catch(() => []),
  ]);

  const chronological = [...messages].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const previousUserByConversation = new Map<string, string>();
  const unanswered: Array<{ id: string; question: string; createdAt: Date }> = [];
  for (const message of chronological) {
    if (message.role === "USER") previousUserByConversation.set(message.conversationId, message.content);
    else if (!message.grounded) {
      const question = previousUserByConversation.get(message.conversationId);
      if (question) unanswered.push({ id: message.id, question, createdAt: message.createdAt });
    }
  }

  const userQuestions = messages.filter((message) => message.role === "USER");
  const grouped = new Map<string, { question: string; count: number }>();
  for (const message of userQuestions) {
    const key = normalizeQuestion(message.content);
    if (!key) continue;
    const current = grouped.get(key);
    if (current) current.count += 1;
    else grouped.set(key, { question: message.content, count: 1 });
  }
  const popular = [...grouped.values()].sort((a, b) => b.count - a.count).slice(0, 8);
  const helpful = feedback.find((item) => item.rating === "HELPFUL")?.count ?? 0;
  const notHelpful = feedback.find((item) => item.rating === "NOT_HELPFUL")?.count ?? 0;

  const stats = [
    [DatabaseZap, docs, "Indexed documents"],
    [Bot, chunks, "Evidence chunks"],
    [ThumbsUp, helpful, "Helpful ratings"],
    [ThumbsDown, notHelpful, "Not helpful"],
  ] as const;

  return (
    <div className="max-w-7xl">
      <AdminPageHeader
        eyebrow="Ask Ugbanawaji"
        title="AI knowledge & answer quality"
        description="Publishing queues background indexing for the scheduler. Manual re-indexing remains available when you want an immediate rebuild or verification."
        actions={<div className="flex flex-wrap gap-2">
          <form action={queueAiKnowledgeReindex}><SubmitButton variant="outline" pendingText="Queueing…"><Clock3 className="size-4" /> Queue background re-index</SubmitButton></form>
          <form action={reindexAiKnowledge}><SubmitButton pendingText="Re-indexing…"><RefreshCw className="size-4" /> Re-index now</SubmitButton></form>
        </div>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(([Icon, value, label]) => <Card key={label} className="shadow-none"><CardContent className="p-5"><div className="flex items-center justify-between gap-4"><div><p className="text-3xl font-extrabold text-primary">{value}</p><p className="mt-1 text-sm text-muted-foreground">{label}</p></div><div className="grid size-10 place-items-center rounded-xl bg-muted"><Icon className="size-4 text-primary" /></div></div></CardContent></Card>)}
      </div>

      <Card className="mt-5 shadow-none">
        <CardContent className="grid gap-5 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div><strong>Index status</strong><p className="mt-1 text-sm text-muted-foreground">{lastIndexed ? `Last indexed ${lastIndexed.toLocaleString()}` : "No AI knowledge index has been built yet."}</p><p className="mt-2 text-xs text-muted-foreground">Scheduler queue: {pendingJobs} pending · {processingJobs} processing · {failedJobs} failed</p></div>
          <div className="flex flex-wrap gap-2"><Badge>Chat: {aiConfig.chat.provider}</Badge><Badge>{aiConfig.chat.model}</Badge><Badge>Embeddings: {aiConfig.embeddings.provider}</Badge><Badge>{aiConfig.embeddings.model}</Badge></div>
        </CardContent>
      </Card>

      {failedJobs ? <Card className="mt-5 border-destructive/30 shadow-none"><CardContent className="flex flex-wrap items-center justify-between gap-4 p-5"><div><p className="font-semibold">Some indexing jobs failed</p><p className="mt-1 text-sm text-muted-foreground">Retry them after checking the configured embedding provider and network access.</p></div><form action={retryAiKnowledgeIndexJobs}><SubmitButton variant="outline" pendingText="Retrying…"><RotateCcw className="size-4" /> Retry failed jobs</SubmitButton></form></CardContent></Card> : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="shadow-none"><CardHeader><CardTitle>Evidence gaps</CardTitle><CardDescription>Questions that resulted in an ungrounded answer are content opportunities, not reasons for the model to guess.</CardDescription></CardHeader><CardContent className="space-y-3">{unanswered.length ? unanswered.slice(-10).reverse().map((item) => <div key={item.id} className="flex gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4"><CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-500" /><div><p className="text-sm font-medium text-foreground">{item.question}</p><p className="mt-1 text-xs text-muted-foreground">{item.createdAt.toLocaleString()}</p></div></div>) : <p className="text-sm leading-6 text-muted-foreground">No recent evidence gaps. When visitors ask something the published portfolio cannot establish, the originating question appears here.</p>}</CardContent></Card>

        <Card className="shadow-none"><CardHeader><CardTitle>Popular questions</CardTitle><CardDescription>Repeated questions reveal what visitors most want the portfolio to explain.</CardDescription></CardHeader><CardContent className="space-y-3">{popular.length ? popular.map((item) => <div key={normalizeQuestion(item.question)} className="flex min-w-0 flex-col items-start gap-3 rounded-xl border border-border p-4 sm:flex-row sm:justify-between sm:gap-4"><p className="min-w-0 break-words text-sm leading-6">{item.question}</p><Badge className="shrink-0">{item.count}×</Badge></div>) : <p className="text-sm text-muted-foreground">No visitor questions yet.</p>}</CardContent></Card>
      </div>

      <Card className="mt-6 shadow-none"><CardHeader><CardTitle>Recent indexing jobs</CardTitle><CardDescription>Background indexing is coalesced so repeated content saves do not create unnecessary embedding work.</CardDescription></CardHeader><CardContent className="space-y-3">{recentJobs.length ? recentJobs.map((job) => <div key={job.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4"><div><p className="text-sm font-medium">{job.action} · {job.sourceType}</p><p className="mt-1 text-xs text-muted-foreground">{job.createdAt.toLocaleString()}{job.lastError ? ` · ${job.lastError}` : ""}</p></div><Badge>{job.status}</Badge></div>) : <p className="text-sm text-muted-foreground">No background indexing jobs yet.</p>}</CardContent></Card>

      <Card className="mt-6 shadow-none"><CardHeader><CardTitle>Recent visitor questions</CardTitle><CardDescription>Stored for product-quality analysis; private CMS content is never included as answer evidence.</CardDescription></CardHeader><CardContent className="grid gap-3 md:grid-cols-2">{userQuestions.slice(0, 12).map((message) => <div key={message.id} className="flex gap-3 rounded-xl border border-border p-4 text-sm leading-6"><MessagesSquare className="mt-1 size-4 shrink-0 text-primary" /><span>{message.content}</span></div>)}</CardContent></Card>
    </div>
  );
}
