// Kill-switch service worker — replaces the old PWA service worker.
// Installs immediately, clears all caches, and unregisters itself.
// The next navigation loads fresh from the network.
// Keep this file indefinitely — removing it would 404, which keeps old SWs alive.

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .then(() => self.registration.unregister()),
  );
});
