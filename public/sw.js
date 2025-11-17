/**
 * Service Worker for SearchGal
 * 提供离线缓存和资源预加载功能
 */

const CACHE_VERSION = 'searchgal-v1';
const CACHE_NAMES = {
  static: `${CACHE_VERSION}-static`,
  dynamic: `${CACHE_VERSION}-dynamic`,
  images: `${CACHE_VERSION}-images`,
  api: `${CACHE_VERSION}-api`
};

// 需要预缓存的静态资源
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.ico'
];

// 安装事件 - 预缓存静态资源
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAMES.static)
      .then(cache => {
        console.log('[SW] Precaching static assets');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => {
              // 删除不属于当前版本的缓存
              return !Object.values(CACHE_NAMES).includes(cacheName);
            })
            .map(cacheName => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch 事件 - 缓存策略
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // 跳过非 GET 请求
  if (request.method !== 'GET') {
    return;
  }
  
  // 跳过 Chrome 扩展请求
  if (url.protocol === 'chrome-extension:') {
    return;
  }
  
  // API 请求 - Network First 策略
  if (url.hostname === 'api.searchgal.homes') {
    event.respondWith(networkFirst(request, CACHE_NAMES.api, 5000));
    return;
  }
  
  // 随机图片 - Cache First 策略
  if (url.hostname === 'api.illlights.com') {
    event.respondWith(cacheFirst(request, CACHE_NAMES.images));
    return;
  }
  
  // npm 依赖包 - Cache First 策略
  if (url.pathname.includes('/node_modules/') || 
      url.pathname.includes('/@vite/') ||
      url.pathname.includes('/.vite/')) {
    event.respondWith(cacheFirst(request, CACHE_NAMES.static));
    return;
  }
  
  // 字体 CDN - Cache First 策略
  if (url.hostname === 'fonts.loli.net' || 
      url.hostname === 'fonts.googleapis.com' || 
      url.hostname === 'fonts.gstatic.com' ||
      url.hostname === 'gstatic.loli.net') {
    event.respondWith(cacheFirst(request, CACHE_NAMES.static));
    return;
  }
  
  // CDN 资源 - Cache First 策略
  if (url.hostname === 'registry.npmmirror.com' ||
      url.hostname === 'cdn.jsdelivr.net' ||
      url.hostname === 'unpkg.com') {
    event.respondWith(cacheFirst(request, CACHE_NAMES.static));
    return;
  }
  
  // VNDB 图片 - Cache First 策略
  if (url.hostname.includes('vndb.org')) {
    event.respondWith(cacheFirst(request, CACHE_NAMES.images));
    return;
  }
  
  // 静态资源 - Cache First 策略
  if (request.destination === 'script' || 
      request.destination === 'style' || 
      request.destination === 'font' ||
      request.destination === 'image') {
    event.respondWith(cacheFirst(request, CACHE_NAMES.static));
    return;
  }
  
  // HTML 页面 - Network First 策略
  if (request.destination === 'document') {
    event.respondWith(networkFirst(request, CACHE_NAMES.dynamic, 3000));
    return;
  }
  
  // 其他请求 - Network First 策略
  event.respondWith(networkFirst(request, CACHE_NAMES.dynamic, 5000));
});

/**
 * Cache First 策略
 * 优先从缓存读取，缓存未命中则从网络获取并缓存
 */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (cached) {
    console.log('[SW] Cache hit:', request.url);
    return cached;
  }
  
  try {
    console.log('[SW] Cache miss, fetching:', request.url);
    const response = await fetch(request);
    
    // 只缓存成功的响应
    if (response.ok) {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.error('[SW] Fetch failed:', error);
    
    // 返回离线页面或默认响应
    return new Response('离线模式：无法加载资源', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'text/plain; charset=utf-8'
      })
    });
  }
}

/**
 * Network First 策略
 * 优先从网络获取，网络失败或超时则从缓存读取
 */
async function networkFirst(request, cacheName, timeout = 5000) {
  const cache = await caches.open(cacheName);
  
  try {
    // 使用 Promise.race 实现超时控制
    const networkPromise = fetch(request);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Network timeout')), timeout)
    );
    
    const response = await Promise.race([networkPromise, timeoutPromise]);
    
    // 缓存成功的响应
    if (response.ok) {
      cache.put(request, response.clone());
    }
    
    console.log('[SW] Network success:', request.url);
    return response;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    
    const cached = await cache.match(request);
    
    if (cached) {
      console.log('[SW] Cache fallback hit:', request.url);
      return cached;
    }
    
    // 返回离线页面
    console.error('[SW] No cache available:', error);
    return new Response('离线模式：无法加载资源', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'text/plain; charset=utf-8'
      })
    });
  }
}

// 消息事件 - 处理来自页面的消息
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      })
    );
  }
});

// 推送通知事件（可选）
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'SearchGal 有新内容',
    icon: '/pwa-192x192.png',
    badge: '/favicon-32x32.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };
  
  event.waitUntil(
    self.registration.showNotification('SearchGal', options)
  );
});

// 通知点击事件
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});

