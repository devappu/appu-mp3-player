'use strict';

const CACHE_NAME = 'appu-mp3-player-v2';

const APP_SHELL = [
  '/player/',
  '/player/index.html',
  '/player/style.css',
  '/player/app.js',
  '/player/manifest.json',
  '/player/icons/icon-512.webp'
];

self.addEventListener('install', function (event) {

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function (cache) {
        return cache.addAll(APP_SHELL);
      })
      .then(function () {
        return self.skipWaiting();
      })
  );

});

self.addEventListener('activate', function (event) {

  event.waitUntil(
    caches.keys()
      .then(function (cacheNames) {

        return Promise.all(
          cacheNames
            .filter(function (cacheName) {
              return cacheName !== CACHE_NAME;
            })
            .map(function (cacheName) {
              return caches.delete(cacheName);
            })
        );

      })
      .then(function () {
        return self.clients.claim();
      })
  );

});

self.addEventListener('fetch', function (event) {

  if (event.request.method !== 'GET') {
    return;
  }

  const requestURL = new URL(event.request.url);

  if (requestURL.origin !== self.location.origin) {
    return;
  }

  if (!requestURL.pathname.startsWith('/player/')) {
    return;
  }

  event.respondWith(

    caches.match(event.request)
      .then(function (cachedResponse) {

        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request)
          .then(function (networkResponse) {

            if (
              !networkResponse ||
              !networkResponse.ok
            ) {
              return networkResponse;
            }

            const responseToCache =
              networkResponse.clone();

            caches.open(CACHE_NAME)
              .then(function (cache) {
                cache.put(
                  event.request,
                  responseToCache
                );
              });

            return networkResponse;

          });

      })

  );

});
