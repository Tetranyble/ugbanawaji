import { createHash } from "node:crypto";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { mixpanelEvents } from "@/db/schema";

type MixpanelProperties = Record<string, unknown>;
type MixpanelExportEvent = { event?: unknown; properties?: MixpanelProperties };

const PAGE_VIEW_EVENTS = new Set(["$mp_web_page_view", "page_view"]);
const PRIVATE_PATH_PREFIXES = ["/admin", "/api", "/preview", "/newsletter/confirm", "/newsletter/unsubscribe"];
const SENSITIVE_PROPERTY = /(?:^|[_$])(distinct|device_id|session_id|user_id|email|password|secret|token|question|message|elements?|ip|latitude|longitude|user_agent)(?:$|_)/i;

function stringValue(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized ? normalized.slice(0, maxLength) : null;
}

function firstString(properties: MixpanelProperties, keys: string[], maxLength: number) {
  for (const key of keys) {
    const value = stringValue(properties[key], maxLength);
    if (value) return value;
  }
  return null;
}

function hashValue(value: unknown) {
  const normalized = stringValue(value, 2_000);
  return normalized ? createHash("sha256").update(normalized).digest("hex") : null;
}

function eventDate(value: unknown) {
  const numeric = typeof value === "number" ? value : Number(value);
  const milliseconds = numeric > 10_000_000_000 ? numeric : numeric * 1_000;
  const date = new Date(milliseconds);
  return Number.isFinite(date.getTime()) ? date : new Date();
}

function safeUrl(value: unknown) {
  const url = stringValue(value, 4_000);
  if (!url) return null;
  try { return new URL(url); } catch { return null; }
}

function safePath(properties: MixpanelProperties) {
  const url = safeUrl(properties.$current_url ?? properties.current_url ?? properties.url);
  const path = url?.pathname ?? firstString(properties, ["$pathname", "pathname", "path"], 700);
  if (!path || !path.startsWith("/")) return null;
  return path.slice(0, 700);
}

function isPrivatePath(path: string | null) {
  return Boolean(path && PRIVATE_PATH_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`)));
}

function safeMetadata(properties: MixpanelProperties) {
  const metadata: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (Object.keys(metadata).length >= 100 || SENSITIVE_PROPERTY.test(key)) continue;
    if (["$current_url", "current_url", "url", "$referrer", "referrer", "time", "$insert_id"].includes(key)) continue;
    if (typeof value === "string") metadata[key] = value.slice(0, 1_000);
    else if (typeof value === "number" || typeof value === "boolean" || value === null) metadata[key] = value;
  }
  return metadata;
}

function normalizeEvent(raw: MixpanelExportEvent, projectId: string, syncedAt: Date) {
  const eventType = stringValue(raw.event, 160);
  const properties = raw.properties && typeof raw.properties === "object" ? raw.properties : {};
  if (!eventType) return null;
  const path = safePath(properties);
  if (isPrivatePath(path)) return null;
  const occurredAt = eventDate(properties.time);
  const rawInsertId = firstString(properties, ["$insert_id", "insert_id"], 191);
  const fallbackIdentity = JSON.stringify([eventType, occurredAt.toISOString(), properties.distinct_id ?? null, safeMetadata(properties)]);
  const insertId = rawInsertId ?? createHash("sha256").update(fallbackIdentity).digest("hex");
  const referrer = safeUrl(properties.$referrer ?? properties.referrer);
  const referrerHost = firstString(properties, ["$referring_domain", "referring_domain"], 255) ?? referrer?.hostname.slice(0, 255) ?? null;
  const source = firstString(properties, ["utm_source", "$utm_source", "source"], 255) ?? (referrerHost || (PAGE_VIEW_EVENTS.has(eventType) ? "Direct" : null));

  return {
    id: createHash("sha256").update(`${projectId}:${insertId}`).digest("hex"),
    insertId,
    eventType,
    distinctIdHash: hashValue(properties.distinct_id),
    sessionHash: hashValue(properties.$session_id ?? properties.session_id),
    path,
    referrerHost,
    source,
    medium: firstString(properties, ["utm_medium", "$utm_medium"], 160),
    campaign: firstString(properties, ["utm_campaign", "$utm_campaign"], 255),
    content: firstString(properties, ["utm_content", "$utm_content"], 255),
    term: firstString(properties, ["utm_term", "$utm_term"], 255),
    country: firstString(properties, ["mp_country_code", "$country_code", "country_code"], 8),
    region: firstString(properties, ["$region", "region"], 160),
    city: firstString(properties, ["$city", "city"], 160),
    browser: firstString(properties, ["$browser", "browser"], 120),
    operatingSystem: firstString(properties, ["$os", "os"], 120),
    device: firstString(properties, ["$device", "device"], 120),
    metadata: safeMetadata(properties),
    occurredAt,
    syncedAt,
  };
}

function dateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function requiredConfig() {
  const projectId = process.env.MIXPANEL_PROJECT_ID?.trim();
  const username = process.env.MIXPANEL_SERVICE_ACCOUNT_USERNAME?.trim();
  const secret = process.env.MIXPANEL_SERVICE_ACCOUNT_SECRET?.trim();
  if (!projectId || !username || !secret) throw new Error("Mixpanel sync requires MIXPANEL_PROJECT_ID, MIXPANEL_SERVICE_ACCOUNT_USERNAME, and MIXPANEL_SERVICE_ACCOUNT_SECRET.");
  return { projectId, username, secret, region: (process.env.MIXPANEL_REGION || "eu").toLowerCase() };
}

export async function syncMixpanelEvents() {
  const config = requiredConfig();
  const [latest] = await db.select({ occurredAt: mixpanelEvents.occurredAt }).from(mixpanelEvents).orderBy(desc(mixpanelEvents.occurredAt)).limit(1);
  const backfillDays = Math.min(365, Math.max(1, Number(process.env.MIXPANEL_SYNC_BACKFILL_DAYS) || 30));
  const now = new Date();
  const from = latest?.occurredAt
    ? new Date(latest.occurredAt.getTime() - 86_400_000)
    : new Date(now.getTime() - backfillDays * 86_400_000);
  const host = config.region === "eu" ? "data-eu.mixpanel.com" : config.region === "in" ? "data-in.mixpanel.com" : "data.mixpanel.com";
  const url = new URL(`https://${host}/api/2.0/export`);
  url.searchParams.set("project_id", config.projectId);
  url.searchParams.set("from_date", dateOnly(from));
  url.searchParams.set("to_date", dateOnly(now));
  url.searchParams.set("time_in_ms", "true");

  const response = await fetch(url, {
    headers: {
      authorization: `Basic ${Buffer.from(`${config.username}:${config.secret}`).toString("base64")}`,
      accept: "application/x-ndjson, application/json, text/plain",
      "accept-encoding": "gzip",
    },
    signal: AbortSignal.timeout(120_000),
  });
  if (!response.ok) {
    const hint = response.status === 401
      ? " Check the service-account username and secret, then confirm that the account can access this project."
      : "";
    throw new Error(`Mixpanel export failed with HTTP ${response.status}.${hint}`);
  }

  const syncedAt = new Date();
  const normalized = (await response.text()).split("\n").filter(Boolean).map((line) => {
    try { return normalizeEvent(JSON.parse(line) as MixpanelExportEvent, config.projectId, syncedAt); }
    catch { return null; }
  }).filter((event): event is NonNullable<typeof event> => Boolean(event));

  for (let offset = 0; offset < normalized.length; offset += 200) {
    const batch = normalized.slice(offset, offset + 200);
    if (!batch.length) continue;
    await db.insert(mixpanelEvents).values(batch).onDuplicateKeyUpdate({ set: { syncedAt } });
  }

  return { fetched: normalized.length, from: dateOnly(from), to: dateOnly(now), syncedAt };
}
