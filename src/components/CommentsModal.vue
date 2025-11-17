<template>
  <md-dialog 
    :open="searchStore.isCommentsModalOpen"
    @closed="closeModal"
    class="comments-dialog"
  >
    <div slot="headline" class="flex items-center gap-3">
      <i class="fas fa-comments text-pink-500 text-2xl"></i>
      <span class="text-xl font-bold">评论区</span>
    </div>
    
    <div slot="content" class="dialog-content">
      <div id="Comments"></div>
    </div>
    
    <div slot="actions" class="flex gap-2">
      <md-text-button @click="closeModal" class="close-button">
        <i class="fas fa-times mr-2"></i>
        关闭
      </md-text-button>
    </div>
  </md-dialog>
</template>

<script setup lang="ts">
import { watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useSearchStore } from '@/stores/search'
import Artalk from 'artalk'
import { ArtalkLightboxPlugin } from '@artalk/plugin-lightbox'
import gsap from 'gsap'

const searchStore = useSearchStore()
let artalkInstance: any = null

function closeModal() {
  searchStore.toggleCommentsModal()
}

// 监听模态框打开状态并添加动画
watch(() => searchStore.isCommentsModalOpen, (isOpen: boolean) => {
  console.log('[DEBUG] Comments modal state changed:', isOpen)
  
  if (isOpen) {
    nextTick(() => {
      // GSAP 动画：对话框内容淡入 + 放大
      gsap.from('.dialog-content', {
        duration: 0.6,
        opacity: 0,
        scale: 0.95,
        y: 20,
        ease: 'back.out(1.7)',
        delay: 0.1
      })
    })
  }
}, { immediate: true })

// 初始化 Artalk（只初始化一次）
onMounted(() => {
  console.log('[DEBUG] CommentsModal mounted, initializing Artalk...')
  
  // 稍微延迟以确保 DOM 完全准备好
  setTimeout(() => {
    const commentsEl = document.getElementById('Comments')
    if (commentsEl && !artalkInstance) {
      console.log('[DEBUG] Comments element found, creating Artalk instance...')
      try {
        artalkInstance = Artalk.init({
          el: '#Comments',
          pageKey: 'https://searchgal.homes',
          server: 'https://artalk.saop.cc',
          site: 'Galgame 聚合搜索',
          useBackendConf: false,
          lightbox: ArtalkLightboxPlugin,
        } as any)
        console.log('[DEBUG] Artalk initialized successfully')
      } catch (error) {
        console.error('[ERROR] Failed to initialize Artalk:', error)
      }
    } else {
      console.warn('[DEBUG] Comments element not found or Artalk already initialized')
    }
  }, 200)
})

onUnmounted(() => {
  // 销毁 Artalk 实例
  if (artalkInstance) {
    try {
      artalkInstance.destroy()
      console.log('[DEBUG] Artalk instance destroyed')
    } catch (error) {
      console.error('[ERROR] Failed to destroy Artalk:', error)
    }
  }
})
</script>

<style>
.comments-dialog {
  --md-dialog-container-color: rgba(255, 255, 255, 0.98);
  --md-dialog-container-shape: 32px;
  width: 90vw;
  max-width: 900px;
  border-radius: 32px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.25), 0 12px 32px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.dialog-content {
  max-height: 70vh;
  overflow-y: auto;
  padding: 24px 0;
  min-height: 300px;
}

/* 自定义滚动条 - 粉色渐变 */
.dialog-content::-webkit-scrollbar {
  width: 10px;
}

.dialog-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}

.dialog-content::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, rgb(236, 72, 153), rgb(139, 92, 246));
  border-radius: 10px;
  transition: background 0.3s ease;
}

.dialog-content::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, rgb(219, 39, 119), rgb(124, 58, 237));
}

/* 关闭按钮样式优化 */
.close-button {
  --md-text-button-label-text-color: rgb(236, 72, 153);
  --md-text-button-hover-state-layer-color: rgba(236, 72, 153, 0.08);
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.close-button:hover {
  transform: scale(1.05);
}

/* 标题样式优化 */
.comments-dialog [slot="headline"] {
  padding: 24px 24px 16px;
  border-bottom: 1px solid rgba(236, 72, 153, 0.1);
}

/* 操作按钮区域优化 */
.comments-dialog [slot="actions"] {
  padding: 16px 24px 24px;
  border-top: 1px solid rgba(236, 72, 153, 0.1);
}
</style>
