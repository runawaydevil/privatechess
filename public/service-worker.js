const CACHE_NAME = 'private-chess-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/main.js',
  '/chess.min.js',
  '/baby.gif',
  '/manifest.json',
  '/favicon.ico'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
}); 