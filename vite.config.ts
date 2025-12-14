import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from 'node:url';
import { swVersionPlugin } from './scripts/sw-version-plugin';

export default defineConfig({
  server: {
    host: "localhost",
    port: 5500,
  },
  plugins: [
    vue(),
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
  }
});
