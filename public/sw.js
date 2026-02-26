const CACHE_NAME = 'medea-v2';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
];

// Install - cache shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // Skip API, auth, and source file requests
  if (
    url.pathname.startsWith('/rest/') ||
    url.pathname.startsWith('/auth/') ||
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/node_modules/') ||
    url.pathname.startsWith('/@') ||
    url.pathname.includes('.tsx') ||
    url.pathname.includes('.ts') ||
    url.pathname.includes('.jsx')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Only cache successful, non-opaque responses
        if (response && response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cached) => {
          // Return cached response or a proper fallback, never undefined
          return cached || new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
        });
      })
  );
});
