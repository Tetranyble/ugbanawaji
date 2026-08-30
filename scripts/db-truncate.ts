import mysql from "mysql2/promise";
import { env } from "@/lib/env";

const APP_TABLES = [
  "ai_feedback",
  "ai_index_jobs",
  "ai_messages",
  "ai_conversations",
  "ai_document_chunks",
  "ai_documents",
  "project_revisions",
  "post_revisions",
  "preview_tokens",
  "slug_redirects",
  "post_category_assignments",
  "post_tag_assignments",
  "newsletter_deliveries",
  "newsletter_campaigns",
  "newsletter_subscribers",
  "analytics_events",
  "rate_limit_buckets",
  "contact_messages",
  "audit_logs",
  "storage_connections",
  "media_assets",
  "posts",
  "post_series",
  "post_categories",
  "tags",
  "projects",
  "experiences",
  "content_entries",
  "resume_variants",
  "site_settings",
  "users",
] as const;

function assertSafeToTruncate() {
  const args = new Set(process.argv.slice(2));

  if (!args.has("--yes")) {
    throw new Error(
      [
        "Refusing to truncate without explicit confirmation.",
        "Run: npm run db:truncate -- --yes",
        "This permanently deletes application rows from the configured database.",
      ].join("\n")
    );
  }

  const environment = env.appEnv.toLowerCase();
  if (environment === "production" || process.env.NODE_ENV === "production") {
    throw new Error(
      "db:truncate is disabled in production. Use a deliberate migration/maintenance procedure instead."
    );
  }

  if (!env.db.database.trim()) {
    throw new Error("DB_DATABASE is empty; refusing to continue.");
  }
}

async function main() {
  assertSafeToTruncate();

  const connection = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.username,
    password: env.db.password,
    database: env.db.database,
    ssl: env.db.ssl ? {} : undefined,
    charset: "utf8mb4",
    timezone: "Z",
  });

  try {
    const [rows] = await connection.query<mysql.RowDataPacket[]>(
      `SELECT TABLE_NAME AS tableName
       FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'`,
      [env.db.database]
    );

    const existingTables = new Set(rows.map((row) => String(row.tableName)));
    const tablesToTruncate = APP_TABLES.filter((table) => existingTables.has(table));

    if (tablesToTruncate.length === 0) {
      console.log(`No application tables found in database \`${env.db.database}\`.`);
      return;
    }

    console.log(`Truncating ${tablesToTruncate.length} application tables in \`${env.db.database}\`...`);
    await connection.query("SET FOREIGN_KEY_CHECKS = 0");

    try {
      for (const table of tablesToTruncate) {
        // Table names come only from the hard-coded application allow-list above.
        await connection.query(`TRUNCATE TABLE \`${table}\``);
        console.log(`  ✓ ${table}`);
      }
    } finally {
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");
    }

    const missingTables = APP_TABLES.filter((table) => !existingTables.has(table));
    if (missingTables.length > 0) {
      console.log(`Skipped ${missingTables.length} table(s) that do not exist in this schema.`);
    }

    console.log("Database truncate complete.");
    console.log("Drizzle migration metadata and uploaded files were not removed.");
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
