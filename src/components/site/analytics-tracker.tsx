"use client";
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function sessionId() {
  const key = "ugbanawaji-session";
  let value = sessionStorage.getItem(key);
  if (!value) { value = crypto.randomUUID(); sessionStorage.setItem(key, value); }
  return value;
}

export function AnalyticsTracker() {
  const pathname = usePathname();
  const search = useSearchParams();
  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    const query = search.toString();
    const path = query ? `${pathname}?${query}` : pathname;
    const timer = window.setTimeout(() => {
      void fetch("/api/analytics", {
        method: "POST", headers: { "content-type": "application/json" }, keepalive: true,
        body: JSON.stringify({ eventType: "page_view", path, referrer: document.referrer, sessionId: sessionId() }),
      });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [pathname, search]);
  return null;
}

export function trackEvent(eventType: string, metadata: Record<string, unknown> = {}) {
  try {
    void fetch("/api/analytics", { method: "POST", headers: { "content-type": "application/json" }, keepalive: true, body: JSON.stringify({ eventType, path: location.pathname, referrer: document.referrer, sessionId: sessionId(), metadata }) });
  } catch {}
}
