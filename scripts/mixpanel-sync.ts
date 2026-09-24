import "@/lib/load-env";
import { pool } from "@/db";
import { syncMixpanelEvents } from "@/lib/mixpanel-sync";

async function main() {
  try {
    const result = await syncMixpanelEvents();
    console.log("Mixpanel analytics sync complete", result);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Mixpanel analytics sync failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
