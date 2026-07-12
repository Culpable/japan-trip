const CACHE_PREFIX = 'jalena-japan-trip-';
const CACHE_NAME = `${CACHE_PREFIX}v4`;
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/pikachu.png',
  './assets/pikachu-animated.gif',
  './assets/app-icon-192.png',
  './assets/app-icon-512.png',
  './assets/apple-touch-icon.png',
  './assets/favicon-32.png',
  './assets/favicon-64.png',
  './assets/favicon.ico',
  './og-image.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const isSameOrigin = new URL(event.request.url).origin === self.location.origin;
          if (response.ok && isSameOrigin) {
            const copy = response.clone();
            event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', copy)));
          }
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  const networkResponse = fetch(event.request);
  const cacheUpdate = networkResponse.then((response) => {
    if (response.ok || response.type === 'opaque') {
      const copy = response.clone();
      return caches.open(CACHE_NAME)
        .then((cache) => cache.put(event.request, copy))
        .then(() => response);
    }
    return response;
  });

  // Serve cached assets immediately, then refresh them for the next request.
  event.waitUntil(cacheUpdate.catch(() => undefined));
  event.respondWith(
    caches.match(event.request).then((cached) => cached || networkResponse)
  );
});
