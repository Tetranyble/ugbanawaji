const CACHE = "ugbanawaji-v3";
const CORE = ["/", "/blog", "/work", "/search", "/offline"];

const PRIVATE_PREFIXES = [
  "/admin",
  "/api",
  "/preview",
  "/newsletter/confirm",
  "/newsletter/unsubscribe",
];

function isPrivateOrSensitive(pathname) {
  return PRIVATE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then(async (cache) => {
      for (const url of CORE) {
        try {
          await cache.add(url);
        } catch {
          // One optional public page must not prevent service-worker installation.
        }
      }
    }),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))),
      self.clients.claim(),
    ]),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (isPrivateOrSensitive(url.pathname)) return;
  if (event.request.headers.get("accept")?.includes("text/event-stream")) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok && response.type === "basic") {
          const clone = response.clone();
          void caches.open(CACHE).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;

        if (event.request.mode === "navigate") {
          return (await caches.match("/offline")) || Response.error();
        }

        return Response.error();
      }),
  );
});
