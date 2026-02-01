/**
 * TrvicERP PWA Service Worker
 * - 離線快取策略：App Shell (Cache First) + API (Network First)
 * - 背景同步：離線操作排隊
 * - 推播通知：天氣 / 行程提醒
 * - Geofencing 支援：景點接近通知
 */

const CACHE_VERSION = 'v2';
const STATIC_CACHE = `trvic-static-${CACHE_VERSION}`;
const API_CACHE = `trvic-api-${CACHE_VERSION}`;
const IMAGE_CACHE = `trvic-images-${CACHE_VERSION}`;

// App Shell 靜態資源（Cache First）
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
];

// API 路徑前綴（Network First）
const API_PREFIXES = ['/api/'];

// 圖片快取 Max
const IMAGE_CACHE_LIMIT = 100;

// ============ Install ============

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// ============ Activate ============

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== API_CACHE && key !== IMAGE_CACHE)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ============ Fetch ============

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip chrome-extension and other schemes
  if (!url.protocol.startsWith('http')) return;

  // API requests: Network First with cache fallback
  if (API_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) {
    event.respondWith(networkFirstStrategy(event.request, API_CACHE));
    return;
  }

  // Images: Cache First with network fallback
  if (/\.(png|jpg|jpeg|gif|webp|svg|ico)$/i.test(url.pathname)) {
    event.respondWith(cacheFirstStrategy(event.request, IMAGE_CACHE));
    return;
  }

  // Static assets: Cache First
  event.respondWith(cacheFirstStrategy(event.request, STATIC_CACHE));
});

// ============ Strategies ============

async function cacheFirstStrategy(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());

      // Limit image cache size
      if (cacheName === IMAGE_CACHE) {
        limitCacheSize(cacheName, IMAGE_CACHE_LIMIT);
      }
    }
    return response;
  } catch {
    // Return offline fallback for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/index.html');
    }
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirstStrategy(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: 'offline', message: '離線模式，資料可能不是最新' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function limitCacheSize(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    await cache.delete(keys[0]);
    limitCacheSize(cacheName, maxItems);
  }
}

// ============ Push Notifications ============

self.addEventListener('push', (event) => {
  let data = { title: 'TrvicERP', body: '您有新的通知', tag: 'default' };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: data.tag || 'default',
    data: data,
    vibrate: [200, 100, 200],
    actions: [],
  };

  // Weather alert actions
  if (data.tag === 'weather') {
    options.actions = [
      { action: 'view', title: '查看詳情' },
      { action: 'dismiss', title: '已知悉' },
    ];
  }

  // Tour guide / geofencing
  if (data.tag === 'tour_guide') {
    options.actions = [
      { action: 'audio', title: '播放導覽' },
      { action: 'map', title: '查看地圖' },
    ];
  }

  // Schedule alert
  if (data.tag === 'schedule') {
    options.actions = [
      { action: 'view', title: '查看行程' },
    ];
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  const data = event.notification.data || {};

  let url = '/';
  if (action === 'view' && data.url) {
    url = data.url;
  } else if (action === 'audio' && data.audio_url) {
    url = data.audio_url;
  } else if (action === 'map' && data.lat && data.lng) {
    url = `https://www.google.com/maps?q=${data.lat},${data.lng}`;
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.postMessage({ type: 'NOTIFICATION_CLICK', action, data });
          return;
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

// ============ Background Sync ============

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-import-data') {
    event.waitUntil(syncImportData());
  }
  if (event.tag === 'sync-offline-actions') {
    event.waitUntil(syncOfflineActions());
  }
});

async function syncImportData() {
  // Retrieve queued import data from IndexedDB and POST to backend
  try {
    const db = await openDB();
    const tx = db.transaction('sync_queue', 'readonly');
    const store = tx.objectStore('sync_queue');
    const items = await getAllFromStore(store);

    for (const item of items) {
      try {
        await fetch('/api/v1/import/upsert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.data),
        });
        // Remove from queue on success
        const deleteTx = db.transaction('sync_queue', 'readwrite');
        deleteTx.objectStore('sync_queue').delete(item.id);
      } catch {
        // Will retry on next sync
        break;
      }
    }
  } catch {
    // IndexedDB not available
  }
}

async function syncOfflineActions() {
  // Similar pattern for other offline actions
}

// ============ IndexedDB Helpers ============

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('trvic_sw', 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('sync_queue')) {
        db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getAllFromStore(store) {
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ============ Periodic Sync (Tour Guide) ============

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'weather-check') {
    event.waitUntil(checkWeatherAndNotify());
  }
  if (event.tag === 'morning-briefing') {
    event.waitUntil(morningBriefing());
  }
  if (event.tag === 'evening-summary') {
    event.waitUntil(eveningSummary());
  }
});

async function checkWeatherAndNotify() {
  try {
    const resp = await fetch('/api/v1/weather/alerts?location=臺北市');
    if (!resp.ok) return;
    const data = await resp.json();
    if (data.alerts && data.alerts.length > 0) {
      self.registration.showNotification('天氣提醒', {
        body: data.alerts[0].summary,
        tag: 'weather',
        icon: '/favicon.ico',
      });
    }
  } catch {
    // Offline, skip
  }
}

async function morningBriefing() {
  const hour = new Date().getHours();
  if (hour !== 6) return; // Only at 06:00

  self.registration.showNotification('早安！今日行程提醒', {
    body: '點擊查看今日天氣和行程安排',
    tag: 'schedule',
    icon: '/favicon.ico',
    data: { url: '/?view=today' },
  });
}

async function eveningSummary() {
  const hour = new Date().getHours();
  if (hour !== 21) return; // Only at 21:00

  self.registration.showNotification('今日總結', {
    body: '查看今天的行程回顧和明天的安排',
    tag: 'schedule',
    icon: '/favicon.ico',
    data: { url: '/?view=summary' },
  });
}
