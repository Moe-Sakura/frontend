import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from 'node:url';
import { swVersionPlugin } from './scripts/sw-version-plugin';

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
    // 构建时自动注入 SW 版本号
    swVersionPlugin({
      swPath: 'sw.js',
      includeGitHash: true,
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
            // 动画库
            if (id.includes('/animejs/')) {
              return 'anime';
            }
            // Artalk 评论
            if (id.includes('/artalk/')) {
              return 'artalk';
            }
            // 代码编辑器
            if (id.includes('/prismjs/') || id.includes('/vue-prism-editor/')) {
              return 'editor';
            }
            // 音效库
            if (id.includes('/snd-lib/')) {
              return 'sound';
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
      'animejs',
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
