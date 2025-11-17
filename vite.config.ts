import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  server: {
    host: "localhost",
    port: 5500,
  },
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // 将 Material Web 组件标签视为自定义元素
          isCustomElement: (tag) => tag.startsWith('md-')
        }
      }
    }),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'SearchGal - Galgame 聚合搜索',
        short_name: 'SearchGal',
        description: 'Galgame 资源聚合搜索引擎，支持多站点搜索、游戏信息查询、补丁下载',
        theme_color: '#ec4899',
        background_color: '#fffbfe',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-maskable-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        categories: ['entertainment', 'utilities'],
        screenshots: [
          {
            src: '/screenshot-wide.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide'
          },
          {
            src: '/screenshot-narrow.png',
            sizes: '750x1334',
            type: 'image/png',
            form_factor: 'narrow'
          }
        ]
      },
      workbox: {
        // 自动缓存所有构建产物（包括所有 npm 依赖）
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,jpg,jpeg,gif,webp,woff,woff2,ttf,eot}'
        ],
        // 包含 node_modules 中的依赖
        globDirectory: 'dist',
        // 最大缓存大小（50MB）
        maximumFileSizeToCacheInBytes: 50 * 1024 * 1024,
        // 清理过期缓存
        cleanupOutdatedCaches: true,
        // 跳过等待，立即激活新的 Service Worker
        skipWaiting: true,
        clientsClaim: true,
        // 运行时缓存策略
        runtimeCaching: [
          {
            // npm 依赖包（从 node_modules 加载的资源）
            urlPattern: /^https?:\/\/.*\/node_modules\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'npm-dependencies-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Vite 开发服务器的模块
            urlPattern: /\/@vite\/|\/node_modules\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'vite-modules-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },
          {
            // 字体 CDN
            urlPattern: /^https:\/\/(fonts\.loli\.net|fonts\.googleapis\.com|fonts\.gstatic\.com|gstatic\.loli\.net)\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts-cache',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // API 请求
            urlPattern: /^https:\/\/api\.searchgal\.homes\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5 // 5 minutes
              },
              networkTimeoutSeconds: 10,
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // 随机图片 API
            urlPattern: /^https:\/\/api\.illlights\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'random-images-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 // 1 day
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // VNDB 图片
            urlPattern: /^https:\/\/.*vndb\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'vndb-images-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // CDN 资源（busuanzi 等）
            urlPattern: /^https:\/\/(registry\.npmmirror\.com|cdn\.jsdelivr\.net|unpkg\.com)\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cdn-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // 图片资源
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // JS/CSS 资源
            urlPattern: /\.(?:js|css)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-resources-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
});
