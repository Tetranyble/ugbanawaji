import "@/lib/load-env";

import { db, pool } from "@/db";
import { siteProfiles } from "@/db/schema";

async function run() {
  const [profile] = await db.select().from(siteProfiles).limit(1);
  if (!profile) {
    console.log("No site profile exists. Run npm run db:seed after recreating the database.");
    return;
  }
  console.log("Editorial cleanup is no longer required: public portfolio content is database-backed. Use the admin workspace to edit it.");
}

run().finally(async () => {
  await pool.end();
});
