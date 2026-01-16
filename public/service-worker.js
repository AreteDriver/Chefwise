/**
 * Service Worker for ChefWise PWA
 * Enables offline support with intelligent caching strategies
 */

const CACHE_VERSION = 'v2';
const STATIC_CACHE = `chefwise-static-${CACHE_VERSION}`;
const API_CACHE = `chefwise-api-${CACHE_VERSION}`;
const IMAGE_CACHE = `chefwise-images-${CACHE_VERSION}`;

// Core assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/pantry',
  '/planner',
  '/tracker',
  '/profile',
  '/offline',
  '/manifest.json',
  '/icon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// Files to cache dynamically (network-first with cache fallback)
const CACHEABLE_ORIGINS = [
  self.location.origin,
];

/**
 * Install Event - Cache core static assets
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Activate immediately without waiting for existing pages to close
  self.skipWaiting();
});

/**
 * Activate Event - Clean up old caches
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            // Delete old version caches
            return (
              name.startsWith('chefwise-') &&
              name !== STATIC_CACHE &&
              name !== API_CACHE &&
              name !== IMAGE_CACHE
            );
          })
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  // Take control of all pages immediately
  self.clients.claim();
});

/**
 * Fetch Event - Handle requests with appropriate caching strategy
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Handle different request types with appropriate strategies

  // 1. API Requests - Network first, cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstWithCache(request, API_CACHE));
    return;
  }

  // 2. Static assets (JS, CSS) - Stale-while-revalidate
  if (isStaticAsset(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
    return;
  }

  // 3. Images - Cache first with network fallback
  if (isImage(url.pathname)) {
    event.respondWith(cacheFirstWithNetwork(request, IMAGE_CACHE));
    return;
  }

  // 4. HTML Navigation requests - Network first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(navigationRequest(request));
    return;
  }

  // 5. Everything else - Try cache, then network
  event.respondWith(cacheFirstWithNetwork(request, STATIC_CACHE));
});

/**
 * Network first with cache fallback strategy
 * Best for API requests where fresh data is preferred
 */
async function networkFirstWithCache(request, cacheName) {
  try {
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return a proper error response for API calls
    return new Response(
      JSON.stringify({ error: 'Offline', message: 'No cached data available' }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Cache first with network fallback strategy
 * Best for static assets and images
 */
async function cacheFirstWithNetwork(request, cacheName) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Return nothing for failed non-critical requests
    return new Response('', { status: 408, statusText: 'Request Timeout' });
  }
}

/**
 * Stale-while-revalidate strategy
 * Returns cached version immediately, updates cache in background
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  // Fetch fresh version in background
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  });

  // Return cached version immediately if available
  return cachedResponse || fetchPromise;
}

/**
 * Handle navigation requests with proper offline fallback
 */
async function navigationRequest(request) {
  try {
    // Try network first for navigation
    const networkResponse = await fetch(request);

    // Cache the page for offline use
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // No cached version, show offline page
    const offlinePage = await caches.match('/offline');
    if (offlinePage) {
      return offlinePage;
    }

    // Last resort fallback
    return new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

/**
 * Check if URL is a static asset
 */
function isStaticAsset(pathname) {
  return /\.(js|css|woff2?|ttf|eot)$/i.test(pathname);
}

/**
 * Check if URL is an image
 */
function isImage(pathname) {
  return /\.(png|jpg|jpeg|gif|webp|svg|ico)$/i.test(pathname);
}

/**
 * Background Sync - Process offline pantry updates when online
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pantry') {
    event.waitUntil(syncPantryItems());
  }
});

/**
 * Sync pantry items from IndexedDB to Firestore
 * Called by Background Sync when connection is restored
 */
async function syncPantryItems() {
  try {
    // Notify clients that sync is starting
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({
        type: 'SYNC_STARTED',
        payload: { tag: 'sync-pantry' },
      });
    });

    // The actual sync logic is handled by the main app
    // This just triggers the client to process its queue
    clients.forEach((client) => {
      client.postMessage({
        type: 'PROCESS_SYNC_QUEUE',
        payload: { tag: 'sync-pantry' },
      });
    });

    return Promise.resolve();
  } catch (error) {
    console.error('[SW] Sync failed:', error);
    throw error;
  }
}

/**
 * Push Notification Handler
 */
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title || 'ChefWise';
  const options = {
    body: data.body || 'New notification from ChefWise',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    data: data.url,
    vibrate: [100, 50, 100],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

/**
 * Notification Click Handler
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.notification.data) {
    event.waitUntil(clients.openWindow(event.notification.data));
  }
});

/**
 * Message Handler - Communication with main app
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }
});
