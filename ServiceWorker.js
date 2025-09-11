// Service Worker for Cabra PWA
const CACHE_NAME = 'cabra-v3';
const ASSETS = [
  // Core pages
  'app.html',
  'index.html',
  'share.html',
  'manifest.json',
  
  // Styles
  "assets/stylesheets/App.css",
  "assets/stylesheets/Landing.css",
  
  // App modules (ESM)
  "assets/javascripts/core/App.js",
  "assets/javascripts/map/GPS.js",
  "assets/javascripts/map/FareCalculator.js",
  "assets/javascripts/core/Storage.js",
  "assets/javascripts/interface/UI.js",
  "assets/javascripts/interface/I18N.js",
  "assets/javascripts/map/Map.js",
  "assets/javascripts/core/Router.js",
  "assets/javascripts/interface/QRCode.js",
  "assets/javascripts/interface/screens/Onboarding.js",
  "assets/javascripts/interface/screens/Landing.js",
  "assets/javascripts/interface/AutoComplete.js",
  "assets/javascripts/library/QRCode.min.js",
  
  // Images
  'assets/images/icon-192.png',
  'assets/images/icon-512.png',
  "assets/images/svgs/welcome.svg",
  "assets/images/svgs/personal_data.svg",
  "assets/images/svgs/gps.svg",
  "assets/images/svgs/earn.svg",
  "assets/images/svgs/offline.svg",
  "assets/images/svgs/receipt.svg",
  
  // Third-party local copies
  "assets/stylesheets/library/Leaflet.min.css",
  "assets/javascripts/library/Leaflet.min.js",
  "assets/stylesheets/library/FontAwesome.min.css",
  "assets/javascripts/library/FontAwesome.min.js",
  "assets/javascripts/library/JQuery.min.js"
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
