// Offline support: cache the app shell, always try the network first so updates show up.
const CACHE = "celestial-v3";
const SHELL = ["./", "index.html", "styles.css", "manifest.webmanifest", "icons/icon.svg", "icons/icon-192.png",
  "js/i18n.js", "js/data.js", "js/data-fr.js", "js/content-fr.js", "js/astro.js", "js/reading.js", "js/destiny.js", "js/places.js", "js/life.js", "js/views.js", "js/sync.js", "js/app.js"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return; // city search and fonts go straight to the network
  e.respondWith(
    fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match(e.request).then((r) => r || caches.match("index.html")))
  );
});
