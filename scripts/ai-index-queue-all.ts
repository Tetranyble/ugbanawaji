import "@/lib/load-env";
import { queuePublicPortfolioReindex } from "@/lib/ai/index-jobs";
import { pool } from "@/db";

async function main() {
  try {
    const result = await queuePublicPortfolioReindex({ priority: 20 });
    console.log("AI full re-index queued", result);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Failed to queue AI full re-index:", error);
  process.exitCode = 1;
});
