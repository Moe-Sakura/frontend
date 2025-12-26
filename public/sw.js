// Service Worker - PWA 支持（增强缓存版）
// 尽可能多地缓存文件以提升加载速度
const SW_VERSION = self.__SW_VERSION__ || Date.now().toString(36);
const CACHE_NAME = `searchgal-cache-${SW_VERSION}`;

// 缓存静态资源（尽可能多）
const CACHEABLE_PATTERNS = [
  /\/assets\/.*\.(js|css|mjs)(\?.*)?$/i,  // Vite 构建的静态资源
  /\.(woff2?|ttf|otf|eot)(\?.*)?$/i,  // 字体
  /\.(png|jpg|jpeg|gif|webp|svg|ico|avif)(\?.*)?$/i,  // 图片
  /\.(mp3|wav|ogg|m4a|aac|flac)(\?.*)?$/i,  // 音频（snd-lib 音效）
  /\.(mp4|webm|ogv)(\?.*)?$/i,  // 视频
  /\.(json|xml|txt)(\?.*)?$/i,  // 数据文件
  /\.(wasm)(\?.*)?$/i,  // WebAssembly
  /\/manifest\.json$/i,  // PWA manifest
  /\/favicon/i,  // Favicon 相关
  /\/apple-touch-icon/i,  // iOS 图标
  /\/android-chrome/i,  // Android 图标
];

// 预缓存的核心资源（安装时缓存）
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// 永不缓存
const NO_CACHE_PATTERNS = [
  /\/api\//,
  /\/sw\.js$/,
  /sockjs-node/,
  /__vite/,
  /hot-update/,
  /\.map$/,  // Source maps
];

// ============================================
// 安装事件 - 预缓存核心资源
// ============================================
self.addEventListener('install', (event) => {
  console.log(`[SW] Installing version ${SW_VERSION}`);
  
  // 预缓存失败不应阻止 service worker 安装
  const precachePromise = caches.open(CACHE_NAME)
    .then((cache) => {
      console.log('[SW] Precaching core resources');
      return cache.addAll(PRECACHE_URLS);
    })
    .catch((err) => {
      console.warn('[SW] Precache failed:', err);
    });
  
  event.waitUntil(
    precachePromise.then(() => self.skipWaiting())
  );
});

// ============================================
// 激活事件 - 清理旧缓存
// ============================================
self.addEventListener('activate', (event) => {
  console.log(`[SW] Activating version ${SW_VERSION}`);
  
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names
          .filter((name) => name.startsWith('searchgal-cache-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      ))
      .then(() => self.clients.claim())
  );
});

// ============================================
// 消息处理
// ============================================
self.addEventListener('message', (event) => {
  const { type } = event.data || {};
  
  if (type === 'GET_VERSION') {
    event.ports[0]?.postMessage({ version: SW_VERSION });
  } else if (type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys()
        .then((names) => Promise.all(names.map((name) => caches.delete(name))))
        .then(() => event.ports[0]?.postMessage({ success: true }))
    );
  }
});

// ============================================
// 请求拦截
// ============================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 跳过非 GET 请求
  if (request.method !== 'GET') return;
  
  // 跳过非 HTTP(S) 请求
  if (!url.protocol.startsWith('http')) return;
  
  // 跳过永不缓存的模式
  if (NO_CACHE_PATTERNS.some((p) => p.test(url.href))) return;

  // 同源请求
  if (url.origin === location.origin) {
    // HTML 页面请求：网络优先，离线时显示提示
    if (request.destination === 'document' || url.pathname === '/' || url.pathname.endsWith('.html')) {
      event.respondWith(handlePageRequest(request));
      return;
    }

    // 可缓存的静态资源：缓存优先（加速）
    if (CACHEABLE_PATTERNS.some((p) => p.test(url.pathname) || p.test(url.href))) {
      event.respondWith(cacheFirst(request));
      return;
    }

    // 同源其他资源：网络优先，但也缓存
    event.respondWith(networkFirst(request));
    return;
  }

  // 跨域资源：仅缓存可缓存的静态资源（如 CDN 资源）
  if (CACHEABLE_PATTERNS.some((p) => p.test(url.pathname) || p.test(url.href))) {
    event.respondWith(cacheFirstCrossOrigin(request));
    return;
  }
});

/**
 * 处理页面请求 - 离线时显示联网提示
 */
async function handlePageRequest(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch {
    // 离线 - 返回联网提示页面
    return createOfflinePage();
  }
}

/**
 * 缓存优先（用于静态资源加速）
 */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('', { status: 503 });
  }
}

/**
 * 网络优先
 */
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('', { status: 503 });
  }
}

/**
 * 缓存优先（跨域资源）
 */
async function cacheFirstCrossOrigin(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  
  try {
    // 跨域请求需要设置 mode
    const response = await fetch(request, { mode: 'cors', credentials: 'omit' });
    if (response.ok && response.type !== 'opaque') {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // 跨域失败时返回空响应
    return new Response('', { status: 503 });
  }
}

/**
 * 离线提示页面
 */
function createOfflinePage() {
  return new Response(
    `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>请连接网络 - SearchGal</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: linear-gradient(135deg, #fff5fa 0%, #ffe4f0 100%);
      color: #333;
      padding: 1.5rem;
    }
    .container {
      text-align: center;
      max-width: 400px;
    }
    .icon {
      font-size: 5rem;
      margin-bottom: 1.5rem;
      animation: float 3s ease-in-out infinite;
    }
    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
    h1 {
      font-size: 1.75rem;
      margin-bottom: 0.75rem;
      background: linear-gradient(135deg, #ff1493, #d946ef);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    p {
      color: #666;
      line-height: 1.6;
      margin-bottom: 2rem;
    }
    button {
      padding: 1rem 2.5rem;
      background: linear-gradient(135deg, #ff1493, #d946ef);
      color: white;
      border: none;
      border-radius: 9999px;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(255, 20, 147, 0.3);
    }
    button:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(255, 20, 147, 0.4);
    }
    button:active {
      transform: translateY(0);
    }
    .hint {
      margin-top: 2rem;
      font-size: 0.875rem;
      color: #999;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">🌐</div>
    <h1>需要网络连接</h1>
    <p>SearchGal 是一个在线搜索服务，<br>请连接网络后使用</p>
    <button onclick="location.reload()">重新连接</button>
    <p class="hint">请检查你的网络是否正常连接</p>
  </div>
</body>
</html>`,
    {
      status: 503,
      statusText: 'Offline',
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    }
  );
}

console.log(`[SW] Service Worker loaded, version: ${SW_VERSION}`);
