<template>
  <Dialog v-model:open="open">
    <DialogContent
      :show-close-button="false"
      class="settings-page inset-0 flex translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 p-0 shadow-2xl shadow-black/20
             max-w-none sm:max-w-none
             md:inset-6 md:m-auto md:h-[700px] md:max-h-[calc(100%_-_3rem)] md:w-[800px] md:max-w-[calc(100%_-_3rem)] md:rounded-3xl"
    >
      <!-- 顶部导航栏 -->
      <DialogHeader
        class="glassmorphism-navbar flex-row flex-shrink-0 items-center justify-between space-y-0 border-b border-white/10 px-4 py-3 select-none sm:px-6 sm:py-4 md:rounded-t-3xl dark:border-slate-700/50"
      >
        <!-- 返回按钮 - 仅移动端 -->
        <button
          class="flex items-center gap-1 font-medium text-theme-primary transition-colors active:scale-95 md:hidden dark:text-theme-primary-light"
          @click="open = false"
        >
          <ChevronLeft :size="24" />
          <span class="text-base">返回</span>
        </button>

        <!-- 标题 -->
        <div class="flex items-center gap-2 md:ml-0">
          <SettingsIcon :size="20" class="text-theme-primary dark:text-theme-primary-light" />
          <DialogTitle class="text-lg font-bold text-gray-800 dark:text-white">
            设置
          </DialogTitle>
          <DialogDescription class="sr-only">
            站点设置面板：外观、音效、搜索历史、自定义代码与高级 API
          </DialogDescription>
        </div>

        <!-- 右侧按钮组 -->
        <div class="flex items-center gap-2">
          <!-- 保存按钮 -->
          <button
            class="rounded-full bg-theme-primary px-4 py-1.5 text-sm font-semibold text-white shadow-lg shadow-theme-primary/25 transition-all hover:bg-theme-primary-dark active:scale-95"
            @click="save"
          >
            保存
          </button>

          <!-- 关闭按钮 - 仅桌面端 -->
          <button
            class="hidden h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-all hover:bg-red-50 hover:text-red-500 md:flex dark:text-gray-400 dark:hover:bg-red-900/20 dark:hover:text-red-400"
            title="关闭"
            @click="open = false"
          >
            <X :size="16" />
          </button>
        </div>
      </DialogHeader>

      <!-- 内容区域 -->
      <div class="custom-scrollbar flex-1 overflow-y-auto">
        <div class="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
          <!-- 外观设置卡片 -->
          <div class="settings-card">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-theme-primary to-theme-accent flex items-center justify-center shadow-lg shadow-theme-primary/30">
                <Palette :size="20" class="text-white" />
              </div>
              <div>
                <h2 class="text-lg font-bold text-gray-800 dark:text-white">外观</h2>
                <p class="text-sm text-gray-500 dark:text-slate-400">主题色、明暗模式与圆角</p>
              </div>
            </div>

            <!-- 预设主题色 -->
            <div class="mt-5">
              <p class="mb-2.5 text-sm font-semibold text-gray-700 dark:text-slate-300">
                主题色
              </p>
              <div class="flex flex-wrap items-center gap-3">
                <button
                  v-for="preset in THEME_PRESETS"
                  :key="preset.key"
                  type="button"
                  class="swatch"
                  :class="{ 'swatch-active': uiStore.themeColor === preset.key }"
                  :style="{ background: preset.primary }"
                  :title="preset.label"
                  :aria-label="`主题色：${preset.label}`"
                  :aria-pressed="uiStore.themeColor === preset.key"
                  @click="selectThemeColor(preset.key)"
                />

                <!--
                  取色器：原生 <input type="color"> 铺满整个色块，
                  这样点色块任意位置都能唤起系统调色板，不必再套一层触发按钮。
                -->
                <label
                  class="swatch swatch-custom"
                  :class="{ 'swatch-active': isCustomThemeColor }"
                  :style="{ background: isCustomThemeColor ? uiStore.themeColor : undefined }"
                  :title="isCustomThemeColor ? `自定义 ${uiStore.themeColor}` : '自定义颜色'"
                >
                  <Pipette v-if="!isCustomThemeColor" :size="15" />
                  <input
                    type="color"
                    class="sr-only"
                    :value="customColorValue"
                    aria-label="自定义主题色"
                    @input="onPickColor"
                  />
                </label>
              </div>
              <p v-if="isCustomThemeColor" class="mt-2 font-mono text-xs text-gray-400 dark:text-slate-500">
                {{ uiStore.themeColor }} · 辅助色 {{ derivedAccent }}
              </p>
            </div>

            <!-- 明暗模式 -->
            <div class="mt-5">
              <p class="mb-2.5 text-sm font-semibold text-gray-700 dark:text-slate-300">
                明暗模式
              </p>
              <div class="mode-row flex items-center gap-1 rounded-xl p-1">
                <button
                  v-for="mode in THEME_MODES"
                  :key="mode.value"
                  type="button"
                  class="mode-btn flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-semibold"
                  :class="uiStore.themeMode === mode.value ? 'mode-btn-active' : 'mode-btn-idle'"
                  :aria-pressed="uiStore.themeMode === mode.value"
                  @click="selectThemeMode(mode.value)"
                >
                  <component :is="mode.icon" :size="16" />
                  <span>{{ mode.label }}</span>
                </button>
              </div>
            </div>

            <!-- 圆角 -->
            <div class="mt-5">
              <div class="mb-2.5 flex items-baseline justify-between">
                <p class="text-sm font-semibold text-gray-700 dark:text-slate-300">
                  圆角
                </p>
                <p class="font-mono text-xs text-gray-400 dark:text-slate-500">
                  {{ uiStore.radius }}% · 卡片 {{ radiusCardPx }}px
                </p>
              </div>
              <div class="flex items-center gap-3">
                <!-- 左右两端各放一个方块，拖动时它们跟着变，是最直观的刻度示意 -->
                <span class="radius-swatch shrink-0" style="border-radius: 0" />
                <input
                  v-model.number="radiusPercent"
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  class="radius-range flex-1"
                  aria-label="圆角大小"
                />
                <span
                  class="radius-swatch shrink-0"
                  :style="{ borderRadius: `${radiusCardPx * 0.5}px` }"
                />
              </div>
            </div>
          </div>

          <!-- 音效设置卡片 -->
          <div class="settings-card">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-theme-primary to-theme-accent flex items-center justify-center shadow-lg shadow-theme-primary/30">
                  <Volume2 :size="20" class="text-white" />
                </div>
                <div>
                  <h2 class="text-lg font-bold text-gray-800 dark:text-white">音效</h2>
                  <p class="text-sm text-gray-500 dark:text-slate-400">界面交互音效</p>
                </div>
              </div>
              <!-- 开关 -->
              <Switch
                :model-value="localEnableSound"
                aria-label="界面交互音效"
                class="h-7 w-12 data-[state=checked]:bg-theme-primary data-[state=unchecked]:bg-gray-300 dark:data-[state=unchecked]:bg-slate-600 [&>span]:size-6 [&>span]:data-[state=checked]:translate-x-5"
                @update:model-value="toggleSound"
              />
            </div>
          </div>

          <!-- 搜索历史管理卡片 -->
          <div class="settings-card">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <History :size="20" class="text-white" />
              </div>
              <div>
                <h2 class="text-lg font-bold text-gray-800 dark:text-white">搜索历史</h2>
                <p class="text-sm text-gray-500 dark:text-slate-400">
                  共 {{ historyStore.historyCount }} 条记录
                </p>
              </div>
            </div>

            <div class="space-y-3">
              <!-- 导出导入按钮 -->
              <div class="flex gap-3">
                <button
                  class="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 hover:bg-amber-100 dark:hover:bg-amber-950/60 active:scale-[0.98] transition-all text-sm"
                  @click="exportHistory"
                >
                  <Download :size="18" />
                  <span>导出记录</span>
                </button>
                <button
                  class="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 hover:bg-amber-100 dark:hover:bg-amber-950/60 active:scale-[0.98] transition-all text-sm"
                  @click="triggerImport"
                >
                  <Upload :size="18" />
                  <span>导入记录</span>
                </button>
                <!-- 隐藏的文件输入框 -->
                <input
                  ref="fileInputRef"
                  type="file"
                  accept=".json"
                  class="hidden"
                  @change="handleImportFile"
                />
              </div>

              <!-- 状态提示 -->
              <Transition
                enter-active-class="transition-all duration-200 ease-out"
                enter-from-class="opacity-0 translate-y-1"
                enter-to-class="opacity-100 translate-y-0"
                leave-active-class="transition-all duration-150 ease-in"
                leave-from-class="opacity-100 translate-y-0"
                leave-to-class="opacity-0 translate-y-1"
              >
                <div
                  v-if="importStatus !== 'idle'"
                  :class="[
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
                    importStatus === 'success'
                      ? 'bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800/50'
                      : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50'
                  ]"
                >
                  <component
                    :is="importStatus === 'success' ? CheckCircle2 : AlertCircle"
                    :size="16"
                  />
                  <span>{{ importMessage }}</span>
                </div>
              </Transition>

              <!-- 说明 -->
              <div class="flex items-start gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-xs text-gray-500 dark:text-slate-400">
                <FileJson :size="14" class="flex-shrink-0 mt-0.5 text-amber-500" />
                <p>导出为 JSON 格式，可用于备份或迁移到其他设备。导入时会自动去重。</p>
              </div>
            </div>
          </div>

          <!-- API 设置卡片 -->
          <div
            class="settings-card"
          >
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                  <Server :size="20" class="text-white" />
                </div>
                <div>
                  <h2 class="text-lg font-bold text-gray-800 dark:text-white">聚搜 API 后端</h2>
                  <p class="text-sm text-gray-500 dark:text-slate-400">选择或自定义 URL 地址</p>
                </div>
              </div>
              <!-- 部署后端 & 贡献 API 按钮 -->
              <div class="flex items-center gap-2">
                <a
                  :href="deployUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/50 hover:bg-cyan-100 dark:hover:bg-cyan-950/60 active:scale-95 transition-all"
                  @click="playTap"
                >
                  <GithubIcon :size="14" />
                  <span class="hidden sm:inline">部署后端</span>
                  <span class="sm:hidden">部署</span>
                </a>
                <a
                  :href="contributeUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/50 hover:bg-cyan-100 dark:hover:bg-cyan-950/60 active:scale-95 transition-all"
                  @click="playTap"
                >
                  <Plus :size="14" />
                  <span class="hidden sm:inline">贡献 API</span>
                  <span class="sm:hidden">贡献</span>
                </a>
              </div>
            </div>

            <!-- API 选项列表 -->
            <div class="space-y-2">
              <button
                v-for="option in apiOptions"
                :key="option.value"
                type="button"
                :class="[
                  'w-full flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 rounded-xl transition-all duration-200 text-left',
                  selectedApiOption === option.value
                    ? 'bg-gradient-to-r from-theme-primary/10 to-theme-accent/10 border-2 border-theme-primary dark:border-theme-primary-light'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-2 border-transparent hover:border-theme-primary/25 dark:hover:border-theme-primary-darker'
                ]"
                @click="selectApiOption(option.value)"
              >
                <div class="flex items-center gap-3">
                  <div
                    :class="[
                      'w-5 h-5 flex-shrink-0 rounded-full border-2 flex items-center justify-center transition-colors',
                      selectedApiOption === option.value
                        ? 'border-theme-primary bg-theme-primary'
                        : 'border-gray-300 dark:border-slate-600'
                    ]"
                  >
                    <Check v-if="selectedApiOption === option.value" :size="12" class="text-white" />
                  </div>
                  <span
                    :class="[
                      'font-medium text-sm sm:text-base',
                      selectedApiOption === option.value
                        ? 'text-theme-primary dark:text-theme-primary-light'
                        : 'text-gray-700 dark:text-slate-300'
                    ]"
                  >
                    {{ option.label }}
                  </span>
                  <!-- 延迟显示 -->
                  <span 
                    v-if="option.value !== 'custom'"
                    :class="['text-xs font-mono tabular-nums', getLatencyClass(option.value)]"
                  >
                    {{ getLatencyText(option.value) }}
                  </span>
                </div>
                <!-- 移动端：URL 显示在第二行；桌面端：显示在右侧靠右 -->
                <span 
                  v-if="option.value !== 'custom'" 
                  v-text-scroll
                  class="text-xs text-gray-400 dark:text-slate-500 font-mono mt-1.5 sm:mt-0 ml-8 sm:ml-auto sm:text-right truncate max-w-[50%]"
                >
                  {{ getApiUrl(option.value) }}
                </span>
              </button>
            </div>

            <!-- 自定义 API 输入 -->
            <Transition
              enter-active-class="transition-all duration-200 ease-out"
              enter-from-class="opacity-0 max-h-0"
              enter-to-class="opacity-100 max-h-40"
              leave-active-class="transition-all duration-200 ease-in"
              leave-from-class="opacity-100 max-h-40"
              leave-to-class="opacity-0 max-h-0"
            >
              <div
                v-if="selectedApiOption === 'custom'"
                class="overflow-hidden"
              >
                <div class="mt-4">
                  <div class="relative">
                    <LinkIcon :size="18" class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      v-model="customApiInput"
                      type="url"
                      placeholder="https://api.example.com"
                      class="api-input w-full pl-12 pr-4 py-4 text-base rounded-xl bg-slate-50 dark:bg-slate-800/80 shadow-inner focus:shadow-lg focus:shadow-theme-primary/10 transition-all duration-200 outline-none border-2 border-transparent focus:border-theme-primary text-gray-800 dark:text-slate-100 placeholder:text-gray-400"
                      @input="handleTyping"
                    />
                  </div>
                </div>
              </div>
            </Transition>
          </div>

          <!-- 自定义代码卡片 - IDE 风格 -->
          <div class="settings-card !p-0 overflow-hidden">
            <!-- IDE 风格顶部栏 -->
            <div class="flex items-center justify-between px-4 py-3 bg-[#252526] border-b border-[#3c3c3c]">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Code :size="16" class="text-white" />
                </div>
                <div>
                  <h2 class="text-sm font-semibold text-white">自定义代码</h2>
                  <p class="text-xs text-gray-400">CSS · JavaScript · HTML</p>
                </div>
              </div>
              <!-- 窗口控制按钮装饰 -->
              <div class="flex items-center gap-1.5">
                <div class="w-3 h-3 rounded-full bg-[#ff5f57]" />
                <div class="w-3 h-3 rounded-full bg-[#febc2e]" />
                <div class="w-3 h-3 rounded-full bg-[#28c840]" />
              </div>
            </div>

            <!-- IDE 风格 Tab 栏 -->
            <Tabs v-model="activeCodeTab" @update:model-value="playTap()">
              <!-- 标签栏（仿编辑器） -->
              <TabsList class="h-auto w-full justify-start rounded-none border-b border-[#3c3c3c] bg-[#2d2d2d] p-0">
                <TabsTrigger
                  v-for="tab in CODE_TABS"
                  :key="tab.key"
                  :value="tab.key"
                  class="group relative gap-2 rounded-none border-0 border-r border-[#3c3c3c] px-4 py-2 text-xs font-medium text-gray-400 transition-all last:border-r-0 hover:bg-[#383838] hover:text-gray-200 data-[state=active]:bg-[#1e1e1e] data-[state=active]:text-white data-[state=active]:shadow-none"
                >
                  <component
                    :is="tab.icon"
                    :size="14"
                    class="text-gray-500"
                    :class="[tab.groupHoverAccent, activeCodeTab === tab.key && tab.accent]"
                  />
                  <span>{{ tab.file }}</span>
                  <div
                    v-if="activeCodeTab === tab.key"
                    class="absolute right-0 bottom-0 left-0 h-0.5"
                    :class="tab.bar"
                  />
                </TabsTrigger>
              </TabsList>

              <!--
                  force-mount：三个 PrismEditor 实例保持挂载，切换标签不重建。
                  重建会丢掉光标位置与撤销栈，也白白付出高亮的开销。
                -->
              <TabsContent value="css" force-mount class="relative mt-0 data-[state=inactive]:hidden">
                <PrismEditor
                  v-model="localCustomCSS"
                  :highlight="highlightCSS"
                  :line-numbers="true"
                  class="code-editor"
                  @input="handleTyping"
                />
              </TabsContent>
              <TabsContent value="js" force-mount class="relative mt-0 data-[state=inactive]:hidden">
                <PrismEditor
                  v-model="localCustomJS"
                  :highlight="highlightJS"
                  :line-numbers="true"
                  class="code-editor"
                  @input="handleTyping"
                />
              </TabsContent>
              <TabsContent value="html" force-mount class="relative mt-0 data-[state=inactive]:hidden">
                <PrismEditor
                  v-model="localCustomHTML"
                  :highlight="highlightHTML"
                  :line-numbers="true"
                  class="code-editor"
                  @input="handleTyping"
                />
              </TabsContent>
            </Tabs>

            <!-- 底部状态栏 -->
            <div class="flex items-center justify-between bg-[#007acc] px-4 py-1.5 text-xs text-white">
              <div class="flex items-center gap-4">
                <span class="flex items-center gap-1">
                  <Info :size="12" />
                  <span>{{ currentCodeTab.hint }}</span>
                </span>
              </div>
              <div class="flex items-center gap-3 text-white/80">
                <span>UTF-8</span>
                <span>{{ currentCodeTab.lang }}</span>
              </div>
            </div>
          </div>

          <!-- 高级 API 设置卡片 -->
          <AdvancedApiSettings
            v-model="localAdvancedApi"
            @typing="handleTyping"
            @reset="onAdvancedApiReset"
          />


          <!-- 关于项目卡片 -->
          <div class="settings-card">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
                <Info :size="20" class="text-white" />
              </div>
              <div>
                <h2 class="text-lg font-bold text-gray-800 dark:text-white">关于项目</h2>
                <p class="text-sm text-gray-500 dark:text-slate-400">开源仓库与贡献</p>
              </div>
            </div>

            <div class="space-y-3">
              <!-- 仓库卡片列表 -->
              <a
                v-for="repoUrl in repoData.repositories"
                :key="repoUrl"
                :href="repoUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="block rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 hover:border-violet-400 dark:hover:border-violet-500 transition-all hover:scale-[1.01] active:scale-[0.99]"
                @click="playTap"
              >
                <img
                  v-if="githubHashTimestamp"
                  :src="`https://opengraph.githubassets.com/${githubHashTimestamp}/${getRepoPath(repoUrl)}`"
                  :alt="`${getRepoName(repoUrl)} repository`"
                  class="w-full h-auto object-cover"
                  loading="lazy"
                />
                <div v-else class="w-full aspect-[2/1] bg-slate-100 dark:bg-slate-800 animate-pulse" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import { ref, watch, computed } from 'vue'
import { playTap, playCelebration, playSelect, playType, playToggleOn, playToggleOff } from '@/composables/useSound'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { percentToRem } from '@/utils/radius'

// Prism Editor
import { PrismEditor } from 'vue-prism-editor'
import 'vue-prism-editor/dist/prismeditor.min.css'

// Prism 语法高亮
import { highlight, languages } from 'prismjs/components/prism-core'
import 'prismjs/components/prism-css'
import 'prismjs/components/prism-clike'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-markup'
import 'prismjs/themes/prism-tomorrow.css'

// CSS 语法高亮函数
function highlightCSS(code: string): string {
  // languages.* 在对应 prism-* 组件 import 后必定存在
  return languages.css ? highlight(code, languages.css, 'css') : code
}

// JS 语法高亮函数
function highlightJS(code: string): string {
  return languages.javascript ? highlight(code, languages.javascript, 'javascript') : code
}

// HTML 语法高亮函数
function highlightHTML(code: string): string {
  return languages.markup ? highlight(code, languages.markup, 'markup') : code
}

// 代码编辑器 Tab
type CodeEditorTab = 'css' | 'js' | 'html'

interface CodeTabDef {
  key: CodeEditorTab
  /** 标签上显示的文件名 */
  file: string
  icon: Component
  /** 选中时的图标色 */
  accent: string
  /** hover 时的图标色（未选中态） */
  groupHoverAccent: string
  /** 选中时底部那条高亮线 */
  bar: string
  /** 状态栏左侧提示 */
  hint: string
  /** 状态栏右侧语言名 */
  lang: string
}

// 声明成非空元组而不是数组：这样 CODE_TABS[0] 在 noUncheckedIndexedAccess
// 下也是确定有值的，下面取默认标签页时不必写非空断言。
const CODE_TABS: [CodeTabDef, ...CodeTabDef[]] = [
  {
    key: 'css', file: 'style.css', icon: Paintbrush,
    accent: 'text-theme-primary', groupHoverAccent: 'group-hover:text-theme-primary',
    bar: 'bg-theme-primary', hint: 'CSS 样式会覆盖现有样式', lang: 'CSS',
  },
  {
    key: 'js', file: 'script.js', icon: Terminal,
    accent: 'text-amber-400', groupHoverAccent: 'group-hover:text-amber-400',
    bar: 'bg-amber-400', hint: '脚本在页面加载时执行', lang: 'JavaScript',
  },
  {
    key: 'html', file: 'custom.html', icon: FileCode,
    accent: 'text-cyan-400', groupHoverAccent: 'group-hover:text-cyan-400',
    bar: 'bg-cyan-400', hint: 'HTML 添加到 body 末尾', lang: 'HTML',
  },
]

const activeCodeTab = ref<CodeEditorTab>('css')
const currentCodeTab = computed(
  () => CODE_TABS.find(t => t.key === activeCodeTab.value) ?? CODE_TABS[0],
)

// 打字音效节流
let lastTypingSound = 0
const TYPING_THROTTLE = 80

function handleTyping() {
  const now = Date.now()
  if (now - lastTypingSound >= TYPING_THROTTLE) {
    playType()
    lastTypingSound = now
  }
}
import {
  Settings as SettingsIcon,
  ChevronLeft,
  Pipette,
  Paintbrush,
  Info,
  Server,
  Link as LinkIcon,
  Terminal,
  Code,
  FileCode,
  Check,
  X,
  Plus,
  Volume2,
  Download,
  Upload,
  History,
  FileJson,
  AlertCircle,
  CheckCircle2,
  Palette,
  Sun,
  Moon,
  Monitor,
} from '@lucide/vue'
import { useSettingsStore } from '@/stores/settings'
import { useUIStore } from '@/stores/ui'
import type { ThemeMode } from '@/stores/ui'
import { THEME_PRESETS, getThemePreset, isCustomColor, deriveAccent } from '@/config/themePresets'
import AdvancedApiSettings, { type AdvancedApiConfig } from '@/components/AdvancedApiSettings.vue'
import GithubIcon from '@/components/GithubIcon.vue'
import { useHistoryStore } from '@/stores/history'
import type { SearchHistory } from '@/utils/persistence'
import apiData from '@/data/api.json'
import repoData from '@/data/repository-opengraph.json'

const settingsStore = useSettingsStore()
const historyStore = useHistoryStore()
const uiStore = useUIStore()

// ========== 外观 ==========

const THEME_MODES: { value: ThemeMode; label: string; icon: typeof Monitor }[] = [
  { value: 'system', label: '跟随系统', icon: Monitor },
  { value: 'light', label: '明亮', icon: Sun },
  { value: 'dark', label: '黑夜', icon: Moon },
]

// 主题色/明暗模式即选即生效并自行持久化，无需等「保存」
function selectThemeColor(key: string) {
  if (uiStore.themeColor === key) {return}
  playSelect()
  uiStore.setThemeColor(key)
}

/* ---------- 圆角：连续百分比 ---------- */

/** 拖动即生效；不发音效，滑动过程中会触发几十次 */
const radiusPercent = computed({
  get: () => uiStore.radius,
  set: (value: number) => uiStore.setRadius(value),
})

/** 卡片实际圆角，px，用于滑块两端的示意方块与读数 */
const radiusCardPx = computed(() => Math.round(percentToRem(uiStore.radius) * 16))

/* ---------- 主题色：取色器 ---------- */

const isCustomThemeColor = computed(() => isCustomColor(uiStore.themeColor))

/** 打开系统调色板时的初始值：已是自定义就用它，否则用当前预设的主色 */
const customColorValue = computed(() => {
  if (isCustomThemeColor.value) { return uiStore.themeColor }
  return getThemePreset(uiStore.themeColor).primary
})

const derivedAccent = computed(() =>
  isCustomThemeColor.value ? deriveAccent(uiStore.themeColor) : '',
)

/** 取色器是拖动式的，同样不发音效 */
function onPickColor(event: Event) {
  const value = (event.target as HTMLInputElement).value
  if (value) { uiStore.setThemeColor(value.toLowerCase()) }
}

function selectThemeMode(mode: ThemeMode) {
  if (uiStore.themeMode === mode) {return}
  playTap()
  uiStore.setThemeMode(mode)
}

// GitHub 关于项目相关
const githubHashTimestamp = ref('')

// 生成 SHA-256 hash
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message)
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// 获取当前日期的 YYMMDD 格式
function getDateString(): string {
  const now = new Date()
  const yy = String(now.getFullYear()).slice(-2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `${yy}${mm}${dd}`
}

// 初始化 GitHub hash
async function initGitHubHash() {
  const dateStr = getDateString()
  githubHashTimestamp.value = await sha256(dateStr)
}

// 从 GitHub URL 提取 owner/repo 路径
function getRepoPath(url: string): string {
  // https://github.com/Moe-Sakura/frontend -> Moe-Sakura/frontend
  return url.replace('https://github.com/', '')
}

// 从 GitHub URL 提取仓库名
function getRepoName(url: string): string {
  // https://github.com/Moe-Sakura/frontend -> frontend
  const parts = url.split('/')
  return parts[parts.length - 1] ?? ''
}

// 组件挂载时初始化
void initGitHubHash()

// 导入导出状态
const importStatus = ref<'idle' | 'success' | 'error'>('idle')
const importMessage = ref('')
const fileInputRef = ref<HTMLInputElement | null>(null)

// 导出搜索历史为 JSON
function exportHistory() {
  playTap()
  
  const history = historyStore.searchHistory
  if (history.length === 0) {
    importStatus.value = 'error'
    importMessage.value = '暂无搜索历史可导出'
    setTimeout(() => {
      importStatus.value = 'idle'
    }, 3000)
    return
  }
  
  const exportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    source: 'SearchGal',
    count: history.length,
    history: history,
  }
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `searchgal-history-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  playCelebration()
  importStatus.value = 'success'
  importMessage.value = `已导出 ${history.length} 条搜索记录`
  setTimeout(() => {
    importStatus.value = 'idle'
  }, 3000)
}

// 触发文件选择
function triggerImport() {
  playTap()
  fileInputRef.value?.click()
}

// 处理导入文件
function handleImportFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  
  if (!file) {return}
  
  // 重置 input 以便可以选择相同文件
  input.value = ''
  
  if (!file.name.endsWith('.json')) {
    importStatus.value = 'error'
    importMessage.value = '请选择 .json 格式的文件'
    setTimeout(() => {
      importStatus.value = 'idle'
    }, 3000)
    return
  }
  
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const content = e.target?.result as string
      const data = JSON.parse(content)
      
      // 验证数据格式
      if (!data.history || !Array.isArray(data.history)) {
        throw new Error('无效的文件格式')
      }
      
      // 验证每条记录
      const validHistory: SearchHistory[] = []
      for (const item of data.history) {
        if (
          typeof item.query === 'string' &&
          (item.mode === 'game' || item.mode === 'patch') &&
          typeof item.timestamp === 'number' &&
          typeof item.resultCount === 'number'
        ) {
          validHistory.push({
            query: item.query,
            mode: item.mode,
            timestamp: item.timestamp,
            resultCount: item.resultCount,
          })
        }
      }
      
      if (validHistory.length === 0) {
        throw new Error('文件中没有有效的搜索记录')
      }
      
      // 使用 store 的 importHistory 方法（自动去重、排序、保存）
      const importedCount = historyStore.importHistory(validHistory)
      
      playCelebration()
      importStatus.value = 'success'
      importMessage.value = `成功导入 ${importedCount} 条新记录（共 ${validHistory.length} 条）`
      setTimeout(() => {
        importStatus.value = 'idle'
      }, 3000)
    } catch (error) {
      importStatus.value = 'error'
      importMessage.value = error instanceof Error ? error.message : '导入失败'
      setTimeout(() => {
        importStatus.value = 'idle'
      }, 3000)
    }
  }
  
  reader.onerror = () => {
    importStatus.value = 'error'
    importMessage.value = '读取文件失败'
    setTimeout(() => {
      importStatus.value = 'idle'
    }, 3000)
  }
  
  reader.readAsText(file)
}

const props = defineProps<{
  isOpen: boolean
  customApi: string
  customCSS: string
}>()

const emit = defineEmits<{
  close: []
  save: [customApi: string, customCSS: string]
}>()

/**
 * 面板开关状态仍由父组件（App.vue）通过 isOpen / close 驱动，这里只是把它
 * 适配成 Dialog 需要的 v-model。音效挂在 setter 上 —— Reka 处理 Esc 与点击
 * 遮罩时只会把 open 置为 false，不经过任何组件内的函数。
 */
const open = computed({
  get: () => props.isOpen,
  set: (value: boolean) => {
    if (!value) {
      playTap()
      emit('close')
    }
  },
})

// API 服务器选项 - 从 JSON 读取
const apiOptions = [
  ...apiData.servers.map(server => ({ value: server.key, label: server.label })),
  { value: 'custom', label: '自定义' },
]

// API URL 映射 - 从 JSON 读取
const apiUrls: Record<string, string> = Object.fromEntries(
  apiData.servers.map(server => [server.key, server.url]),
)

// 部署后端 & 贡献 API 的 URL
const deployUrl = apiData.deployUrl
const contributeUrl = apiData.contributeUrl

// 默认 API 服务器 key（第一个）
const defaultApiKey = apiData.servers[0]?.key || 'custom'

// 根据 URL 判断选中的选项
function getOptionFromUrl(url: string): string {
  // 空 URL 或匹配第一个服务器（默认）
  if (!url || url === apiUrls[defaultApiKey]) {
    return defaultApiKey
  }
  // 遍历查找匹配的服务器
  for (const [key, serverUrl] of Object.entries(apiUrls)) {
    if (url === serverUrl) {
      return key
    }
  }
  return 'custom'
}

// API 延迟测量
const apiLatencies = ref<Record<string, number | null | 'error'>>({})

// 测量单个 API 延迟（使用 no-cors 模式绕过 CORS 限制）
async function measureApiLatency(apiKey: string): Promise<void> {
  const url = apiUrls[apiKey]
  if (!url) { return }
  
  apiLatencies.value[apiKey] = null // 测量中
  
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10秒超时
    
    const start = Date.now()
    // no-cors 模式：无法读取响应内容，但可以测量网络延迟
    await fetch(url, {
      method: 'GET',
      mode: 'no-cors',
      cache: 'no-store',
      signal: controller.signal,
    })
    const end = Date.now()
    
    clearTimeout(timeoutId)
    
    // 请求完成即视为成功（no-cors 模式无法读取状态码）
    apiLatencies.value[apiKey] = Math.round(end - start)
  } catch {
    apiLatencies.value[apiKey] = 'error'
  }
}

// 测量所有 API 延迟
function measureAllApiLatencies() {
  const keys = Object.keys(apiUrls)
  keys.forEach((key) => {
    void measureApiLatency(key)
  })
}

// 获取延迟显示文本
function getLatencyText(apiKey: string): string {
  const latency = apiLatencies.value[apiKey]
  if (latency === undefined || latency === null) {
    return '...'
  }
  if (latency === 'error') {
    return '超时'
  }
  return `${latency}ms`
}

// 获取延迟颜色类
function getLatencyClass(apiKey: string): string {
  const latency = apiLatencies.value[apiKey]
  if (latency === undefined || latency === null) {
    return 'text-gray-400 dark:text-slate-500'
  }
  if (latency === 'error') {
    return 'text-red-500 dark:text-red-400'
  }
  if (latency < 100) {
    return 'text-green-500 dark:text-green-400'
  }
  if (latency < 300) {
    return 'text-yellow-500 dark:text-yellow-400'
  }
  return 'text-orange-500 dark:text-orange-400'
}

// 获取 API URL
function getApiUrl(option: string): string {
  return apiUrls[option] || ''
}

const selectedApiOption = ref(getOptionFromUrl(props.customApi))
const customApiInput = ref(
  selectedApiOption.value === 'custom' ? props.customApi : '',
)
const localCustomCSS = ref(props.customCSS)
const localCustomJS = ref(settingsStore.settings.customJS)
const localCustomHTML = ref(settingsStore.settings.customHTML)

// 高级 API 设置状态（集中为一个对象，通过 v-model 传给 AdvancedApiSettings 子组件）
const localAdvancedApi = ref<AdvancedApiConfig>({
  vndbApiBaseUrl: settingsStore.settings.vndbApiBaseUrl,
  vndbImageProxyUrl: settingsStore.settings.vndbImageProxyUrl,
  aiTranslateApiUrl: settingsStore.settings.aiTranslateApiUrl,
  aiTranslateApiKey: settingsStore.settings.aiTranslateApiKey,
  aiTranslateModel: settingsStore.settings.aiTranslateModel,
  backgroundImageApiUrl: settingsStore.settings.backgroundImageApiUrl,
  videoParseApiUrl: settingsStore.settings.videoParseApiUrl,
})

// 音效设置
const localEnableSound = ref(settingsStore.settings.enableSound)

// 切换音效
function toggleSound() {
  localEnableSound.value = !localEnableSound.value
  // 播放对应的开关音效
  if (localEnableSound.value) {
    // 临时启用音效来播放开启音
    settingsStore.updateSetting('enableSound', true)
    playToggleOn()
  } else {
    playToggleOff()
    // 延迟关闭，让关闭音效播放完
    setTimeout(() => {
      settingsStore.updateSetting('enableSound', false)
    }, 150)
  }
}

// 计算最终的 API 地址
const localCustomApi = computed(() => {
  if (selectedApiOption.value === 'custom') {
    return customApiInput.value
  }
  if (selectedApiOption.value === defaultApiKey) {
    return '' // 空字符串表示使用默认
  }
  return apiUrls[selectedApiOption.value] || ''
})

// 选择 API 选项
function selectApiOption(option: string) {
  playSelect()
  selectedApiOption.value = option
  if (option !== 'custom') {
    customApiInput.value = ''
  }
}

// 监听外部变化
watch(() => props.customApi, (newValue) => {
  selectedApiOption.value = getOptionFromUrl(newValue)
  if (selectedApiOption.value === 'custom') {
    customApiInput.value = newValue
  }
})

watch(() => props.customCSS, (newValue) => {
  localCustomCSS.value = newValue
})

// 监听打开状态，同步数据
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    selectedApiOption.value = getOptionFromUrl(props.customApi)
    customApiInput.value = selectedApiOption.value === 'custom' ? props.customApi : ''
    localCustomCSS.value = props.customCSS
    localCustomJS.value = settingsStore.settings.customJS
    localCustomHTML.value = settingsStore.settings.customHTML
    // 同步高级 API 设置
    localAdvancedApi.value = {
      vndbApiBaseUrl: settingsStore.settings.vndbApiBaseUrl,
      vndbImageProxyUrl: settingsStore.settings.vndbImageProxyUrl,
      aiTranslateApiUrl: settingsStore.settings.aiTranslateApiUrl,
      aiTranslateApiKey: settingsStore.settings.aiTranslateApiKey,
      aiTranslateModel: settingsStore.settings.aiTranslateModel,
      backgroundImageApiUrl: settingsStore.settings.backgroundImageApiUrl,
      videoParseApiUrl: settingsStore.settings.videoParseApiUrl,
    }
    // 异步测量 API 延迟（不阻塞面板打开）
    setTimeout(measureAllApiLatencies, 100)
    // 同步音效设置
    localEnableSound.value = settingsStore.settings.enableSound
  }
}, { immediate: true })

function save() {
  playCelebration()
  // 保存高级 API 设置和自定义脚本/HTML
  settingsStore.updateSettings({
    customJS: localCustomJS.value,
    customHTML: localCustomHTML.value,
    ...localAdvancedApi.value,
  })
  emit('save', localCustomApi.value, localCustomCSS.value)
  emit('close')
}

// 高级 API 设置的「恢复默认」由 AdvancedApiSettings 子组件处理，
// 这里只负责播放音效
function onAdvancedApiReset() {
  playTap()
}
</script>

<style>
/* 设置面板 - 半透明效果 */
.settings-page {
  background: rgba(var(--color-bg-light, 255, 255, 255), var(--opacity-panel, 0.85));
  will-change: transform;
  border: var(--border-thin, 1px) solid rgba(var(--brand-primary, 255, 20, 147), var(--opacity-border, 0.15));
  box-shadow: var(--shadow-xl, 0 12px 32px rgba(0, 0, 0, 0.15));
}

/* 移动端无底部边框 */
@media (max-width: 767px) {
  .settings-page {
    border-bottom: none;
  }
}

/* 设置面板 - 暗色模式 */
.dark .settings-page {
  background: rgba(var(--color-bg-dark, 30, 41, 59), var(--opacity-panel-dark, 0.88));
  border-color: rgba(var(--brand-primary-light, 255, 105, 180), var(--opacity-border-dark, 0.2));
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

/* 设置卡片 - 亮色模式 */
.settings-card {
  background: rgba(var(--color-bg-light, 255, 255, 255), var(--opacity-card-inner, 0.75));
  border-radius: var(--radius-xl, 1.25rem);
  padding: var(--spacing-lg, 1.25rem);
  border: var(--border-thin, 1px) solid rgba(var(--brand-primary, 255, 20, 147), var(--opacity-border, 0.15));
  box-shadow: var(--shadow-md, 0 4px 16px rgba(0, 0, 0, 0.08));
}

/* ========== 外观：主题色色块 ========== */
.swatch {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid rgba(255, 255, 255, 0.85);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.18);
  transition: transform 0.2s var(--ease-out-back, cubic-bezier(0.34, 1.56, 0.64, 1)),
              box-shadow 0.2s ease-out;
}

.dark .swatch {
  border-color: rgba(255, 255, 255, 0.25);
}

.swatch:hover {
  transform: scale(1.15);
}

.swatch:active {
  transform: scale(0.95);
}

/* 选中态用外描边圈出，不改动色块本身的颜色 */
.swatch-active {
  box-shadow:
    0 0 0 2px rgba(var(--color-bg-light, 255, 255, 255), 0.95),
    0 0 0 4px rgb(var(--brand-primary, 255, 20, 147)),
    0 2px 8px rgba(0, 0, 0, 0.2);
}

.dark .swatch-active {
  box-shadow:
    0 0 0 2px rgba(var(--color-bg-dark, 30, 41, 59), 0.95),
    0 0 0 4px rgb(var(--brand-primary-light, 255, 105, 180)),
    0 2px 8px rgba(0, 0, 0, 0.35);
}

/* ========== 外观：明暗模式分段控件 ========== */
.mode-row {
  background: rgba(var(--brand-primary, 255, 20, 147), 0.07);
}

.dark .mode-row {
  background: rgba(var(--brand-primary-light, 255, 105, 180), 0.1);
}

/* 滑块两端的示意方块：左端恒为直角，右端跟随当前取值 */
.radius-swatch {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(var(--brand-primary, 255, 20, 147), 0.55);
  transition: border-radius 0.12s ease-out;
}

/* 取色器色块：未选中时显示滴管图标，选中后整块变成所选颜色 */
.swatch-custom {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: rgb(var(--text-secondary, 107, 114, 128));
  background:
    conic-gradient(from 0deg,
      #ff1493, #f8b125, #88bf1b, #019ae8, #4f54da, #d946ef, #ff1493);
}

.radius-range {
  appearance: none;
  height: 4px;
  border-radius: 999px;
  background: rgba(var(--brand-primary, 255, 20, 147), 0.2);
  cursor: pointer;
}

.radius-range::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgb(var(--brand-primary, 255, 20, 147));
  border: 2px solid #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
}

.radius-range::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgb(var(--brand-primary, 255, 20, 147));
  border: 2px solid #fff;
}

.mode-btn {
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 0.2s ease-out, color 0.2s ease-out;
}

.mode-btn-idle {
  color: rgb(var(--text-secondary, 107, 114, 128));
}

.mode-btn-idle:hover {
  background: rgba(var(--brand-primary, 255, 20, 147), 0.1);
  color: rgb(var(--brand-primary-dark, 199, 21, 133));
}

.dark .mode-btn-idle {
  color: rgb(var(--text-secondary, 148, 163, 184));
}

.dark .mode-btn-idle:hover {
  color: rgb(var(--brand-primary-light, 255, 105, 180));
}

.mode-btn-active {
  background: rgb(var(--brand-primary, 255, 20, 147));
  color: #fff;
  box-shadow: 0 2px 8px rgba(var(--brand-primary, 255, 20, 147), 0.35);
}

/* 设置卡片 - 暗色模式 */
.dark .settings-card {
  background: rgba(var(--color-bg-dark, 30, 41, 59), var(--opacity-card-inner-dark, 0.75));
  border: var(--border-thin, 1px) solid rgba(var(--brand-primary-light, 255, 105, 180), var(--opacity-border-dark, 0.2));
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

/* 自定义滚动条 */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, rgb(var(--brand-primary)), rgb(var(--brand-accent)));
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, rgb(var(--brand-primary-dark)), rgb(var(--brand-accent-dark)));
}

/* 输入框选中样式 */
.api-input,
.css-input {
  user-select: text;
  -webkit-user-select: text;
}

.api-input::selection,
.css-input::selection {
  background-color: rgba(var(--brand-primary), 0.3);
}

/* IDE 风格代码编辑器 */
.code-editor {
  font-family: Consolas, "Monaco", "JetBrains Mono", "Fira Code", monospace !important;
  font-size: 13px !important;
  line-height: 1.5 !important;
  min-height: 240px !important;
  max-height: 360px !important;
  background: #1e1e1e !important;
  color: #d4d4d4 !important;
  caret-color: #aeafad !important;
  tab-size: 2 !important;
  /* 外层容器只处理垂直滚动 */
  overflow-y: auto !important;
  overflow-x: hidden !important;
}

/* 禁止代码换行 */
.code-editor .prism-editor__textarea,
.code-editor .prism-editor__editor,
.code-editor pre,
.code-editor code {
  white-space: pre !important;
  word-wrap: normal !important;
  overflow-wrap: normal !important;
}

/* 让编辑器填满整个区域，点击空白处也能聚焦 */
.code-editor .prism-editor__container {
  min-height: 220px !important;
  /* 容器启用水平滚动 */
  overflow-x: auto !important;
  overflow-y: visible !important;
}

.code-editor .prism-editor__textarea,
.code-editor .prism-editor__editor {
  min-height: 220px !important;
  outline: none !important;
  /* 编辑区域内容不换行 */
  min-width: max-content !important;
}

.code-editor .prism-editor__textarea:focus {
  outline: none !important;
}

/* 行号样式 - VS Code 风格 */
.code-editor .prism-editor__line-numbers {
  padding: 0 1rem 0 0.5rem !important;
  background: #1e1e1e !important;
  color: #858585 !important;
  user-select: none !important;
  text-align: right !important;
  min-width: 2.5rem !important;
  border-right: none !important;
  margin-right: 0 !important;
}

/* 当前行高亮 */
.code-editor .prism-editor__line-number {
  transition: color 0.1s;
}

/* VS Code Dark+ 主题色 */
.code-editor .token.selector {
  color: #d7ba7d !important;
}

.code-editor .token.property {
  color: #9cdcfe !important;
}

.code-editor .token.punctuation {
  color: #d4d4d4 !important;
}

.code-editor .token.string {
  color: #ce9178 !important;
}

.code-editor .token.number,
.code-editor .token.unit {
  color: #b5cea8 !important;
}

.code-editor .token.function {
  color: #dcdcaa !important;
}

.code-editor .token.comment {
  color: #6a9955 !important;
  font-style: italic;
}

.code-editor .token.atrule,
.code-editor .token.keyword {
  color: #c586c0 !important;
}

.code-editor .token.important {
  color: #569cd6 !important;
}

.code-editor .token.tag {
  color: #569cd6 !important;
}

.code-editor .token.attr-name {
  color: #9cdcfe !important;
}

.code-editor .token.attr-value {
  color: #ce9178 !important;
}

/* 选中文本样式 - VS Code 风格 */
.code-editor .prism-editor__textarea::selection,
.code-editor .prism-editor__editor *::selection {
  background-color: #264f78 !important;
}

/* VS Code 风格滚动条 */
.code-editor::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.code-editor::-webkit-scrollbar-track {
  background: #1e1e1e;
}

.code-editor::-webkit-scrollbar-thumb {
  background: #424242;
  border-radius: 0;
}

.code-editor::-webkit-scrollbar-thumb:hover {
  background: #4f4f4f;
}

.code-editor::-webkit-scrollbar-corner {
  background: #1e1e1e;
}
</style>
