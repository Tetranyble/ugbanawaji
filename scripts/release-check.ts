import { existsSync } from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { config } from "dotenv";

const releaseEnvFile = process.env.RELEASE_ENV_FILE;
if (releaseEnvFile) {
  if (!existsSync(releaseEnvFile)) throw new Error(`Release environment file not found: ${releaseEnvFile}`);
  config({ path: releaseEnvFile, override: true, quiet: true });
}

const errors: string[] = [];
const warnings: string[] = [];

function value(name: string) {
  return (process.env[name] ?? "").trim();
}

function required(name: string, minimumLength = 1) {
  const current = value(name);
  if (!current || current.length < minimumLength || /change[_-]?me|replace[_-]?me|example/i.test(current)) {
    errors.push(`${name} must be set${minimumLength > 1 ? ` to at least ${minimumLength} characters` : ""}.`);
  }
  return current;
}

function parsedUrl(name: string, httpsOnly = true) {
  const current = required(name);
  if (!current) return null;
  try {
    const url = new URL(current);
    if (httpsOnly && url.protocol !== "https:") errors.push(`${name} must use https:// in production.`);
    if (["localhost", "127.0.0.1", "0.0.0.0"].includes(url.hostname)) errors.push(`${name} must not point to localhost.`);
    return url;
  } catch {
    errors.push(`${name} must be a valid absolute URL.`);
    return null;
  }
}

function credentialPair(first: string, second: string) {
  if (Boolean(value(first)) !== Boolean(value(second))) errors.push(`${first} and ${second} must be set together.`);
}

function validateNodeVersion() {
  const [major, minor] = process.versions.node.split(".").map(Number);
  if (major < 22 || (major === 22 && minor < 13)) errors.push(`Node ${process.versions.node} is unsupported; use Node 22.13 or newer.`);
}

function validateAiProvider(kind: "CHAT" | "EMBEDDING") {
  const provider = (value(`AI_${kind}_PROVIDER`) || value("AI_PROVIDER") || "disabled").toLowerCase().replace(/-/g, "_");
  const allowed = kind === "CHAT"
    ? new Set(["disabled", "openai", "ollama", "openai_compatible", "compatible", "kimi"])
    : new Set(["disabled", "openai", "ollama", "openai_compatible", "compatible"]);
  if (!allowed.has(provider)) {
    errors.push(`AI_${kind}_PROVIDER has unsupported value '${provider}'.`);
    return;
  }
  if (provider === "openai") required("OPENAI_API_KEY", 20);
  if (provider === "ollama") parsedUrl("OLLAMA_BASE_URL", false);
  if (provider === "kimi") {
    parsedUrl("KIMI_BASE_URL");
    required("KIMI_CHAT_MODEL");
  }
  if (provider === "openai_compatible" || provider === "compatible") {
    parsedUrl("AI_COMPATIBLE_BASE_URL");
    required(kind === "CHAT" ? "AI_COMPATIBLE_CHAT_MODEL" : "AI_COMPATIBLE_EMBEDDING_MODEL");
  }
}

function main() {
  validateNodeVersion();
  if (value("APP_ENV") !== "production") errors.push("APP_ENV must be production.");

  const appUrl = parsedUrl("APP_URL");
  const publicUrl = parsedUrl("NEXT_PUBLIC_SITE_URL");
  if (appUrl && publicUrl && appUrl.origin !== publicUrl.origin) {
    errors.push("APP_URL and NEXT_PUBLIC_SITE_URL must use the same origin.");
  }

  const appKey = required("APP_KEY", 32);
  const authSecret = required("BETTER_AUTH_SECRET", 32);
  if (appKey && authSecret && appKey === authSecret) errors.push("APP_KEY and BETTER_AUTH_SECRET must be different secrets.");
  const betterAuthUrl = parsedUrl("BETTER_AUTH_URL");
  if (appUrl && betterAuthUrl && appUrl.origin !== betterAuthUrl.origin) errors.push("APP_URL and BETTER_AUTH_URL must use the same origin.");

  required("DB_HOST");
  required("DB_PORT");
  required("DB_DATABASE");
  const dbUser = required("DB_USERNAME");
  required("DB_PASSWORD", 12);
  if (dbUser.toLowerCase() === "root") errors.push("DB_USERNAME must be a dedicated non-root production user.");
  if (value("DB_SSL") !== "true") warnings.push("DB_SSL is not enabled; ensure the database is on a trusted private network.");

  required("ADMIN_NAME");
  required("ADMIN_EMAIL");
  required("ADMIN_PASSWORD", 16);
  const schedulerSecret = required("SCHEDULER_CRON_SECRET", 32);
  const newsletterSecret = required("NEWSLETTER_CRON_SECRET", 32);
  if (schedulerSecret && newsletterSecret && schedulerSecret === newsletterSecret) {
    errors.push("SCHEDULER_CRON_SECRET and NEWSLETTER_CRON_SECRET must be different secrets.");
  }

  const storage = value("FILESYSTEM_DISK").toLowerCase();
  if (!new Set(["local", "s3", "google_drive", "drive"]).has(storage)) {
    errors.push("FILESYSTEM_DISK must be local, s3 or google_drive.");
  }
  if (storage === "local") {
    const localRoot = required("LOCAL_STORAGE_ROOT");
    if (localRoot && !path.isAbsolute(localRoot)) errors.push("LOCAL_STORAGE_ROOT must be an absolute path in production.");
    warnings.push("Local media storage requires server backups and must remain outside disposable deployment output.");
  }
  if (storage === "s3") {
    required("AWS_BUCKET");
    required("AWS_DEFAULT_REGION");
    credentialPair("AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY");
    if (value("AWS_PUBLIC_URL")) parsedUrl("AWS_PUBLIC_URL");
  }
  if (storage === "google_drive" || storage === "drive") {
    required("GOOGLE_DRIVE_CLIENT_ID");
    required("GOOGLE_DRIVE_CLIENT_SECRET");
    parsedUrl("GOOGLE_DRIVE_REDIRECT_URI");
  }

  if ((value("MAIL_MAILER") || "log").toLowerCase() === "log") errors.push("MAIL_MAILER must use a production SMTP transport, not log.");
  required("MAIL_HOST");
  required("MAIL_FROM_ADDRESS");
  required("MAIL_TO_ADDRESS");
  required("MAIL_USERNAME");
  required("MAIL_PASSWORD", 12);

  if ((value("NEWSLETTER_MAILER") || "log").toLowerCase() === "log") warnings.push("NEWSLETTER_MAILER is still in log mode; campaigns will not be delivered.");
  if ((value("NEWSLETTER_MAILER") || "log").toLowerCase() !== "log") {
    required("NEWSLETTER_MAIL_HOST");
    required("NEWSLETTER_MAIL_FROM_ADDRESS");
    required("NEWSLETTER_MAIL_USERNAME");
    required("NEWSLETTER_MAIL_PASSWORD", 12);
  }

  validateAiProvider("CHAT");
  validateAiProvider("EMBEDDING");

  for (const warning of warnings) console.warn(`Warning: ${warning}`);
  if (errors.length) {
    for (const error of errors) console.error(`Error: ${error}`);
    throw new Error(`Release environment validation failed with ${errors.length} error(s).`);
  }
  console.log("Release environment validation passed.");
}

function runProjectChecks() {
  const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
  const result = spawnSync(npmCommand, ["run", "check"], {
    env: process.env,
    stdio: "inherit",
  });

  if (result.error) throw result.error;
  if (result.signal) throw new Error(`Project checks terminated by signal ${result.signal}.`);
  if (result.status !== 0) throw new Error(`Project checks failed with exit code ${result.status ?? "unknown"}.`);
}

try {
  main();
  runProjectChecks();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
