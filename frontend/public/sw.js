const CACHE = "farmhub-shell-v1";
const SHELL = ["/", "/index.html", "/manifest.json", "/farm-icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;

  // Never cache API responses: market, weather, forecast and inquiry data must stay fresh.
  if (new URL(request.url).pathname.startsWith("/api/")) return;

  event.respondWith(
    fetch(request).catch(() => caches.match(request).then((cached) => cached || caches.match("/index.html")))
  );
});
