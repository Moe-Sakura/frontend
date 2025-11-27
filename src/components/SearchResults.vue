<template>
  <div v-if="searchStore.hasResults" class="w-full px-2 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 animate-fade-in">
    <div id="results" class="max-w-5xl mx-auto space-y-4 sm:space-y-6">
      <div
        v-for="[platformName, platformData] in searchStore.platformResults"
        :key="platformName"
        :data-platform="platformName"
        class="result-card bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl backdrop-saturate-150 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 animate-fade-in-up border-2"
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
              class="text-xl sm:text-2xl font-bold flex items-center gap-2 hover:scale-105 transition-all cursor-pointer"
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
            <span
              v-if="getRecommendText(platformData.color)"
              class="px-3 py-1 rounded-full text-xs font-bold shadow-md flex items-center gap-1.5"
              :class="getRecommendChipClass(platformData.color)"
            >
              <component :is="platformData.color === 'red' ? AlertTriangle : Crown" :size="14" />
              {{ getRecommendText(platformData.color) }}
            </span>
            
            <!-- 站点的所有标签（去重） -->
            <template v-for="tag in getUniqueTags(platformData)" :key="tag">
              <span
                :class="getTagClass(tag)"
                class="px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5 border"
              >
                <component :is="getTagIconComponent(tag)" :size="12" />
                <span>{{ getTagLabel(tag) }}</span>
              </span>
            </template>
            
            <!-- 结果数量 -->
            <span
              class="ml-auto px-3 py-1.5 rounded-full font-bold text-sm shadow-md flex items-center gap-2 shrink-0"
              :class="getCountBadgeClass(platformData.color)"
            >
              <List :size="16" />
              {{ platformData.items.length }}
            </span>
          </div>
          
          <!-- 错误信息 -->
          <div v-if="platformData.error" class="flex items-center gap-3 p-4 mb-4 bg-red-50 dark:bg-red-900/40 border-2 border-red-300 dark:border-red-700 rounded-xl backdrop-blur-sm">
            <AlertTriangle :size="20" class="text-red-600 dark:text-red-400" />
            <span class="text-red-700 dark:text-red-300 font-medium">{{ platformData.error }}</span>
          </div>
          
          <!-- 搜索结果列表 -->
          <div v-if="getDisplayedResults(platformData).length > 0" class="results-list space-y-2">
            <div
              v-for="(result, index) in getDisplayedResults(platformData)"
              :key="index"
              class="result-item group p-3 sm:p-4 rounded-xl 
                     bg-gradient-to-r from-white/60 to-white/40 dark:from-slate-700/60 dark:to-slate-700/40
                     hover:from-white/90 hover:to-white/70 dark:hover:from-slate-700/90 dark:hover:to-slate-700/70
                     backdrop-blur-sm
                     border border-gray-200/50 dark:border-slate-600/50
                     hover:border-theme-primary/40 dark:hover:border-theme-accent/40
                     hover:shadow-lg hover:shadow-theme-primary/10 dark:hover:shadow-theme-accent/15
                     transition-all duration-300"
            >
              <!-- 标题行 -->
              <div class="flex items-start gap-2 sm:gap-3">
                <span class="text-theme-primary dark:text-theme-accent text-sm font-bold mt-0.5 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                  {{ index + 1 }}.
                </span>
                <a
                  :href="result.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-gray-800 dark:text-slate-200 group-hover:text-theme-primary dark:group-hover:text-theme-accent font-semibold flex-1 text-sm sm:text-base break-words transition-colors leading-relaxed"
                >
                  {{ result.title }}
                </a>
              </div>
              
              <!-- 资源相对路径（从URL中提取） -->
              <div v-if="result.url" class="flex items-center gap-2 mt-2 ml-6 sm:ml-8">
                <LinkIcon :size="12" class="text-theme-primary/50 dark:text-theme-accent/50" />
                <span class="text-xs text-gray-500 dark:text-slate-400 break-all font-mono bg-gray-100/80 dark:bg-slate-800/80 px-2 py-1 rounded">
                  {{ extractPath(result.url) }}
                </span>
              </div>
            </div>
          </div>
          
          <!-- 加载更多按钮 -->
          <div v-if="platformData.items.length > platformData.displayedCount" class="load-more mt-6 flex justify-center">
            <button
              class="px-6 py-3 rounded-xl
                     bg-gradient-pink text-white font-bold
                     backdrop-blur-md
                     border border-white/30 dark:border-white/20
                     shadow-lg shadow-theme-primary/20 dark:shadow-theme-accent/25
                     hover:shadow-xl hover:shadow-theme-primary/30 dark:hover:shadow-theme-accent/35
                     hover:scale-105
                     active:scale-95
                     transition-all duration-300
                     flex items-center gap-2"
              @click="loadMore(platformName)"
            >
              <ArrowDown :size="18" />
              <span>加载更多 ({{ Math.min(20, platformData.items.length - platformData.displayedCount) }})</span>
            </button>
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSearchStore } from '@/stores/search'
import type { PlatformData } from '@/stores/search'
import {
  ExternalLink,
  AlertTriangle,
  Crown,
  List,
  Link as LinkIcon,
  ArrowDown,
  CheckCircle,
  Star,
  Circle,
  DollarSign,
  XCircle,
  User,
  Coins,
  MessageCircle,
  Reply,
  Server,
  Rocket,
  Turtle,
  Layers,
  Magnet,
  Wand2,
  Tag as TagIcon,
} from 'lucide-vue-next'

const searchStore = useSearchStore()

// 从URL中提取路径
function extractPath(url: string): string {
  try {
    const urlObj = new URL(url)
    // 返回路径部分（去掉域名）
    return urlObj.pathname + urlObj.search + urlObj.hash
  } catch {
    // 如果URL解析失败，返回完整URL
    return url
  }
}

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
  searchStore.loadMoreResults(platformName, 20)
}

// 新增：卡片边框颜色
function getBorderClass(color: string) {
  const classes: Record<string, string> = {
    lime: 'border-lime-300 dark:border-lime-700/50 hover:border-lime-400 dark:hover:border-lime-600',
    white: 'border-gray-300 dark:border-slate-600 hover:border-gray-400 dark:hover:border-slate-500',
    gold: 'border-yellow-300 dark:border-yellow-700/50 hover:border-yellow-400 dark:hover:border-yellow-600',
    red: 'border-red-300 dark:border-red-700/50 hover:border-red-400 dark:hover:border-red-600',
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

// 新增：推荐标签样式（更醒目）
function getRecommendChipClass(color: string) {
  const classes: Record<string, string> = {
    lime: 'bg-gradient-to-r from-lime-400 to-green-500 text-white border-lime-500',
    gold: 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-yellow-500',
    red: 'bg-gradient-to-r from-red-400 to-pink-500 text-white border-red-500',
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
function getPlatformIconComponent(color: string): typeof Star | typeof Circle | typeof DollarSign | typeof XCircle {
  const icons: Record<string, typeof Star | typeof Circle | typeof DollarSign | typeof XCircle> = {
    lime: Star,
    white: Circle,
    gold: DollarSign,
    red: XCircle,
  }
  return icons[color] || Circle
}

// 获取标签图标组件
function getTagIconComponent(tag: string): typeof CheckCircle | typeof User | typeof Coins | typeof MessageCircle | typeof Reply | typeof Server | typeof Rocket | typeof Turtle | typeof Layers | typeof Magnet | typeof Wand2 | typeof TagIcon {
  const icons: Record<string, typeof CheckCircle | typeof User | typeof Coins | typeof MessageCircle | typeof Reply | typeof Server | typeof Rocket | typeof Turtle | typeof Layers | typeof Magnet | typeof Wand2 | typeof TagIcon> = {
    'NoReq': CheckCircle,
    'Login': User,
    'LoginPay': Coins,
    'LoginRep': MessageCircle,
    'Rep': Reply,
    'SuDrive': Server,
    'NoSplDrive': Rocket,
    'SplDrive': Turtle,
    'MixDrive': Layers,
    'BTmag': Magnet,
    'magic': Wand2,
  }
  return icons[tag] || TagIcon
}

function getRecommendText(color: string) {
  const texts: Record<string, string> = {
    lime: '推荐',
    gold: '付费',
    red: '不推荐',
  }
  return texts[color] || ''
}

// 标签样式映射（根据 Cloudflare Workers API 文档）- 优化配色
function getTagClass(tag: string) {
  const classes: Record<string, string> = {
    'NoReq': 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-400 dark:border-green-600',
    'Login': 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-400 dark:border-blue-600',
    'LoginPay': 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 border-yellow-400 dark:border-yellow-600',
    'LoginRep': 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-purple-400 dark:border-purple-600',
    'Rep': 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border-indigo-400 dark:border-indigo-600',
    'SuDrive': 'bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300 border-pink-400 dark:border-pink-600',
    'NoSplDrive': 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-400 dark:border-emerald-600',
    'SplDrive': 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border-orange-400 dark:border-orange-600',
    'MixDrive': 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 border-cyan-400 dark:border-cyan-600',
    'BTmag': 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 border-violet-400 dark:border-violet-600',
    'magic': 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-400 dark:border-red-600',
  }
  return classes[tag] || 'bg-gray-100 dark:bg-gray-800/40 text-gray-600 dark:text-gray-400 border-gray-400 dark:border-gray-600'
}

// 标签图标映射
// 标签文本映射
function getTagLabel(tag: string) {
  const labels: Record<string, string> = {
    'NoReq': '直接下载',
    'Login': '需登录',
    'LoginPay': '需积分',
    'LoginRep': '登录+留言',
    'Rep': '需留言',
    'SuDrive': '自建盘',
    'NoSplDrive': '不限速',
    'SplDrive': '限速盘',
    'MixDrive': '混合盘',
    'BTmag': 'BT/磁力',
    'magic': '需魔法',
  }
  return labels[tag] || tag
}
</script>

<style scoped>
.result-card {
  animation-delay: calc(var(--index, 0) * 0.1s);
}

.result-item {
  transition: all 0.2s ease;
}

.result-item:hover {
  transform: translateX(4px);
}

/* Tailwind 动画 */
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
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
