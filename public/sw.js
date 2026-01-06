// Service Worker - SearchGal PWA
// 版本由构建工具注入
const VERSION = self.__SW_VERSION__ || Date.now().toString(36)
const CACHE = `searchgal-${VERSION}`

// 缓存规则
const STATIC_EXT = /\.(js|css|mjs|woff2?|ttf|png|jpg|jpeg|gif|webp|svg|ico|avif|wasm)$/i
const SKIP = /\/(api|sw\.js|__vite|hot-update)|\.map$/

// ============================================
// 生命周期
// ============================================

self.addEventListener('install', (e) => {
  console.log(`[SW] Install v${VERSION}`)
  e.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (e) => {
  console.log(`[SW] Activate v${VERSION}`)
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k.startsWith('searchgal-') && k !== CACHE)
          .map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  )
})

// ============================================
// 消息
// ============================================

self.addEventListener('message', (e) => {
  const { type } = e.data || {}
  
  if (type === 'GET_VERSION') {
    e.ports[0]?.postMessage({ version: VERSION })
  } else if (type === 'SKIP_WAITING') {
    self.skipWaiting()
  } else if (type === 'CLEAR_CACHE') {
    e.waitUntil(
      caches.keys()
        .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
        .then(() => e.ports[0]?.postMessage({ success: true }))
    )
  }
})

// ============================================
// 请求拦截
// ============================================

self.addEventListener('fetch', (e) => {
  const { request } = e
  const url = new URL(request.url)

  // 跳过：非 GET、非 HTTP、跨域、特殊路径
  if (
    request.method !== 'GET' ||
    !url.protocol.startsWith('http') ||
    url.origin !== location.origin ||
    SKIP.test(url.href)
  ) return

  const isDocument = request.destination === 'document'
  const isStatic = STATIC_EXT.test(url.pathname)

  if (isDocument) {
    // HTML：网络优先，离线显示提示
    e.respondWith(networkFirst(request, true))
  } else if (isStatic) {
    // 静态资源：缓存优先
    e.respondWith(cacheFirst(request))
  } else {
    // 其他：网络优先
    e.respondWith(networkFirst(request, false))
  }
})

// ============================================
// 缓存策略
// ============================================

async function cacheFirst(req) {
  const cached = await caches.match(req)
  if (cached) return cached
  
  try {
    const res = await fetch(req)
    if (res.ok) {
      const cache = await caches.open(CACHE)
      cache.put(req, res.clone())
    }
    return res
  } catch {
    return new Response('', { status: 503 })
  }
}

async function networkFirst(req, showOffline) {
  try {
    const res = await fetch(req)
    if (res.ok) {
      const cache = await caches.open(CACHE)
      cache.put(req, res.clone())
    }
    return res
  } catch {
    const cached = await caches.match(req)
    if (cached) return cached
    return showOffline ? offlinePage() : new Response('', { status: 503 })
  }
}

// ============================================
// 离线页面
// ============================================

function offlinePage() {
  return new Response(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>离线 - SearchGal</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:system-ui,-apple-system,sans-serif;background:linear-gradient(135deg,#fff5fa,#ffe4f0);padding:1.5rem}
    .c{text-align:center;max-width:360px}
    .i{font-size:4rem;margin-bottom:1rem;animation:f 2s ease-in-out infinite}
    @keyframes f{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
    h1{font-size:1.5rem;margin-bottom:.5rem;background:linear-gradient(135deg,#ff1493,#d946ef);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
    p{color:#666;line-height:1.5;margin-bottom:1.5rem}
    button{padding:.875rem 2rem;background:linear-gradient(135deg,#ff1493,#d946ef);color:#fff;border:none;border-radius:9999px;font-size:.9rem;font-weight:500;cursor:pointer;box-shadow:0 4px 12px rgba(255,20,147,.3);transition:transform .2s,box-shadow .2s}
    button:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(255,20,147,.4)}
    button:active{transform:translateY(0)}
    .h{margin-top:1.5rem;font-size:.8rem;color:#999}
  </style>
</head>
<body>
  <div class="c">
    <div class="i">🌐</div>
    <h1>需要网络连接</h1>
    <p>SearchGal 是在线搜索服务，请连接网络后使用</p>
    <button onclick="location.reload()">重新连接</button>
    <p class="h">检查网络是否正常</p>
  </div>
</body>
</html>`, {
    status: 503,
    headers: { 'Content-Type': 'text/html;charset=utf-8' }
  })
}

console.log(`[SW] Ready v${VERSION}`)
