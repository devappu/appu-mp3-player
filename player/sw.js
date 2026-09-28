'use strict';

self.addEventListener('install', function (event) {
  event.waitUntil(
    self.skipWaiting()
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (cacheNames) {
        return Promise.all(
          cacheNames.map(function (cacheName) {
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
    fetch(event.request, {
      cache: 'no-store'
    })
  );

});
