<template>
  <div v-if="searchStore.hasResults" class="w-full sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 animate-fade-in">
    <div id="results" class="sm:max-w-5xl sm:mx-auto space-y-4 sm:space-y-6">
      <!-- 渠道 / 方式 筛选栏 -->
      <ResultFilterPanel />

      <!-- 使用 v-memo 优化平台卡片渲染 + LazyRender 懒渲染 -->
      <!-- data-platform 放在 LazyRender 容器上，确保即使内容未渲染也能被站点导航找到 -->
      <LazyRender
        v-for="[platformName, platformData] in searchStore.filteredPlatformResults"
        :key="platformName"
        v-memo="[platformName, platformData.name, platformData.color, platformData.items.length, platformData.displayedCount, platformData.error, platformData.url]"
        :once="true"
        min-height="200px"
        root-margin="400px 0px"
        :data-platform="platformName"
      >
        <div
          class="result-card rounded-none sm:rounded-2xl animate-fade-in-up border-2 content-auto"
          :class="getBorderClass(platformData.color)"
        >
          <div class="p-4 sm:p-5 md:p-6">
            <!-- 站点标题行：网站名称 + 推荐标签 + 资源标签 + 结果数 -->
            <div
              class="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 pb-3 border-b"
              :class="getBorderBottomClass(platformData.color)"
            >
              <!-- 网站名称（可点击） -->
              <a
                v-if="platformData.url"
                :href="platformData.url"
                target="_blank"
                rel="noopener noreferrer"
                class="text-xl sm:text-2xl font-bold flex items-center gap-2 hover:opacity-80 cursor-pointer"
                :class="getHeaderTextColor(platformData.color)"
                :title="`访问 ${platformData.name}`"
              >
                <component :is="getPlatformIconComponent(platformData.color)" :size="24" />
                {{ platformData.name }}
                <ExternalLink :size="16" class="opacity-70" />
              </a>
              <div
                v-else
                class="text-xl sm:text-2xl font-bold flex items-center gap-2"
                :class="getHeaderTextColor(platformData.color)"
              >
                <component :is="getPlatformIconComponent(platformData.color)" :size="24" />
                {{ platformData.name }}
              </div>
            
              <!-- 推荐/付费标签 -->
              <Badge
                v-if="getRecommendText(platformData.color)"
                class="gap-1.5 rounded-full border-transparent px-3 py-1 text-xs font-bold shadow-md"
                :class="getRecommendChipClass(platformData.color)"
              >
                <component :is="platformData.color === 'red' ? AlertTriangle : Crown" :size="14" />
                {{ getRecommendText(platformData.color) }}
              </Badge>

              <!-- 站点的所有标签（去重） -->
              <Badge
                v-for="tag in getUniqueTags(platformData)"
                :key="tag"
                :class="getResultTagChipClass(tag)"
                class="gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold shadow-sm"
              >
                <component :is="getResultTagIcon(tag)" :size="12" />
                <span>{{ getResultTagLabel(tag) }}</span>
              </Badge>

              <!-- 结果数量 -->
              <Badge
                class="ml-auto shrink-0 gap-2 rounded-full border-transparent px-3 py-1.5 text-sm font-bold shadow-md"
                :class="getCountBadgeClass(platformData.color)"
              >
                <List :size="16" />
                {{ platformData.items.length }}
              </Badge>
            </div>
          
            <!-- 错误信息 -->
            <div v-if="platformData.error" class="flex items-center gap-3 p-4 mb-4 bg-red-50/90 dark:bg-red-900/50 border-2 border-red-300 dark:border-red-700 rounded-xl">
              <AlertTriangle :size="20" class="text-red-600 dark:text-red-400" />
              <span class="text-red-700 dark:text-red-300 font-medium">{{ platformData.error }}</span>
            </div>
          
            <!-- 搜索结果列表 -->
            <div v-if="getDisplayedResults(platformData).length > 0" class="results-list contain-layout space-y-2">
              <ResultItem
                v-for="(result, index) in getDisplayedResults(platformData)"
                :key="result.url || index"
                :index="index"
                :source="result"
              />
            </div>
          
            <!-- 加载更多按钮 -->
            <div v-if="platformData.items.length > platformData.displayedCount" class="load-more mt-6 flex justify-center">
              <!--
                default 变体就是 bg-primary，而 --primary 取的正是 rgb(var(--brand-primary))，
                所以原来手写的 bg-theme-primary / text-white 全部可以删掉，
                而且这样能跟着用户在设置面板里改的主题色走。
                has-[>svg]:px-6 是必须的：size="lg" 自带 has-[>svg]:px-4，它带 :has() 提权
                (0,1,1) 会赢过普通的 px-6，不覆盖的话内边距会从 24px 缩到 16px。
                ArrowDown 要显式写 size-[18px]，否则被基类的 svg size-4 压成 16px。
              -->
              <Button
                type="button"
                size="lg"
                class="h-auto rounded-xl px-6 py-3 has-[>svg]:px-6
                       font-bold shadow-lg shadow-theme-primary/30 dark:shadow-theme-primary-dark/30
                       duration-200 hover:scale-105 active:scale-95"
                @click="loadMore(platformName)"
              >
                <ArrowDown :size="18" class="size-[18px]" />
                <span>加载更多 ({{ Math.min(20, platformData.items.length - platformData.displayedCount) }})</span>
              </Button>
            </div>
          
            <!-- 已加载全部提示 -->
            <div v-else-if="platformData.items.length > 10" class="all-loaded mt-6 text-center">
              <span class="text-sm text-gray-500 dark:text-slate-400 flex items-center justify-center gap-2">
                <CheckCircle :size="16" class="text-theme-primary dark:text-theme-accent" />
                <span>已加载全部 {{ platformData.items.length }} 条结果</span>
              </span>
            </div>
          
            <div v-else-if="platformData.items.length === 0" class="no-results text-gray-500 text-center py-4">
              该平台暂无搜索结果
            </div>
          </div>
        </div>
      </LazyRender>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSearchStore } from '@/stores/search'
import type { PlatformData } from '@/stores/search'
import { playTap } from '@/composables/useSound'
import LazyRender from '@/components/LazyRender.vue'
import ResultItem from '@/components/ResultItem.vue'
import ResultFilterPanel from '@/components/ResultFilterPanel.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  getResultTagChipClass,
  getResultTagIcon,
  getResultTagLabel,
} from '@/config/resultTags'
import {
  ExternalLink,
  AlertTriangle,
  Crown,
  List,
  ArrowDown,
  CheckCircle,
  Star,
  Circle,
  DollarSign,
  XCircle,
} from '@lucide/vue'

const searchStore = useSearchStore()

// 获取站点所有结果的唯一标签
function getUniqueTags(platformData: PlatformData) {
  const allTags = new Set<string>()
  platformData.items.forEach(item => {
    if (item.tags && item.tags.length > 0) {
      item.tags.forEach(tag => allTags.add(tag))
    }
  })
  return Array.from(allTags)
}

// 获取要显示的结果（根据 displayedCount）
function getDisplayedResults(platformData: PlatformData) {
  return platformData.items.slice(0, platformData.displayedCount || 10)
}

// 加载更多
function loadMore(platformName: string) {
  playTap()
  searchStore.loadMoreResults(platformName, 20)
}

// 新增：卡片边框颜色（去掉 hover 过渡）
function getBorderClass(color: string) {
  const classes: Record<string, string> = {
    lime: 'border-lime-300 dark:border-lime-700/50',
    white: 'border-gray-300 dark:border-slate-600',
    gold: 'border-yellow-300 dark:border-yellow-700/50',
    red: 'border-red-300 dark:border-red-700/50',
  }
  return classes[color] || 'border-gray-300 dark:border-slate-600'
}

// 新增：标题区域底部边框
function getBorderBottomClass(color: string) {
  const classes: Record<string, string> = {
    lime: 'border-lime-200 dark:border-lime-800/30',
    white: 'border-gray-200 dark:border-slate-700',
    gold: 'border-yellow-200 dark:border-yellow-800/30',
    red: 'border-red-200 dark:border-red-800/30',
  }
  return classes[color] || 'border-gray-200 dark:border-slate-700'
}

// 新增：标题文字颜色（更鲜艳）
function getHeaderTextColor(color: string) {
  const classes: Record<string, string> = {
    lime: 'text-lime-600 dark:text-lime-400',
    white: 'text-gray-700 dark:text-gray-300',
    gold: 'text-yellow-600 dark:text-yellow-400',
    red: 'text-red-600 dark:text-red-400',
  }
  return classes[color] || 'text-gray-700 dark:text-gray-300'
}

// 新增：推荐标签样式（使用纯色，避免渐变）
function getRecommendChipClass(color: string) {
  const classes: Record<string, string> = {
    lime: 'bg-lime-500 text-white border-lime-600',
    gold: 'bg-yellow-500 text-white border-yellow-600',
    red: 'bg-red-500 text-white border-red-600',
  }
  return classes[color] || ''
}

// 新增：结果数量徽章（根据平台颜色）
function getCountBadgeClass(color: string) {
  const classes: Record<string, string> = {
    lime: 'bg-lime-100 dark:bg-lime-900/40 text-lime-700 dark:text-lime-300 border border-lime-300 dark:border-lime-700',
    white: 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 border border-gray-300 dark:border-slate-600',
    gold: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-700',
    red: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700',
  }
  return classes[color] || 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200'
}

// 获取平台图标组件
function getPlatformIconComponent(color: string): typeof Star       {
  const icons: Record<string, typeof Star      > = {
    lime: Star,
    white: Circle,
    gold: DollarSign,
    red: XCircle,
  }
  return icons[color] || Circle
}

function getRecommendText(color: string) {
  const texts: Record<string, string> = {
    lime: '推荐',
    gold: '付费',
    red: '不推荐',
  }
  return texts[color] || ''
}

</script>

<style scoped>
/* 平台卡片 - 半透明效果 */
.result-card {
  animation-delay: calc(var(--index, 0) * 0.1s);
  content-visibility: auto;
  contain-intrinsic-size: auto 400px;
  
  background: rgba(var(--color-bg-light, 255, 255, 255), var(--opacity-card, 0.8)) !important;
  border: var(--border-thin, 1px) solid rgba(var(--brand-primary, 255, 20, 147), var(--opacity-border, 0.15)) !important;
  box-shadow: var(--shadow-md, 0 4px 16px rgba(0, 0, 0, 0.1)) !important;
}

/* 暗色模式 */
.dark .result-card {
  background: rgba(var(--color-bg-dark, 30, 41, 59), var(--opacity-card-dark, 0.8)) !important;
  border-color: rgba(var(--brand-primary-light, 255, 105, 180), var(--opacity-border-dark, 0.2)) !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25) !important;
}

/* 结果项 - 简化动画，仅使用 transform */
.result-item {
  transition: transform 0.15s ease-out, background-color 0.15s ease-out;
}

.result-item:hover {
  transform: translateX(4px);
}

/* 结果列表布局隔离 */
.results-list {
  contain: layout style;
}

/* Tailwind 动画 - 优化为仅使用 transform 和 opacity */
.animate-fade-in {
  animation: fadeIn 0.5s ease-out;
}

.animate-fade-in-up {
  animation: fadeInUp 0.6s ease-out;
}

.animation-delay-1000 {
  animation-delay: 1s;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translate3d(0, 20px, 0);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}
</style>
