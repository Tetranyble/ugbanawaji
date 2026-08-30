import "@/lib/load-env";
import { processNewsletterBatch } from "@/lib/newsletter";
import { processAiIndexBatch, queueDueAiVisibilitySync } from "@/lib/ai/index-jobs";
import { pool } from "@/db";

async function main() {
  try {
    const scheduledIndex = await queueDueAiVisibilitySync();
    const [newsletter, aiIndex] = await Promise.all([
      processNewsletterBatch(),
      processAiIndexBatch(),
    ]);
    console.log("Scheduler", { scheduledIndex, newsletter, aiIndex });
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Scheduler failed:", error);
  process.exitCode = 1;
});
