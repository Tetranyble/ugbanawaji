export function appTimeZone() {
  return process.env.APP_TIMEZONE || "Africa/Lagos";
}

type LocalParts = { year: number; month: number; day: number; hour: number; minute: number; second?: number };

function partsInTimeZone(date: Date, timeZone: string): LocalParts {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return { year: value("year"), month: value("month"), day: value("day"), hour: value("hour"), minute: value("minute"), second: value("second") };
}

function timeZoneOffsetMs(date: Date, timeZone: string) {
  const p = partsInTimeZone(date, timeZone);
  const representedAsUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second ?? 0);
  return representedAsUtc - date.getTime();
}

/** Convert a datetime-local value (YYYY-MM-DDTHH:mm) in APP_TIMEZONE to an absolute UTC Date. */
export function parseAppDateTime(value: string, timeZone = appTimeZone()) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value.trim());
  if (!match) return null;
  const [, y, m, d, h, min, sec = "0"] = match;
  const localAsUtc = Date.UTC(Number(y), Number(m) - 1, Number(d), Number(h), Number(min), Number(sec));
  if (!Number.isFinite(localAsUtc)) return null;

  // Resolve the zone offset twice so DST transitions are handled for normal, unambiguous wall times.
  let candidate = new Date(localAsUtc);
  let offset = timeZoneOffsetMs(candidate, timeZone);
  candidate = new Date(localAsUtc - offset);
  const correctedOffset = timeZoneOffsetMs(candidate, timeZone);
  if (correctedOffset !== offset) candidate = new Date(localAsUtc - correctedOffset);

  const p = partsInTimeZone(candidate, timeZone);
  if (p.year !== Number(y) || p.month !== Number(m) || p.day !== Number(d) || p.hour !== Number(h) || p.minute !== Number(min)) {
    return null;
  }
  return candidate;
}

/** Format an absolute timestamp for an HTML datetime-local input using APP_TIMEZONE. */
export function formatAppDateTimeLocal(value: Date | string | null | undefined, timeZone = appTimeZone()) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const p = partsInTimeZone(date, timeZone);
  const pad = (v: number) => String(v).padStart(2, "0");
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}

export function formatAppDateTime(value: Date | string | null | undefined, timeZone = appTimeZone()) {
  if (!value) return "";
  const date = new Date(value);
  return new Intl.DateTimeFormat("en", {
    timeZone,
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
}
