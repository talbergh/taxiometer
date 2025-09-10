const CACHE_NAME = 'taxiometer-v2';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Skip unsupported schemes (extensions etc.)
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // Cache OSM tiles separately with a runtime cache
  if (/tile\.openstreetmap\.org/.test(url.host)) {
    event.respondWith(
      caches.open('osm-tiles').then(async (cache) => {
        const cached = await cache.match(req);
        const network = fetch(req).then((res) => { cache.put(req, res.clone()); return res; }).catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req).then((res) => { const copy = res.clone(); caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)); return res; }).catch(() => cached || caches.match('./'));
      return cached || fetchPromise;
    })
  );
});
