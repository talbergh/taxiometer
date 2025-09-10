# TaxiOMeter by Talbergh

Plain HTML/CSS/JS mobile-first PWA. GPS-based taxi meter: set price per km, start a ride, track route, compute distance and price, show summary. Dark mode only.

## Features
- Live GPS tracking (Geolocation API) with pause/resume
- Haversine distance, live speed, price calculation
- Route polyline on canvas (no external libs)
- Offline-first PWA (service worker), install prompt, Apple meta tags
- Settings persisted (rate, auto-zoom, keep screen awake)
- Share summary (Web Share API or clipboard fallback)

## Run locally (localhost is secure for GPS)
1) Start a static server in this folder.
2) Open the local URL in your mobile or desktop browser and allow location.

Examples:
- Python: python3 -m http.server 5173 --directory .
- Node (serve): npx serve -l 5173 .

Then open http://localhost:5173/

## Install as PWA
- Android/Chrome: Use the install button or the browser menu “Add to Home screen”.
- iOS/Safari: Share → “Zum Home-Bildschirm”. The app runs standalone with dark status bar.

## Permissions & Tips
- Location permission is required. Start the ride to prompt permission.
- GPS accuracy varies by device/environment; short jitters below ~3m are filtered.
- Keep Screen Awake uses the Screen Wake Lock API when available.

## Deploy (HTTPS required on the public web)
- GitHub Pages/Netlify/Vercel will serve over HTTPS. Upload these files as-is.

## Files
- index.html – UI, meta, runtime manifest/icons
- styles.css – dark, responsive, mobile-first design
- app.js – logic: GPS, distance, route, price, state, PWA install
- service-worker.js – offline cache

## License
Copyright © Talbergh. All rights reserved.