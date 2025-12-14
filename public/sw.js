// Service Worker - PWA 支持
// 版本由构建时自动注入，如未注入则使用时间戳
const SW_VERSION = self.__SW_VERSION__ || Date.now().toString(36);
const CACHE_NAME = `searchgal-cache-${SW_VERSION}`;

// 静态资源缓存列表（核心资源）
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
];

// 缓存策略配置
const CACHE_STRATEGIES = {
  // 缓存优先（适用于静态资源）
  cacheFirst: ['script', 'style', 'font'],
  // 网络优先（适用于动态内容）
  networkFirst: ['document'],
  // 仅网络（适用于 API 请求）
  networkOnly: [],
  // 过期时间（毫秒）
  maxAge: {
    image: 7 * 24 * 60 * 60 * 1000,  // 图片 7 天
    script: 24 * 60 * 60 * 1000,      // 脚本 1 天
    style: 24 * 60 * 60 * 1000,       // 样式 1 天
    font: 30 * 24 * 60 * 60 * 1000,   // 字体 30 天
  },
};

// 安装事件 - 预缓存核心资源
self.addEventListener('install', (event) => {
  console.log(`[SW] Installing version ${SW_VERSION}`);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Pre-caching core assets');
        return cache.addAll(CORE_ASSETS);
      })
      .then(() => {
        console.log('[SW] Installation complete');
    })
  );
  
  // 立即激活新版本，不等待旧版本关闭
  self.skipWaiting();
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', (event) => {
  console.log(`[SW] Activating version ${SW_VERSION}`);
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
            // 删除所有不匹配当前版本的缓存
            if (cacheName.startsWith('searchgal-cache-') && cacheName !== CACHE_NAME) {
              console.log(`[SW] Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    })
      .then(() => {
        console.log('[SW] Activation complete');
      })
  );
  
  // 立即接管所有客户端
  self.clients.claim();
});

// 消息处理
self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};
  
  switch (type) {
    case 'GET_VERSION':
      // 返回当前版本
      event.ports[0]?.postMessage({ 
        version: SW_VERSION,
        cacheSize: null, // 可扩展：返回缓存大小
      });
      break;
      
    case 'SKIP_WAITING':
      // 跳过等待，立即激活
      self.skipWaiting();
      break;
      
    case 'CLEAR_CACHE':
      // 清除所有缓存
      event.waitUntil(
        caches.keys().then((names) => {
          return Promise.all(names.map((name) => caches.delete(name)));
        }).then(() => {
          event.ports[0]?.postMessage({ success: true });
        })
      );
      break;
      
    case 'GET_CACHE_INFO':
      // 获取缓存信息
      event.waitUntil(
        caches.keys().then(async (names) => {
          const info = {};
          for (const name of names) {
            const cache = await caches.open(name);
            const keys = await cache.keys();
            info[name] = keys.length;
          }
          event.ports[0]?.postMessage({ caches: info, current: CACHE_NAME });
        })
      );
      break;
  }
});

// 请求拦截
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 跳过非 GET 请求
  if (request.method !== 'GET') {
    return;
  }
  
  // 跳过 chrome-extension 等非 http(s) 请求
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // 跳过 API 请求（不缓存动态数据）
  if (url.pathname.startsWith('/api/') || url.hostname.includes('api.')) {
    return;
  }
  
  // 外部资源：网络优先
  if (url.origin !== location.origin) {
    event.respondWith(networkFirst(request));
    return;
  }

  // 根据资源类型选择策略
  const destination = request.destination;
  
  if (CACHE_STRATEGIES.cacheFirst.includes(destination)) {
    // 静态资源：缓存优先 + 后台更新
    event.respondWith(staleWhileRevalidate(request));
  } else if (destination === 'image') {
    // 图片：缓存优先（更长的过期时间）
    event.respondWith(cacheFirst(request));
  } else {
    // 其他（HTML等）：网络优先
    event.respondWith(networkFirst(request));
  }
});

/**
 * 缓存优先策略
 * 优先返回缓存，缓存不存在时从网络获取并缓存
 */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
          return response;
  } catch (error) {
    // 网络失败时返回离线页面（如果有）
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

/**
 * 网络优先策略
 * 优先从网络获取，网络失败时返回缓存
 */
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
          }
          return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

/**
 * Stale-While-Revalidate 策略
 * 立即返回缓存，同时在后台更新缓存
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  
  // 后台更新缓存
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
        }
        return response;
  }).catch(() => null);
  
  // 有缓存则立即返回，否则等待网络
  return cached || fetchPromise || new Response('Offline', { status: 503 });
}

// 输出版本信息
console.log(`[SW] Service Worker loaded, version: ${SW_VERSION}`);
