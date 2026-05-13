import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from 'node:url';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  server: {
    host: "localhost",
    port: 5500,
    // 预热常用文件
    warmup: {
      clientFiles: [
        './src/App.vue',
        './src/components/*.vue',
        './src/stores/*.ts',
      ],
    },
  },

  plugins: [
    {
      name: 'prismjs-esm-fix',
      transform(code, id) {
        if (id.includes('prismjs/components/') && !id.includes('prism-core')) {
          return {
            code: `import Prism from 'prismjs/components/prism-core';\n${code}`,
            map: null,
          }
        }
      },
    },
    vue(),
    tailwindcss(),
    // PWA 配置
    VitePWA({
      registerType: 'autoUpdate', // 收到新版本立即更新
      includeAssets: ['logo.svg', 'robots.txt'],
      manifest: {
        name: 'SearchGal - Galgame 聚合搜索',
        short_name: 'SearchGal',
        description: '多平台 Galgame 资源聚合搜索引擎',
        start_url: '/',
        display: 'standalone',
        background_color: '#fff5fa',
        theme_color: '#ff1493',
        orientation: 'portrait-primary',
        scope: '/',
        lang: 'zh-CN',
        dir: 'ltr',
        icons: [
          {
            src: '/logo.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
        categories: ['entertainment', 'games', 'utilities'],
        shortcuts: [
          {
            name: '游戏模式搜索',
            short_name: '游戏搜索',
            description: '快速搜索游戏资源',
            url: '/?mode=game',
            icons: [{ src: '/logo.svg', sizes: 'any' }],
          },
          {
            name: '补丁模式搜索',
            short_name: '补丁搜索',
            description: '搜索游戏补丁资源',
            url: '/?mode=patch',
            icons: [{ src: '/logo.svg', sizes: 'any' }],
          },
        ],
      },
      workbox: {
        // 预缓存核心构建产物（首屏必需，不包含字体——字体按 unicode-range 子集太多，改为运行时缓存）
        globPatterns: ['**/*.{js,css,html,svg,ico}'],
        // 单文件最大预缓存 3 MB，避免大依赖膨胀 precache
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        // 排除按需加载的资源（评论、编辑器在用户触发时再缓存）
        globIgnores: [
          '**/artalk-*.{js,css}',
          '**/editor-*.{js,css}',
          '**/CommentsModal-*.{js,css}',
          '**/SettingsModal-*.{js,css}',
        ],
        // 运行时缓存策略
        runtimeCaching: [
          {
            // 本地字体子集 - 缓存优先（用户用到哪个子集才缓存哪个）
            urlPattern: /\/fonts\/.*\.(woff2?|ttf|otf)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'local-fonts',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 年
              },
            },
          },
          {
            // 字体文件 - 缓存优先
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 年
              },
            },
          },
          {
            // 图片 API - 网络优先
            urlPattern: /^https:\/\/api\.illlights\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'background-images',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24, // 1 天
              },
            },
          },
          {
            // VNDB API - 网络优先
            urlPattern: /^https:\/\/api\.vndb\.org\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'vndb-api',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 30, // 30 分钟
              },
            },
          },
        ],
        // 离线时的导航回退
        navigateFallback: null, // 不使用默认回退，由 offlineFallback 处理
      },
      // 开发环境启用 SW（便于测试）
      devOptions: {
        enabled: false, // 开发时禁用，避免干扰
      },
    }),
  ],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },

  // 构建优化
  build: {
    target: 'esnext',
    cssCodeSplit: true,
    sourcemap: false,
    chunkSizeWarningLimit: 600,
    // 禁止字体 base64 内联：保留 fontsource 的 unicode-range 子集策略，
    // 浏览器按需下载用到的子集而不是把全部字体 base64 进 CSS
    assetsInlineLimit: (filePath) => {
      if (/\.(woff2?|eot|ttf|otf)$/i.test(filePath)) {
        return false
      }
      return undefined
    },
    rolldownOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name || '';
          if (/\.(woff2?|eot|ttf|otf)$/i.test(name)) {
            return 'fonts/[name]-[hash][extname]';
          }
          if (/\.(png|jpe?g|gif|svg|webp|ico)$/i.test(name)) {
            return 'images/[name]-[hash][extname]';
          }
          if (/\.css$/i.test(name)) {
            return 'css/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
        entryFileNames: 'js/[name]-[hash].js',
        chunkFileNames: 'js/[name]-[hash].js',
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('/vue/') || id.includes('/@vue/')) {
              return 'vue-core';
            }
            if (id.includes('/pinia/')) {
              return 'pinia';
            }
            if (id.includes('/lucide-vue-next/')) {
              return 'ui-libs';
            }
            if (id.includes('/artalk/')) {
              return 'artalk';
            }
            if (id.includes('/prismjs/') || id.includes('/vue-prism-editor/')) {
              return 'editor';
            }
            return 'vendor';
          }
        },
      },
    },
  },

  // 依赖优化
  optimizeDeps: {
    include: [
      'vue',
      'pinia',
      'lucide-vue-next',
    ],
    exclude: ['artalk'],
  },

  // CSS 配置
  css: {
    devSourcemap: true,
  },
});
