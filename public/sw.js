// =====================================================
// TrivcERP - Service Worker (PWA) - Enhanced
// =====================================================

const CACHE_NAME = 'trvicerp-v3.2.0';
const RUNTIME_CACHE = 'trvicerp-runtime-v3.2.0';
const API_CACHE = 'trvicerp-api-v3.2.0';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Cache strategies for different content types
const CACHE_STRATEGIES = {
  static: ['/', '/index.html', '/manifest.json', '/icons/'],
  api: ['/api/', 'supabase.co'],
  images: ['.png', '.jpg', '.jpeg', '.svg', '.gif', '.webp'],
  fonts: ['.woff', '.woff2', '.ttf'],
  styles: ['.css'],
  scripts: ['.js', '.jsx', '.ts', '.tsx'],
};

// Install Event - Aggressive Caching
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets...');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.error('[SW] Failed to cache static assets:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return name !== CACHE_NAME && 
                   name !== RUNTIME_CACHE && 
                   name !== API_CACHE;
          })
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - Smart Caching Strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests except Supabase
  if (!url.origin.includes(self.location.origin) && 
      !url.origin.includes('supabase.co')) {
    return;
  }

  // API requests - Network First with Cache Fallback
  if (isApiRequest(url)) {
    event.respondWith(networkFirstStrategy(request, API_CACHE));
    return;
  }

  // Static assets - Cache First with Network Fallback
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirstStrategy(request, CACHE_NAME));
    return;
  }

  // Images, fonts - Cache First
  if (isMediaAsset(url)) {
    event.respondWith(cacheFirstStrategy(request, RUNTIME_CACHE));
    return;
  }

  // Default - Network First
  event.respondWith(networkFirstStrategy(request, RUNTIME_CACHE));
});

// Strategy: Network First with Cache Fallback
async function networkFirstStrategy(request, cacheName) {
  try {
    const response = await fetch(request);
    
    // Clone and cache successful responses
    if (response && response.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // For navigation requests, return index.html
    if (request.mode === 'navigate') {
      return caches.match('/index.html');
    }
    
    // Return offline response
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'You are offline. Please check your connection.' 
      }),
      { 
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Strategy: Cache First with Network Fallback
async function cacheFirstStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Return cached response and update cache in background
    updateCacheInBackground(request, cacheName);
    return cachedResponse;
  }
  
  try {
    const response = await fetch(request);
    
    if (response && response.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.error('[SW] Failed to fetch:', request.url);
    return new Response('Offline', { status: 503 });
  }
}

// Update cache in background (stale-while-revalidate)
function updateCacheInBackground(request, cacheName) {
  fetch(request).then((response) => {
    if (response && response.status === 200) {
      caches.open(cacheName).then((cache) => {
        cache.put(request, response);
      });
    }
  }).catch(() => {
    // Ignore errors in background updates
  });
}

// Helper: Check if request is API call
function isApiRequest(url) {
  return url.pathname.startsWith('/api/') || 
         url.origin.includes('supabase.co');
}

// Helper: Check if request is static asset
function isStaticAsset(url) {
  return CACHE_STRATEGIES.static.some(pattern => 
    url.pathname.includes(pattern)
  );
}

// Helper: Check if request is media asset
function isMediaAsset(url) {
  const path = url.pathname.toLowerCase();
  return CACHE_STRATEGIES.images.some(ext => path.endsWith(ext)) ||
         CACHE_STRATEGIES.fonts.some(ext => path.endsWith(ext));
}

// Message handler for cache management
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => caches.delete(name))
        );
      }).then(() => {
        event.ports[0].postMessage({ success: true });
      })
    );
  }
});
