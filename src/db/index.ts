import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";
import { env } from "@/lib/env";

const globalForDb = globalThis as unknown as { pool?: mysql.Pool };

function createPool() {
  return mysql.createPool({
    host: env.db.host,
    port: env.db.port,
    user: env.db.username,
    password: env.db.password,
    database: env.db.database,
    waitForConnections: true,
    connectionLimit: env.db.poolLimit,
    timezone: "Z",
    ssl: env.db.ssl ? {} : undefined,
    charset: "utf8mb4",
  });
}

export const pool = globalForDb.pool ?? createPool();
if (process.env.NODE_ENV !== "production") globalForDb.pool = pool;
export const db = drizzle(pool, { schema, mode: "default" });
