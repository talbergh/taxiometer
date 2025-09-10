// Service Worker for TaxiOMeter PWA
const CACHE_NAME = 'taxiometer-v1';
const ASSETS = [
  '/',
  '/app.html',
  '/index.html',
  '/share.html',
  '/assets/stylesheets/app.css',
  '/assets/javascripts/app.js',
  '/assets/javascripts/gps.js',
  '/assets/javascripts/fare.js',
  '/assets/javascripts/storage.js',
  '/assets/javascripts/ui.js',
  '/assets/images/icon-192.png',
  '/assets/images/icon-512.png',
  "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    )
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
