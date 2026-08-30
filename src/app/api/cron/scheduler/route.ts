import { processNewsletterBatch } from "@/lib/newsletter";
import { processAiIndexBatch, queueDueAiVisibilitySync } from "@/lib/ai/index-jobs";

async function run(request: Request) {
  const configured = process.env.SCHEDULER_CRON_SECRET || process.env.NEWSLETTER_CRON_SECRET;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || new URL(request.url).searchParams.get("secret");
  if (!configured || supplied !== configured) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const scheduledIndex = await queueDueAiVisibilitySync();
    const [newsletter, aiIndex] = await Promise.all([processNewsletterBatch(), processAiIndexBatch()]);
    return Response.json({ scheduledIndex, newsletter, aiIndex });
  } catch (error) {
    console.error("scheduler worker failed", error);
    return Response.json({ error: error instanceof Error ? error.message : "Scheduler failed" }, { status: 500 });
  }
}

export const GET = run;
export const POST = run;
