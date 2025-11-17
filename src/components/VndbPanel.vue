<template>
  <!-- VNDB 作品介绍面板 -->
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="opacity-0 translate-x-full"
    enter-to-class="opacity-100 translate-x-0"
    leave-active-class="transition-all duration-300 ease-in"
    leave-from-class="opacity-100 translate-x-0"
    leave-to-class="opacity-0 translate-x-full"
  >
    <div
      v-if="searchStore.isVndbPanelOpen && searchStore.vndbInfo"
      class="fixed bottom-20 sm:bottom-24 right-2 sm:right-6 w-[calc(100vw-1rem)] sm:w-96 max-h-[70vh] bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden z-30 border border-white/30"
    >
      <!-- 标题栏 -->
      <div class="flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
        <i class="fas fa-book text-lg sm:text-xl"></i>
        <h3 class="text-base sm:text-lg font-bold flex-1">作品介绍</h3>
        <button
          @click="closePanel"
          class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- 内容区域 -->
      <div class="overflow-y-auto max-h-[calc(70vh-56px)] sm:max-h-[calc(70vh-64px)] p-4 sm:p-6 custom-scrollbar">
        <!-- 游戏截图 -->
        <div v-if="searchStore.vndbInfo.screenshotUrl" class="mb-4">
          <img
            :src="searchStore.vndbInfo.screenshotUrl"
            :alt="searchStore.vndbInfo.mainName + ' 截图'"
            class="w-full h-auto rounded-xl shadow-lg"
            loading="lazy"
          />
        </div>
        
        <!-- 封面图 -->
        <div v-if="searchStore.vndbInfo.mainImageUrl" class="mb-4">
          <img
            :src="searchStore.vndbInfo.mainImageUrl"
            :alt="searchStore.vndbInfo.mainName"
            class="w-full h-auto rounded-xl shadow-lg"
            loading="lazy"
          />
        </div>

        <!-- 标题 -->
        <h2 class="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          <i class="fas fa-gamepad text-pink-500"></i>
          {{ searchStore.vndbInfo.mainName }}
        </h2>

        <!-- 原名 -->
        <p v-if="searchStore.vndbInfo.originalTitle" class="text-sm text-gray-500 mb-4">
          原名: {{ searchStore.vndbInfo.originalTitle }}
        </p>

        <!-- 别名 -->
        <div v-if="searchStore.vndbInfo.names.length > 1" class="mb-4">
          <p class="text-sm font-semibold text-gray-700 mb-2">
            <i class="fas fa-tag text-purple-500 mr-1"></i>
            别名:
          </p>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="(name, index) in searchStore.vndbInfo.names.slice(0, 5)"
              :key="index"
              class="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-full"
            >
              {{ name }}
            </span>
          </div>
        </div>

        <!-- 游戏时长 -->
        <div v-if="searchStore.vndbInfo.play_hours" class="mb-4">
          <div class="flex items-center gap-2">
            <span class="px-3 py-1.5 rounded-full bg-gradient-to-r from-pink-50 to-purple-50 text-gray-700 text-sm font-medium flex items-center gap-2">
              <i class="fas fa-clock text-pink-500"></i>
              <span>{{ searchStore.vndbInfo.book_length }}</span>
            </span>
            <span class="text-sm text-gray-500">
              (约 {{ searchStore.vndbInfo.play_hours }} 小时)
            </span>
          </div>
        </div>

        <!-- 简介 -->
        <div v-if="searchStore.vndbInfo.description" class="mb-4">
          <div class="flex items-center justify-between mb-2">
            <p class="text-sm font-semibold text-gray-700">
              <i class="fas fa-align-left text-pink-500 mr-1"></i>
              简介:
            </p>
            <button
              v-if="!isTranslating && !translatedDescription"
              @click="handleTranslate"
              class="px-3 py-1 text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:from-purple-600 hover:to-pink-600 transition-all shadow-sm hover:shadow-md flex items-center gap-1"
            >
              <i class="fas fa-language"></i>
              <span>AI 翻译</span>
            </button>
            <button
              v-if="translatedDescription && !isTranslating"
              @click="showOriginal = !showOriginal"
              class="px-3 py-1 text-xs bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-full hover:from-gray-600 hover:to-gray-700 transition-all shadow-sm hover:shadow-md flex items-center gap-1"
            >
              <i class="fas fa-exchange-alt"></i>
              <span>{{ showOriginal ? '显示译文' : '显示原文' }}</span>
            </button>
          </div>
          <div class="text-sm text-gray-700 leading-relaxed whitespace-pre-line bg-gray-50 rounded-xl p-4 relative">
            <div v-if="isTranslating" class="flex items-center justify-center gap-2 text-purple-500">
              <i class="fas fa-spinner fa-spin"></i>
              <span>AI 翻译中...</span>
            </div>
            <template v-else>
              <div v-if="showOriginal || !translatedDescription">
                {{ searchStore.vndbInfo.description }}
              </div>
              <div v-else class="relative">
                <div class="absolute top-0 right-0 px-2 py-0.5 bg-purple-500 text-white text-xs rounded-bl-lg rounded-tr-lg">
                  AI 译文
                </div>
                <div class="pt-6">
                  {{ translatedDescription }}
                </div>
              </div>
            </template>
          </div>
        </div>

        <!-- VNDB 链接 -->
        <div class="mt-6 pt-4 border-t border-gray-200">
          <a
            href="https://vndb.org/"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-md hover:shadow-lg"
          >
            <i class="fas fa-external-link-alt"></i>
            <span>访问 VNDB 查看更多</span>
          </a>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useSearchStore } from '@/stores/search'
import { translateText } from '@/api/search'

const searchStore = useSearchStore()
const isTranslating = ref(false)
const translatedDescription = ref<string | null>(null)
const showOriginal = ref(false)

// 监听 vndbInfo 变化，重置翻译状态
watch(() => searchStore.vndbInfo, () => {
  translatedDescription.value = null
  showOriginal.value = false
  isTranslating.value = false
})

async function handleTranslate() {
  if (!searchStore.vndbInfo?.description || isTranslating.value) {
    return
  }

  isTranslating.value = true

  try {
    const translated = await translateText(searchStore.vndbInfo.description)
    if (translated) {
      translatedDescription.value = translated
      showOriginal.value = false
    }
  } catch (error) {
    // 静默处理错误
  } finally {
    isTranslating.value = false
  }
}

function closePanel() {
  searchStore.toggleVndbPanel()
}
</script>

<style scoped>
/* 自定义滚动条 */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, rgb(236, 72, 153), rgb(139, 92, 246));
  border-radius: 10px;
  transition: background 0.3s ease;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, rgb(219, 39, 119), rgb(124, 58, 237));
}
</style>

