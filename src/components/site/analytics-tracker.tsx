"use client";
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import mixpanel from "mixpanel-browser";

const mixpanelToken = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
const privatePathPrefixes = ["/admin", "/api", "/preview", "/newsletter/confirm", "/newsletter/unsubscribe"];
let mixpanelInitialized = false;
let mixpanelPaused = false;

function isTrackablePath(pathname: string) {
  return !privatePathPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function initMixpanel() {
  if (!mixpanelToken || mixpanelInitialized) return mixpanelInitialized;
  mixpanel.init(mixpanelToken, {
    api_host: "https://api-eu.mixpanel.com",
    autocapture: {
      block_url_regexes: privatePathPrefixes.map((prefix) => new RegExp(`${prefix}(?:/|$)`)),
      block_selectors: ["input", "textarea", "select", "[contenteditable='true']", ".mp-sensitive"],
    },
    track_pageview: false,
    record_sessions_percent: 100,
    record_mask_all_inputs: true,
    record_mask_text_selector: ".mp-sensitive",
    record_block_selector: "img, video, audio, .mp-sensitive",
    record_console: false,
    record_network: false,
    ignore_dnt: false,
    secure_cookie: process.env.NODE_ENV === "production",
  });
  mixpanelInitialized = true;
  return true;
}

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
    if (!pathname) return;
    if (!isTrackablePath(pathname)) {
      if (mixpanelInitialized && !mixpanelPaused) {
        mixpanel.stop_session_recording();
        mixpanelPaused = true;
      }
      return;
    }
    if (initMixpanel() && mixpanelPaused) {
      mixpanel.start_session_recording();
      mixpanelPaused = false;
    }
    const query = search.toString();
    const path = query ? `${pathname}?${query}` : pathname;
    const timer = window.setTimeout(() => {
      if (mixpanelInitialized) mixpanel.track_pageview({ path });
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
    if (isTrackablePath(location.pathname) && initMixpanel()) mixpanel.track(eventType, metadata);
    void fetch("/api/analytics", { method: "POST", headers: { "content-type": "application/json" }, keepalive: true, body: JSON.stringify({ eventType, path: location.pathname, referrer: document.referrer, sessionId: sessionId(), metadata }) });
  } catch {}
}
