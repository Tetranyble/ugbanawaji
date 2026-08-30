import "./load-env";

function numberEnv(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export const env = {
  appName: process.env.APP_NAME ?? "Ugbanawaji",
  appEnv: process.env.APP_ENV ?? process.env.NODE_ENV ?? "development",
  appUrl: process.env.APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  appTimeZone: process.env.APP_TIMEZONE ?? "Africa/Lagos",
  appKey: process.env.APP_KEY ?? "",
  bcryptRounds: numberEnv("BCRYPT_ROUNDS", 12),
  db: {
    host: process.env.DB_HOST ?? "127.0.0.1",
    port: numberEnv("DB_PORT", 3306),
    database: process.env.DB_DATABASE ?? "ugbanawaji",
    username: process.env.DB_USERNAME ?? "root",
    password: process.env.DB_PASSWORD ?? "",
    ssl: process.env.DB_SSL === "true",
    poolLimit: numberEnv("DB_POOL_LIMIT", 10),
  },
  storage: {
    disk: (process.env.FILESYSTEM_DISK ?? "local").toLowerCase(),
    uploadMaxMb: numberEnv("UPLOAD_MAX_MB", 10),
  },
};
