import "@/lib/load-env";
import { processNewsletterBatch } from "@/lib/newsletter";
import { pool } from "@/db";

async function main() {
  try {
    const result = await processNewsletterBatch();
    console.log("Newsletter worker", result);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Newsletter worker failed:", error);
  process.exitCode = 1;
});
