<template>
  <footer class="page-footer py-8 mt-16">
    <div class="container mx-auto px-4 max-w-4xl">
      <!-- 主要链接 -->
      <div class="footer-links flex flex-wrap justify-center gap-6 mb-6">
        <a href="/sitemap.xml" target="_blank" class="footer-link" title="网站地图">
          <i class="fas fa-sitemap"></i>
          <span>Sitemap</span>
        </a>
        
        <a href="https://github.com/Moe-Sakura/SearchGal" target="_blank" rel="noopener noreferrer" class="footer-link" title="GitHub 仓库">
          <i class="fab fa-github"></i>
          <span>GitHub</span>
        </a>
        
        <a href="https://status.searchgal.homes" target="_blank" rel="noopener noreferrer" class="footer-link" title="服务状态">
          <i class="fas fa-heartbeat"></i>
          <span>服务状态</span>
        </a>
        
        <a href="https://vndb.org/" target="_blank" rel="noopener noreferrer" class="footer-link" title="VNDB 数据源">
          <i class="fas fa-database"></i>
          <span>VNDB</span>
        </a>
      </div>
      
      <!-- 分隔线 -->
      <md-divider class="my-6"></md-divider>
      
      <!-- 版权信息 -->
      <div class="footer-info text-center space-y-2">
        <p class="text-sm opacity-80">
          <i class="fas fa-heart text-pink-500"></i>
          感谢 
          <a href="https://saop.cc/" target="_blank" rel="noopener noreferrer" class="footer-link-inline">
            @Asuna
          </a>
          大佬提供的服务器和技术支持
        </p>
        
        <p class="text-sm opacity-80">
          <i class="fas fa-code"></i>
          使用 
          <a href="https://vuejs.org/" target="_blank" rel="noopener noreferrer" class="footer-link-inline">Vue 3</a>
          +
          <a href="https://m3.material.io/" target="_blank" rel="noopener noreferrer" class="footer-link-inline">Material 3</a>
          构建
        </p>
        
        <p class="text-sm opacity-80">
          <i class="fas fa-balance-scale"></i>
          本站仅提供聚合搜索服务，不存储任何资源
        </p>
        
        <p class="text-xs opacity-60 mt-4">
          © 2025 SearchGal. All rights reserved.
        </p>
      </div>
      
      <!-- PWA 安装提示 -->
      <div v-if="showInstallPrompt" class="install-prompt mt-6">
        <md-elevated-card class="p-4">
          <div class="flex items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <i class="fas fa-download text-2xl text-primary"></i>
              <div>
                <p class="font-semibold">安装 SearchGal 应用</p>
                <p class="text-sm opacity-80">获得更快的访问速度和离线体验</p>
              </div>
            </div>
            <div class="flex gap-2">
              <md-text-button @click="dismissInstall">
                稍后
              </md-text-button>
              <md-filled-button @click="installPWA">
                <md-icon slot="icon">download</md-icon>
                安装
              </md-filled-button>
            </div>
          </div>
        </md-elevated-card>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const showInstallPrompt = ref(false)
let deferredPrompt: any = null

onMounted(() => {
  // 监听 PWA 安装提示事件
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e
    // 检查是否已经安装或已经拒绝过
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (!dismissed) {
      showInstallPrompt.value = true
    }
  })
  
  // 监听 PWA 安装完成事件
  window.addEventListener('appinstalled', () => {
    showInstallPrompt.value = false
    deferredPrompt = null
    console.log('[PWA] App installed successfully')
  })
})

async function installPWA() {
  if (!deferredPrompt) {
    console.log('[PWA] No install prompt available')
    return
  }
  
  deferredPrompt.prompt()
  const { outcome } = await deferredPrompt.userChoice
  console.log(`[PWA] User response: ${outcome}`)
  
  if (outcome === 'accepted') {
    showInstallPrompt.value = false
  }
  
  deferredPrompt = null
}

function dismissInstall() {
  showInstallPrompt.value = false
  localStorage.setItem('pwa-install-dismissed', 'true')
}
</script>

<style scoped>
.page-footer {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid rgba(236, 72, 153, 0.1);
}

.footer-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.8);
  color: var(--md-sys-color-on-surface);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.footer-link:hover {
  background: var(--md-sys-color-primary);
  color: var(--md-sys-color-on-primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(236, 72, 153, 0.3);
}

.footer-link i {
  font-size: 1.125rem;
}

.footer-link-inline {
  color: var(--md-sys-color-primary);
  text-decoration: none;
  font-weight: 600;
  transition: opacity 0.2s ease;
}

.footer-link-inline:hover {
  opacity: 0.7;
  text-decoration: underline;
}

.footer-info {
  color: var(--md-sys-color-on-surface-variant);
}

.install-prompt {
  animation: slideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.text-primary {
  color: var(--md-sys-color-primary);
}

md-elevated-card {
  --md-elevated-card-container-color: rgba(255, 255, 255, 0.95);
}
</style>

