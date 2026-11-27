'use strict';
const BUILD = '20261127.1';
const CACHE_PREFIX = 'flag-game-v2:' + self.registration.scope;
const CACHE = CACHE_PREFIX + ':' + BUILD;
const FILES = [
  './', './index.html', './neon.css?v=' + BUILD,
  './assets.js?v=' + BUILD, './flags.js?v=' + BUILD, './game.js?v=' + BUILD, './manifest.webmanifest'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key =>
    (key.startsWith(CACHE_PREFIX) && key !== CACHE) || key.startsWith('odgadnij-flage-neon-')
  ).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;
  if (event.request.mode === 'navigate') {
    // HTML always checks the server first, so an older installed copy can update.
    event.respondWith(fetch(event.request).then(response => {
      if (!response.ok) throw new Error('Navigation unavailable');
      const copy = response.clone();
      event.waitUntil(caches.open(CACHE).then(cache => cache.put(event.request, copy)));
      return response;
    }).catch(() => caches.open(CACHE).then(cache => cache.match('./index.html'))));
    return;
  }
  event.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match(event.request);
    return cached || fetch(event.request);
  }));
});
