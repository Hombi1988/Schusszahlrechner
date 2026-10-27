// Offline-Speicher für den Schusszahlrechner. Bei jeder neuen Version die Nummer erhöhen.
const CACHE = "schusszahl-v9";
const FILES = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "apple-touch-icon.png", "firebase.js"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, {cache: "reload"})))).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  if (new URL(req.url).origin !== self.location.origin) return; // Firebase & Co. nie zwischenspeichern
  const isPage = req.mode === "navigate" || req.destination === "document";
  if (isPage) {
    // Seite: zuerst Internet (neueste Version), ohne Netz aus dem Offline-Speicher
    e.respondWith(fetch(req, {cache: "no-store"}).then(res => {
      const copy = res.clone(); caches.open(CACHE).then(c => c.put("index.html", copy)); return res;
    }).catch(() => caches.match("index.html", {ignoreSearch: true}).then(r => r || caches.match("./"))));
    return;
  }
  e.respondWith(caches.match(req, {ignoreSearch: true}).then(hit => hit || fetch(req).then(res => {
    const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res;
  })));
});
