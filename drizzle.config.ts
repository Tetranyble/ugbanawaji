import "./src/lib/load-env";
import { defineConfig } from "drizzle-kit";

for (const key of ["DB_HOST", "DB_PORT", "DB_DATABASE", "DB_USERNAME"]) {
  if (!process.env[key]) throw new Error(`${key} is required for Drizzle commands`);
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    host: process.env.DB_HOST!,
    port: Number(process.env.DB_PORT ?? 3306),
    database: process.env.DB_DATABASE!,
    user: process.env.DB_USERNAME!,
    password: process.env.DB_PASSWORD ?? "",
    ssl: process.env.DB_SSL === "true" ? {} : undefined,
  },
});
