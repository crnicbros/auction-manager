// ============================================================
// SERVICE WORKER — Auction Manager Pro
// Bump CACHE_VERSION whenever you push new code to GitHub
// ============================================================
const CACHE_VERSION = 'v1.0.5';
const CACHE_NAME = 'auction-manager-' + CACHE_VERSION;

const PRECACHE = [
  './',
  './index.html',
  'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
  'https://accounts.google.com/gsi/client'
];

// Install — cache core assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

// Activate — delete old caches so app auto-updates
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch — serve from cache, fall back to network
self.addEventListener('fetch', e => {
  // Skip non-GET and chrome-extension requests
  if(e.request.method !== 'GET') return;
  if(e.request.url.startsWith('chrome-extension')) return;
  // Always go network-first for Google APIs
  if(e.request.url.includes('googleapis.com') ||
     e.request.url.includes('anthropic.com') ||
     e.request.url.includes('accounts.google.com')) {
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => {
      const network = fetch(e.request).then(res => {
        if(res && res.status === 200 && res.type !== 'opaque') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
