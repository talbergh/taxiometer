// Service Worker for TaxiOMeter PWA
const CACHE_NAME = 'taxiometer-v3';
const ASSETS = [
  // Core pages
  'app.html',
  'index.html',
  'share.html',
  'manifest.json',
  
  // Styles
  'assets/stylesheets/app.css',
  
  // App modules (ESM)
  'assets/javascripts/app.js',
  'assets/javascripts/gps.js',
  'assets/javascripts/fare.js',
  'assets/javascripts/storage.js',
  'assets/javascripts/ui.js',
  'assets/javascripts/i18n.js',
  'assets/javascripts/map.js',
  'assets/javascripts/router.js',
  'assets/javascripts/qr.js',
  'assets/javascripts/onboarding.js',
  'assets/javascripts/autocomplete.js',
  'assets/javascripts/qrcode.min.js',
  
  // Images
  'assets/images/icon-192.png',
  'assets/images/icon-512.png',
  'assets/images/welcome.svg',
  'assets/images/personal_data.svg',
  'assets/images/gps.svg',
  'assets/images/earn.svg',
  'assets/images/offline.svg',
  'assets/images/receipt.svg',
  
  // Third-party local copies
  'assets/stylesheets/leaflet.min.css',
  'assets/javascripts/leaflet.min.js',
  'assets/stylesheets/fontawesome.min.css',
  'assets/javascripts/fontawesome.min.js',
  'assets/javascripts/jquery.min.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  // For navigation requests, serve app shell when offline
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('app.html'))
    );
    return;
  }

  // Cache-first for static assets; network fallback
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req))
  );
});
