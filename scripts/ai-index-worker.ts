import "@/lib/load-env";
import { processAiIndexBatch } from "@/lib/ai/index-jobs";
import { pool } from "@/db";

async function main() {
  try {
    const result = await processAiIndexBatch();
    console.log("AI index worker", result);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("AI index worker failed:", error);
  process.exitCode = 1;
});
