/* ============================================
   MONARCH - Service Worker Cleanup
   This version unregisters itself and clears caches
   ============================================ */

// Immediately unregister this service worker
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    // Clear all caches
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => {
      // Unregister this service worker
      return self.registration.unregister();
    }).then(() => {
      // Refresh all open pages
      return self.clients.matchAll().then((clients) => {
        clients.forEach((client) => client.navigate(client.url));
      });
    })
  );
});
