<template>
  <!-- 遮罩层 -->
  <Transition
    enter-active-class="transition-opacity duration-200 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition-opacity duration-200 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="isOpen"
      class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      @click.self="close"
    >
      <!-- 对话框 -->
      <Transition
        enter-active-class="transition-all duration-200 ease-out"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition-all duration-200 ease-in"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <div
          v-if="isOpen"
          class="bg-white/60 dark:bg-slate-800/60 backdrop-blur-2xl backdrop-saturate-150 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] mx-4 flex flex-col overflow-hidden border border-white/40 dark:border-slate-700/40"
          @click.stop
        >
          <!-- 标题栏 -->
          <div class="flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-4 sm:py-5 border-b border-theme-primary/20 dark:border-slate-700">
            <i class="fas fa-cog text-theme-primary dark:text-theme-accent text-xl sm:text-2xl" />
            <h2 class="text-lg sm:text-xl font-bold text-gray-800 dark:text-slate-100 flex-1">设置</h2>
            <button
              class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-theme-primary/10 text-gray-500 hover:text-theme-primary dark:text-slate-400 dark:hover:bg-slate-700/50 dark:hover:text-theme-accent transition-all duration-200"
              @click="close"
            >
              <i class="fas fa-times text-xl" />
            </button>
          </div>

          <!-- 内容区域 -->
          <div class="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
            <div class="space-y-6">
              <!-- 主题配色 -->
              <div class="setting-section">
                <h3 class="text-base sm:text-lg font-semibold text-gray-800 dark:text-slate-100 mb-3 flex items-center gap-2">
                  <i class="fas fa-palette" style="color: var(--theme-primary)" />
                  <span>主题配色</span>
                </h3>
                
                <div class="space-y-4">
                  <p class="text-sm text-gray-600 dark:text-slate-400">
                    选择您喜欢的主题色温，让界面更符合您的审美
                  </p>
                  
                  <!-- 主题色卡 -->
                  <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <button
                      v-for="(preset, key) in THEME_PRESETS"
                      :key="key"
                      class="theme-card group relative p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105"
                      :class="[
                        localTheme === key
                          ? 'border-current shadow-lg'
                          : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                      ]"
                      :style="{
                        color: preset.colors.primary
                      }"
                      @click="selectTheme(key as ThemePresetKey)"
                    >
                      <!-- 选中标记 -->
                      <div
                        v-if="localTheme === key"
                        class="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs shadow-lg"
                        :style="{ backgroundColor: preset.colors.primary }"
                      >
                        <i class="fas fa-check" />
                      </div>
                      
                      <!-- 颜色预览 -->
                      <div class="flex gap-2 mb-3">
                        <div
                          class="w-8 h-8 rounded-lg shadow-md transition-transform group-hover:scale-110"
                          :style="{ backgroundColor: preset.colors.primary }"
                        />
                        <div
                          class="w-8 h-8 rounded-lg shadow-md transition-transform group-hover:scale-110"
                          :style="{ backgroundColor: preset.colors.accent }"
                        />
                      </div>
                      
                      <!-- 主题名称 -->
                      <p class="text-sm font-medium text-gray-800 dark:text-slate-100">
                        {{ preset.name }}
                      </p>
                    </button>
                  </div>
                  
                  <!-- 预览提示 -->
                  <div class="bg-gradient-to-r from-theme-primary/5 to-theme-accent/5 dark:from-theme-primary/10 dark:to-theme-accent/10 border border-theme-primary/30 dark:border-theme-primary/50 rounded-xl p-4">
                    <div class="flex items-start gap-3">
                      <i class="fas fa-lightbulb" style="color: var(--theme-primary)" />
                      <div class="flex-1 text-sm text-gray-700 dark:text-slate-300">
                        <p class="font-semibold mb-1">实时预览</p>
                        <p>选择主题后，界面会立即更新颜色。点击"保存"按钮以保留您的选择。</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- API 设置 -->
              <div class="setting-section">
                <h3 class="text-base sm:text-lg font-semibold text-gray-800 dark:text-slate-100 mb-3 flex items-center gap-2">
                  <i class="fas fa-server" style="color: var(--theme-primary)" />
                  <span>API 设置</span>
                </h3>
                
                <div class="space-y-4">
                  <!-- 自定义 API 地址 -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      自定义 API 地址
                    </label>
                    <div class="relative">
                      <i class="fas fa-link absolute left-3 sm:left-4 top-3 sm:top-4 text-gray-400 text-lg sm:text-xl pointer-events-none z-10" />
                      <input
                        v-model="localCustomApi"
                        type="url"
                        placeholder="https://cfapi.searchgal.homes"
                        class="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 text-sm sm:text-base rounded-xl bg-white dark:bg-slate-700/50 backdrop-blur-md shadow-md focus:shadow-lg focus:scale-[1.01] transition-all outline-none border-2 border-transparent text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-400"
                        style="border-color: transparent"
                        @focus="$event.target.style.borderColor = 'var(--theme-primary)'"
                        @blur="$event.target.style.borderColor = 'transparent'"
                      />
                    </div>
                    <p class="text-xs text-gray-500 dark:text-slate-400 mt-2">
                      留空使用默认 API 地址。例如: https://cfapi.searchgal.homes 或 http://127.0.0.1:8787
                    </p>
                  </div>

                  <!-- API 状态 -->
                  <div class="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-xl p-4">
                    <div class="flex items-start gap-3">
                      <i class="fas fa-info-circle text-blue-500 dark:text-blue-400 text-lg mt-0.5" />
                      <div class="flex-1 text-sm text-blue-700 dark:text-blue-300">
                        <p class="font-semibold mb-1">关于自定义 API</p>
                        <p>您可以使用自己部署的后端 API 进行搜索。API 需要兼容 SearchGal 的接口规范。</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 底部操作栏 -->
          <div class="flex items-center justify-end gap-3 px-4 sm:px-6 py-4 border-t border-gray-200 dark:border-slate-700">
            <button
              class="px-4 py-2 rounded-xl text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all font-medium"
              @click="reset"
            >
              <i class="fas fa-undo mr-2" />
              重置
            </button>
            <button
              class="px-6 py-2 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
              :style="{
                background: `linear-gradient(to right, var(--theme-primary), var(--theme-primary-dark))`
              }"
              @click="save"
            >
              <i class="fas fa-check mr-2" />
              保存
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { THEME_PRESETS, DEFAULT_THEME, type ThemePresetKey } from '@/types/theme'
import { getCurrentTheme, applyThemeColors, saveTheme } from '@/utils/themeColors'

const props = defineProps<{
  isOpen: boolean
  customApi: string
}>()

const emit = defineEmits<{
  close: []
  save: [customApi: string, theme: ThemePresetKey]
}>()

const localCustomApi = ref(props.customApi)
const localTheme = ref<ThemePresetKey>(getCurrentTheme())
const originalTheme = ref<ThemePresetKey>(getCurrentTheme())

// 监听外部变化
watch(() => props.customApi, (newValue) => {
  localCustomApi.value = newValue
})

// 监听打开状态，同步数据
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    localCustomApi.value = props.customApi
    localTheme.value = getCurrentTheme()
    originalTheme.value = getCurrentTheme()
  }
})

function selectTheme(themeKey: ThemePresetKey) {
  localTheme.value = themeKey
  // 实时预览
  applyThemeColors(themeKey)
}

function close() {
  // 如果取消，恢复原来的主题
  if (localTheme.value !== originalTheme.value) {
    applyThemeColors(originalTheme.value)
  }
  emit('close')
}

function save() {
  // 保存主题到 localStorage
  saveTheme(localTheme.value)
  // 更新原始主题，避免关闭时恢复
  originalTheme.value = localTheme.value
  // 发出保存事件
  emit('save', localCustomApi.value, localTheme.value)
  // 关闭模态框（不会恢复主题，因为 originalTheme 已更新）
  emit('close')
}

function reset() {
  localCustomApi.value = ''
  localTheme.value = DEFAULT_THEME
  applyThemeColors(DEFAULT_THEME)
}
</script>

<style scoped>
/* 自定义滚动条 - 使用主题色 */
.custom-scrollbar::-webkit-scrollbar {
  width: 10px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, var(--theme-primary), var(--theme-accent));
  border-radius: 10px;
  transition: background 0.3s ease;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, var(--theme-primary-dark), var(--theme-accent-dark));
}

/* 暗色模式滚动条 */
.dark .custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(30, 41, 59, 0.3);
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, var(--theme-accent), var(--theme-accent-dark));
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, var(--theme-accent-dark), var(--theme-accent));
}

/* 设置区块 */
.setting-section {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

