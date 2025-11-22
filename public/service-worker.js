// Service Worker for offline caching
const CACHE_NAME = 'word-learning-v1';
const urlsToCache = [
  '/',
  '/index.tsx',
  '/word-learning',
  '/character-learning',
  '/collocation-learning',
  '/sentence-learning',
  '/exercise',
  '/learning-dashboard',
  '/today-review',
  '/login',
  '/register',
  '/manifest.json',
  '/offline.html'
];

// 安装 Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] 安装中...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] 缓存文件');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('[Service Worker] 缓存失败:', error);
      })
  );
  // 强制新的 Service Worker 立即激活
  self.skipWaiting();
});

// 激活 Service Worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] 激活中...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] 删除旧缓存:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // 立即控制所有页面
  return self.clients.claim();
});

// 拦截请求
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 跳过非 GET 请求
  if (request.method !== 'GET') {
    return;
  }

  // 跳过 Chrome extensions 和其他特殊协议
  if (!url.protocol.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(request)
      .then((response) => {
        // 缓存命中，返回缓存内容
        if (response) {
          console.log('[Service Worker] 从缓存返回:', request.url);
          return response;
        }

        // 缓存未命中，发起网络请求
        return fetch(request)
          .then((response) => {
            // 检查是否是有效响应
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            // 克隆响应
            const responseToCache = response.clone();

            // 缓存新的响应（仅缓存成功的响应）
            caches.open(CACHE_NAME)
              .then((cache) => {
                // 只缓存同源请求
                if (url.origin === location.origin) {
                  cache.put(request, responseToCache);
                }
              });

            return response;
          })
          .catch((error) => {
            console.error('[Service Worker] 请求失败:', request.url, error);
            
            // 如果是导航请求（页面），返回离线页面
            if (request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
            
            // 返回空响应
            return new Response('网络错误', {
              status: 408,
              statusText: 'Network Error',
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});

// 监听消息（可用于手动触发缓存更新）
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => {
      event.ports[0].postMessage({ success: true });
    });
  }
});

// 同步后台数据（可选）
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-learning-data') {
    event.waitUntil(
      fetch('/api/sync')
        .then((response) => response.json())
        .then((data) => {
          console.log('[Service Worker] 数据同步成功:', data);
        })
        .catch((error) => {
          console.error('[Service Worker] 数据同步失败:', error);
        })
    );
  }
});

