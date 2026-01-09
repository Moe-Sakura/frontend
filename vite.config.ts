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
    vue({
      script: {
        // 响应式语法糖（如需要可启用）
        defineModel: true,
      },
    }),
    tailwindcss(),
    // PWA 配置
    VitePWA({
      registerType: 'prompt', // 提示用户更新
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
        // 预缓存所有构建产物
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        // 运行时缓存策略
        runtimeCaching: [
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
    // 使用现代浏览器目标
    target: 'esnext',
    // 启用 CSS 代码分割
    cssCodeSplit: true,
    // 压缩选项
    minify: 'esbuild',
    // 源码映射（生产环境关闭）
    sourcemap: false,
    // Chunk 大小警告阈值 (KB)
    chunkSizeWarningLimit: 600,
    // Rollup 配置
    rollupOptions: {
      output: {
        // 资源文件名
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name || '';
          // 字体文件
          if (/\.(woff2?|eot|ttf|otf)$/i.test(name)) {
            return 'fonts/[name]-[hash][extname]';
          }
          // 图片文件
          if (/\.(png|jpe?g|gif|svg|webp|ico)$/i.test(name)) {
            return 'images/[name]-[hash][extname]';
          }
          // CSS 文件
          if (/\.css$/i.test(name)) {
            return 'css/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
        // JS 入口文件名
        entryFileNames: 'js/[name]-[hash].js',
        // JS Chunk 文件名
        chunkFileNames: 'js/[name]-[hash].js',
        // 手动分包
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // Vue 核心
            if (id.includes('/vue/') || id.includes('/@vue/')) {
              return 'vue-core';
            }
            // Pinia 状态管理
            if (id.includes('/pinia/')) {
              return 'pinia';
            }
            // UI 库
            if (id.includes('/lucide-vue-next/')) {
              return 'ui-libs';
            }
            // Artalk 评论
            if (id.includes('/artalk/')) {
              return 'artalk';
            }
            // 代码编辑器
            if (id.includes('/prismjs/') || id.includes('/vue-prism-editor/')) {
              return 'editor';
            }
            // Fancybox
            if (id.includes('/@fancyapps/')) {
              return 'fancybox';
            }
            // 其他第三方库
            return 'vendor';
          }
        },
      },
    },
  },

  // 依赖优化
  optimizeDeps: {
    // 预构建的依赖
    include: [
      'vue',
      'pinia',
      'lucide-vue-next',
    ],
    // 排除不需要预构建的
    exclude: ['artalk'],
  },

  // esbuild 配置
  esbuild: {
    // 生产环境移除 console 和 debugger
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    // 压缩选项
    legalComments: 'none',
  },

  // CSS 配置
  css: {
    devSourcemap: true,
  },
});
