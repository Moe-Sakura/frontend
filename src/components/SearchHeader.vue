<template>
  <div class="container mx-auto w-full px-4 sm:px-6 lg:px-8">
    <!-- 上半部分：标题和搜索框 - 底部对齐到视口中心 -->
    <div class="flex flex-col items-center justify-end min-h-[48vh] sm:min-h-[50vh] pb-2">
      <!-- Title - 艳粉主题 -->
      <h1
        class="header-title text-3xl sm:text-4xl lg:text-5xl font-bold text-center mb-6 sm:mb-8 animate-fade-in-down
                 text-white
                 drop-shadow-[0_2px_8px_rgba(var(--brand-primary),0.6)]
                 dark:drop-shadow-[0_2px_12px_rgba(var(--brand-primary-light),0.8)]"
        style="text-shadow: 0 0 30px rgba(var(--brand-primary), 0.4), 0 0 60px rgba(var(--brand-primary-light), 0.2);"
      >
        <span class="whitespace-nowrap">Galgame 聚合搜索</span>
      </h1>

      <!-- Search Form -->
      <form
        class="search-form w-full max-w-2xl px-2 sm:px-0 animate-fade-in-up"
        @submit.prevent="triggerSearch"
      >
        <div class="flex flex-col gap-5">
          <!--
            输入框整块（发光层 / 进度填充层 / 图标 / input / 右侧控件）的层叠关系很脆：
            .search-box 的 overflow-hidden 负责裁圆角，填充层 z-0 < input z-10 < 图标与
            右侧控件 z-20，高光 ::after z-5，搜索态底色 ::before z--1。
            这里没有换成 shadcn Input —— 理由见本文件 script 块末尾的说明。
          -->
          <div
            class="search-input-wrapper group relative"
            :class="{ 'is-searching': searchStore.isSearching }"
          >
            <!-- 外层发光效果 -->
            <div
              class="absolute -inset-0.5 rounded-[1.25rem] opacity-0 group-hover:opacity-100 group-focus-within:opacity-100
                     bg-gradient-to-r from-theme-primary/30 via-theme-accent/20 to-theme-primary-light/30
                     blur-lg transition-opacity duration-500"
              :class="{ 'opacity-100': searchStore.isSearching }"
            />

            <!-- 输入框容器 -->
            <div class="search-box relative flex items-center rounded-2xl overflow-hidden">
              <!-- 进度填充层 - 输入框本身就是进度条 -->
              <div
                v-if="searchStore.isSearching"
                class="search-progress-fill absolute inset-0 z-0 pointer-events-none
                       bg-gradient-to-r from-theme-primary/20 via-theme-accent/15 to-theme-primary-light/20
                       dark:from-theme-primary/25 dark:via-theme-accent/20 dark:to-theme-primary-light/25"
                :style="{ clipPath: `inset(0 ${100 - searchProgressPercent}% 0 0)` }"
              />

              <!-- 搜索图标 / 加载动画 -->
              <div class="absolute left-4 sm:left-5 z-20 pointer-events-none">
                <component
                  :is="searchStore.isSearching ? Loader2 : Search"
                  :size="22"
                  :class="[
                    searchStore.isSearching
                      ? 'text-theme-primary dark:text-theme-primary-light animate-spin'
                      : 'text-theme-primary/50 dark:text-theme-primary-light/60 group-hover:text-theme-primary/70 dark:group-hover:text-theme-primary-light/80 group-focus-within:text-theme-primary dark:group-focus-within:text-theme-primary-light group-focus-within:scale-110',
                    'transition-all duration-300'
                  ]"
                />
              </div>

              <!--
                type="search" 与 placeholder 文案是 useKeyboardShortcuts 里 `/` 快捷键的
                选择器依据（input[type="search"], input[placeholder*="搜索"]），改动会静默失效。
              -->
              <input
                ref="searchInputRef"
                v-model="searchQuery"
                type="search"
                :placeholder="searchMode === 'game' ? '搜索游戏...' : '搜索补丁...'"
                :disabled="searchStore.isSearching"
                required
                class="search-input relative z-10 w-full pl-12 sm:pl-14 pr-14 sm:pr-20 py-4 sm:py-5
                       text-base sm:text-lg rounded-2xl
                       text-gray-800 dark:text-slate-100
                       placeholder:text-gray-400/80 dark:placeholder:text-slate-400/70
                     glassmorphism-input
                       transition-all duration-300 outline-none font-medium
                       tracking-wide
                       disabled:cursor-not-allowed"
                :class="{ 'bg-transparent!': searchStore.isSearching }"
                @input="handleTyping"
                @keydown.enter.prevent="triggerSearch"
              />

              <!-- 右侧：清除按钮 + 回车提示 / 进度指示（三者互斥） -->
              <div class="absolute right-3 sm:right-4 z-20 flex items-center gap-2">
                <!-- 清除按钮 - 有输入且非搜索时显示 -->
                <Button
                  v-if="searchQuery && !searchStore.isSearching"
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label="清除搜索内容"
                  class="rounded-full text-gray-400 duration-200
                         hover:bg-theme-primary/10 hover:text-theme-primary
                         dark:hover:bg-theme-primary-light/15 dark:hover:text-theme-primary-light"
                  @click="clearSearch"
                >
                  <XCircle :size="18" class="size-[18px]" />
                </Button>

                <!-- 搜索时显示进度（tabular-nums 防止数字跳动带得右侧控件抖动） -->
                <span
                  v-if="searchStore.isSearching"
                  class="text-sm font-bold text-theme-primary dark:text-theme-primary-light tabular-nums"
                >
                  {{ searchStore.searchProgress.current }}/{{ searchStore.searchProgress.total }}
                </span>

                <!-- 非搜索时显示回车提示 -->
                <kbd
                  v-else
                  class="enter-hint inline-flex items-center gap-1 sm:gap-1.5
                         px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-xs font-medium
                         bg-gray-100/80 dark:bg-slate-700/60
                         text-gray-500 dark:text-slate-400
                         border border-gray-200/50 dark:border-slate-600/50
                         group-focus-within:bg-theme-primary/10 group-focus-within:text-theme-primary
                         dark:group-focus-within:bg-theme-primary-light/15 dark:group-focus-within:text-theme-primary-light
                         group-focus-within:border-theme-primary/30 dark:group-focus-within:border-theme-primary-light/30
                         transition-all duration-200"
                >
                  <CornerDownLeft :size="14" />
                  <span class="hidden sm:inline">Enter</span>
                </kbd>
              </div>
            </div>
          </div>

          <!--
            搜索模式选择器。ToggleGroup 提供 role="group" + aria-pressed + 方向键切换，
            这是原来两个裸 button 完全缺失的语义（读屏用户看不出哪个模式是选中的）。
            外观仍由下面 style scoped 里的 .mode-switch / .mode-btn 承载：scoped 样式
            没有 @layer，永远赢过 toggleVariants 的工具类，不必跟 tailwind-merge 斗智。
          -->
          <div class="flex justify-center items-center">
            <ToggleGroup
              type="single"
              aria-label="搜索模式"
              :model-value="searchMode"
              class="mode-switch liquid-mode-switch relative flex rounded-2xl"
              @update:model-value="onModeChange"
            >
              <!-- 高光装饰：无 z-index，靠 DOM 顺序压在指示器之下，不要调整顺序 -->
              <div class="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                <div class="absolute inset-0 bg-gradient-to-br from-white/30 via-white/5 to-transparent" />
              </div>

              <!-- 滑动背景指示器：位置由 CSS 按容器内边距推导，见 .mode-indicator -->
              <div
                class="mode-indicator absolute rounded-xl
                       bg-gradient-to-r from-theme-primary to-theme-accent
                       shadow-lg shadow-theme-primary/40
                       transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                :data-mode="searchMode"
              />

              <ToggleGroupItem
                v-for="option in SEARCH_MODE_OPTIONS"
                :key="option.value"
                :value="option.value"
                class="mode-btn"
              >
                <component :is="option.icon" :size="18" class="size-[18px]" />
                <span>{{ option.label }}</span>
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </form>
    </div>

    <!-- 下半部分：错误消息 -->
    <div class="flex flex-col items-center pt-3 sm:pt-4">
      <SearchErrorCard
        :error="searchStore.errorMessage"
        :retry-disabled="isSearchLocked"
        @close="searchStore.errorMessage = ''"
        @retry="triggerSearch"
      />
    </div>

    <!-- Usage Notice - 独立于居中区域 - 艳粉主题（文案数据见 @/config/usageNotice） -->
    <div class="-mx-4 sm:mx-auto sm:max-w-5xl mt-8 sm:mt-12 animate-fade-in animation-delay-1000">
      <div
        class="usage-notice
               glassmorphism-card
               rounded-none sm:rounded-3xl
               shadow-xl shadow-theme-primary/10 dark:shadow-theme-accent/20
               p-4 sm:p-6 lg:p-8"
      >
        <h2
          class="text-xl sm:text-2xl font-bold
                 bg-gradient-to-r from-theme-primary to-theme-accent bg-clip-text text-transparent
                 mb-5 sm:mb-6 flex items-center gap-2"
        >
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-theme-primary to-theme-accent flex items-center justify-center shadow-lg shadow-theme-primary/30">
            <Info :size="18" class="text-white" />
          </div>
          使用须知
        </h2>

        <div class="space-y-4">
          <!-- 说明列表之前的提示卡 -->
          <div
            v-for="callout in USAGE_CALLOUTS"
            :key="callout.key"
            class="p-3 sm:p-4 rounded-xl"
            :class="callout.cardClass"
          >
            <div class="flex items-start gap-3">
              <div
                class="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                :class="callout.iconWrapClass"
              >
                <component :is="callout.icon" :size="14" class="text-white" />
              </div>
              <!-- eslint-disable-next-line vue/no-v-html -- 文案是 config 里的编译期常量，无运行时输入 -->
              <p class="text-sm" :class="callout.textClass" v-html="callout.html" />
            </div>
          </div>

          <!-- 使用说明列表 -->
          <div class="grid gap-3 text-sm text-gray-600 dark:text-slate-400">
            <div
              v-for="tip in USAGE_TIPS"
              :key="tip.key"
              class="flex items-start gap-2.5"
            >
              <component
                :is="tip.icon"
                :size="16"
                class="flex-shrink-0 mt-0.5"
                :class="tip.iconClass"
              />
              <!-- eslint-disable-next-line vue/no-v-html -- 同上 -->
              <p v-html="tip.html" />
            </div>
          </div>

          <!-- 说明列表之后的卡片（「支持我们」）。结构与上面那组相同，只是夹着说明列表 -->
          <div
            v-for="callout in USAGE_FOOTER_CALLOUTS"
            :key="callout.key"
            class="p-3 sm:p-4 rounded-xl"
            :class="callout.cardClass"
          >
            <div class="flex items-start gap-3">
              <div
                class="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                :class="callout.iconWrapClass"
              >
                <component :is="callout.icon" :size="14" class="text-white" />
              </div>
              <!-- eslint-disable-next-line vue/no-v-html -- 同上 -->
              <p class="text-sm" :class="callout.textClass" v-html="callout.html" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 友情链接（数据见 src/data/friends.json） -->
    <div
      v-if="FRIEND_LINKS.length > 0"
      class="-mx-4 sm:mx-auto sm:max-w-5xl mt-6 sm:mt-8 animate-fade-in animation-delay-1000"
    >
      <div
        class="glassmorphism-card rounded-none sm:rounded-3xl
               shadow-xl shadow-theme-primary/10 dark:shadow-theme-accent/20
               p-4 sm:p-6"
      >
        <div class="flex items-center justify-between mb-4">
          <h2
            class="text-lg sm:text-xl font-bold
                   text-theme-primary dark:text-theme-accent
                   flex items-center gap-2"
          >
            <Link2 :size="18" />
            友情链接
          </h2>
          <a
            :href="FRIEND_SUBMIT_URL"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                   text-white bg-gradient-to-r from-theme-primary to-theme-accent
                   shadow-md shadow-theme-primary/20 hover:shadow-lg hover:shadow-theme-primary/30
                   transition-all"
          >
            <GitPullRequestArrow :size="14" />
            <span>交换友链</span>
          </a>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <a
            v-for="friend in FRIEND_LINKS"
            :key="friend.url"
            :href="friend.url"
            target="_blank"
            rel="noopener noreferrer"
            class="friend-card group flex items-center gap-3 p-3 rounded-xl
                   bg-white/50 dark:bg-slate-800/50
                   border border-gray-200/50 dark:border-slate-700/50
                   hover:border-theme-primary/30 dark:hover:border-theme-primary-light/30
                   hover:shadow-lg hover:shadow-theme-primary/10
                   transition-all duration-300"
          >
            <img
              :src="friend.logo"
              :alt="friend.name"
              class="w-10 h-10 rounded-lg object-cover bg-gray-100 dark:bg-slate-700 flex-shrink-0"
              loading="lazy"
              referrerpolicy="no-referrer"
              @error="handleFriendLogoError"
            />
            <div class="flex-1 min-w-0">
              <h3 class="font-bold text-gray-800 dark:text-white text-sm group-hover:text-theme-primary dark:group-hover:text-theme-primary-light transition-colors truncate">
                {{ friend.name }}
              </h3>
              <p class="text-xs text-gray-500 dark:text-slate-400 truncate">
                {{ friend.desc }}
              </p>
            </div>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import { computed, ref } from 'vue'
import { useSearchStore } from '@/stores/search'
import { useSearchOrchestration, type SearchMode } from '@/composables/useSearchOrchestration'
import SearchErrorCard from '@/components/SearchErrorCard.vue'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { USAGE_CALLOUTS, USAGE_FOOTER_CALLOUTS, USAGE_TIPS } from '@/config/usageNotice'
import { FRIEND_LINKS, FRIEND_SUBMIT_URL, handleFriendLogoError } from '@/config/friendLinks'
import {
  Search,
  Gamepad2,
  Wrench,
  Info,
  Loader2,
  CornerDownLeft,
  XCircle,
  Link2,
  GitPullRequestArrow,
} from '@lucide/vue'

const searchStore = useSearchStore()

/**
 * 搜索的全部业务逻辑（SSE 编排、URL 同步、VNDB 预取、竞态防护）都在这个
 * composable 里，本组件只负责渲染。
 */
/** DOM 引用归组件所有，传给 composable 供搜索完成后自动对焦 */
const searchInputRef = ref<HTMLInputElement | null>(null)

const {
  searchQuery,
  searchMode,
  isSearchLocked,
  handleTyping,
  setSearchMode,
  clearSearch,
  triggerSearch,
  searchWithParams,
} = useSearchOrchestration({ searchInputRef })

/** 两个模式的结构完全对称，抽成表以免图标/文案两处各改一遍 */
const SEARCH_MODE_OPTIONS: readonly { value: SearchMode, label: string, icon: Component }[] = [
  { value: 'game', label: '游戏', icon: Gamepad2 },
  { value: 'patch', label: '补丁', icon: Wrench },
]

/**
 * 进度百分比。三元是防除零：total 为 0 时给 0，
 * clip-path 的 inset 右侧就会裁掉 100%，填充层完全不可见。
 */
const searchProgressPercent = computed(() => {
  const { current, total } = searchStore.searchProgress
  return total > 0 ? (current / total) * 100 : 0
})

/**
 * ToggleGroup 单选模式下再次点击已选中项时，Reka 会给出 undefined（取消选择）——
 * 搜索模式必须二选一，非法值直接忽略，:model-value 会把 UI 拉回原状。
 */
function onModeChange(next: unknown) {
  if (next !== 'game' && next !== 'patch') { return }
  setSearchMode(next)
}

/**
 * 唯一的对外契约：App.vue 通过 ref 调用它回填搜索框（不发起搜索）。
 * 签名不能变。
 */
defineExpose({
  searchWithParams,
})

/*
 * 关于搜索输入框为什么没换成 shadcn Input：
 * 它的基类 h-9 / rounded-md / border-input / bg-transparent / dark:bg-input/30 /
 * px-3 py-1 / shadow-xs / text-base md:text-sm / focus-visible:ring-3 /
 * disabled:opacity-50 全部要推翻，光覆盖类就十来个；其中 disabled:opacity-50 会让
 * 搜索中（input 被 disabled）的文字整体变淡，focus-visible:ring-3 又会和自定义的
 * ::after 描边动画打架。而且 ref 会从 HTMLInputElement 变成组件实例，
 * searchWithParams 里的 .focus() 得改成 .$el.focus()。
 * 观感本来就由 .glassmorphism-input 提供，换过去是纯成本，故保留原生 input。
 */
</script>

<style scoped>
/* 动画 */
.animate-fade-in-down {
  animation: fadeInDown 0.6s ease-out;
}

.animate-fade-in-up {
  animation: fadeInUp 0.6s ease-out;
}

.animate-fade-in {
  animation: fadeIn 0.6s ease-out;
}

.animation-delay-1000 {
  animation-delay: 1s;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
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

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/*
 * ⚠️ .mode-btn 的规则一律要写成 .mode-switch :deep(.mode-btn ...)。
 *
 * ToggleGroupItem 渲染出的 <button> 拿不到本组件 scoped 的 data-v 属性
 * （实测：ToggleGroup 的根元素有 data-v-xxx，它渲染的子按钮没有），
 * 所以直接写 .mode-btn 编译出来是 .mode-btn[data-v-xxx]，永远匹配不上，
 * 文字色会静默落回 toggleVariants 的 data-[state=on]:text-accent-foreground
 * ——粉底上一层深洋红字，几乎看不见。
 * ToggleGroup 的根拿得到 data-v，所以从容器穿透进去。
 */

/* ============================================
   搜索输入框增强样式
   ============================================ */

/* 搜索输入框 - 隐藏默认的清除按钮和搜索图标 */
.search-input::-webkit-search-cancel-button,
.search-input::-webkit-search-decoration,
.search-input::-webkit-search-results-button,
.search-input::-webkit-search-results-decoration {
  -webkit-appearance: none;
  appearance: none;
}

/* 搜索框容器 - 液态玻璃效果 */
.search-box {
  position: relative;
}

/* 搜索框液态玻璃高光 */
.search-box::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.5) 0%,
    rgba(255, 255, 255, 0.1) 30%,
    transparent 50%
  );
  pointer-events: none;
  z-index: 5;
  opacity: 0.6;
  transition: opacity 0.3s ease;
}

.search-input-wrapper:hover .search-box::after,
.search-input-wrapper:focus-within .search-box::after {
  opacity: 1;
}

.dark .search-box::after {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.15) 0%,
    rgba(255, 255, 255, 0.03) 30%,
    transparent 50%
  );
  opacity: 0.4;
}

.dark .search-input-wrapper:hover .search-box::after,
.dark .search-input-wrapper:focus-within .search-box::after {
  opacity: 0.7;
}

/* 进度填充层 - 输入框即进度条 */
.search-progress-fill {
  transition: clip-path 0.3s ease-out;
}

/* 搜索中状态 - 输入框整体效果 */
.search-input-wrapper.is-searching .search-box {
  box-shadow:
    0 0 0 2px rgba(var(--brand-primary), 0.4),
    0 0 25px rgba(var(--brand-primary), 0.2),
    0 0 50px rgba(var(--brand-primary), 0.1);
}

.dark .search-input-wrapper.is-searching .search-box {
  box-shadow:
    0 0 0 2px rgba(var(--brand-primary-light), 0.5),
    0 0 25px rgba(var(--brand-primary-light), 0.25),
    0 0 50px rgba(var(--brand-primary-light), 0.15);
}

/* 搜索中输入框透明背景，好让底下的进度填充层透出来 */
.search-input-wrapper.is-searching .glassmorphism-input {
  background: transparent !important;
  border-color: transparent !important;
  box-shadow: none !important;
}

/* 上面把输入框打成全透明后，这层补回不透明底色，否则会直接露出背景图 */
.search-input-wrapper.is-searching .search-box::before {
  content: '';
  position: absolute;
  inset: 0;
  /* 与 .glassmorphism-input 的圆角保持一致，否则伪元素会露出直角 */
  border-radius: var(--radius-2xl);
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(255, 245, 250, 0.92) 100%
  );
  z-index: -1;
}

.dark .search-input-wrapper.is-searching .search-box::before {
  background: linear-gradient(
    135deg,
    rgba(30, 41, 59, 0.9) 0%,
    rgba(51, 65, 85, 0.85) 100%
  );
}

/* 输入框聚焦时浮现的渐变描边（mask 挖空中间，只留一圈） */
.search-input-wrapper::after {
  content: '';
  position: absolute;
  inset: 0;
  /* 与 .glassmorphism-input 的圆角保持一致，否则伪元素会露出直角 */
  border-radius: var(--radius-2xl);
  padding: 2px;
  background: linear-gradient(
    135deg,
    transparent 0%,
    rgba(var(--brand-primary), 0.4) 25%,
    rgba(var(--brand-accent), 0.4) 50%,
    rgba(var(--brand-primary-light), 0.4) 75%,
    transparent 100%
  );
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.search-input-wrapper:focus-within::after {
  opacity: 1;
}

/* ============================================
   模式切换器（游戏 / 补丁）
   外层是 ToggleGroup、每一项是 ToggleGroupItem；
   scoped 样式没有 @layer，永远赢过 toggleVariants 的工具类，
   所以整套外观都写在这里，不跟 tailwind-merge 抢覆盖顺序。
   ============================================ */

.mode-switch {
  /*
   * 指示器的位置完全由这个内边距推导，写成变量以免和 padding 走散：
   * 设单个按钮宽 W、内边距 P，容器宽 = 2W + 2P（绝对定位百分比的基准）。
   * 50% = W + P；指示器宽 calc(50% - P) = W。
   * game  → left: P    → [P, P+W]，正好盖住按钮 1
   * patch → left: 50%  → [W+P, 2W+P]，右缘距容器右侧也正好是 P
   * 成立的前提是两个按钮等宽（移动端靠 flex:1 保证；桌面端靠两个模式都是
   * 两个汉字 + 同尺寸图标 —— 改文案长度会让指示器错位）。
   */
  --mode-switch-pad: 0.375rem;
  padding: var(--mode-switch-pad);
}

/* 玻璃质感单独挂在 .liquid-mode-switch 上（.mode-switch 只管几何），与重构前一致 */
.liquid-mode-switch {
  background: rgba(var(--color-bg-light, 255, 255, 255), var(--opacity-button, 0.75));
  border: var(--border-thin, 1px) solid rgba(var(--brand-primary, 255, 20, 147), var(--opacity-border, 0.15));
  box-shadow: var(--shadow-md, 0 4px 12px rgba(0, 0, 0, 0.1));
}

.dark .liquid-mode-switch {
  background: rgba(var(--color-bg-dark, 30, 41, 59), var(--opacity-button-dark, 0.75));
  border-color: rgba(var(--brand-primary-light, 255, 105, 180), var(--opacity-border-dark, 0.2));
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}

.mode-indicator {
  top: var(--mode-switch-pad);
  bottom: var(--mode-switch-pad);
  width: calc(50% - var(--mode-switch-pad));
  will-change: left, width;
}

.mode-indicator[data-mode='game'] {
  left: var(--mode-switch-pad);
}

.mode-indicator[data-mode='patch'] {
  left: 50%;
}

/* 盒模型与排版全部覆写 toggleVariants 的 h-9 / px-2 / rounded-md / gap-2 等 */
.mode-switch :deep(.mode-btn) {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.625rem;
  height: auto;
  min-width: 0;
  padding: 0.625rem 1.25rem;
  border-radius: var(--radius-xl);
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.25rem;
  white-space: nowrap;
  /* 选中态的实心底色由兄弟节点 .mode-indicator 提供，按钮自身必须透明 */
  background: transparent;
  /*
   * cursor 以前是白蹭 SettingsModal 那个**非 scoped** 样式块里同名的 .mode-btn
   * 规则（它在全局泄漏），设置面板还没加载时其实拿不到，这里显式写死。
   * 过渡时长同样对齐那条泄漏规则实际生效的 0.2s —— 模板上写的
   * transition-all duration-300 是 @layer utilities 里的，一直被无 layer 的
   * 泄漏规则压着，从来没生效过。transform 不进过渡，按压反馈保持即时。
   */
  cursor: pointer;
  transition: color 0.2s ease-out;
}

@media (min-width: 640px) {
  .mode-switch :deep(.mode-btn) {
    padding-left: 1.75rem;
    padding-right: 1.75rem;
  }
}

.mode-switch :deep(.mode-btn[data-state='on']) {
  color: #fff;
}

/* 选中态图标压一层投影，让它在渐变底色上更立得住 */
.mode-switch :deep(.mode-btn[data-state='on'] svg) {
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
}

/* 75,85,99 / 148,163,184 = 原来的 text-gray-600 / dark:text-slate-400，保持原值 */
.mode-switch :deep(.mode-btn[data-state='off']) {
  color: rgb(75, 85, 99);
}

.mode-switch :deep(.mode-btn[data-state='off']:hover) {
  color: rgb(var(--brand-primary));
}

.dark .mode-switch :deep(.mode-btn[data-state='off']) {
  color: rgb(148, 163, 184);
}

.dark .mode-switch :deep(.mode-btn[data-state='off']:hover) {
  color: rgb(var(--brand-primary-light));
}

/* 模式按钮点击反馈 */
.mode-switch :deep(.mode-btn:active) {
  transform: scale(0.97);
}

.mode-switch :deep(.mode-btn::after) {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: var(--radius-xl);
  background: linear-gradient(135deg, rgba(var(--brand-primary), 0.1), rgba(var(--brand-accent), 0.05));
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;
}

/*
 * 原来写的是 :not(.active)，但代码里从没给任何元素加过 .active，
 * 于是选中的按钮 hover 时也会亮一层高光。改用 ToggleGroupItem 自带的
 * data-state 后这个老 bug 自然消失。
 */
.mode-switch :deep(.mode-btn[data-state='off']:hover::after) {
  opacity: 1;
}

/* 移动端优化 */
@media (max-width: 640px) {
  .search-input-wrapper {
    /* 确保触摸目标足够大 */
    min-height: 56px;
  }

  .mode-switch {
    width: 100%;
    max-width: 280px;
  }

  /* 两个按钮必须等宽，否则指示器的 50% 数学不成立 */
  .mode-switch :deep(.mode-btn) {
    flex: 1;
  }
}

/* 减少动效模式 */
@media (prefers-reduced-motion: reduce) {
  .search-input-wrapper::after {
    transition: none;
  }

  .mode-indicator {
    transition-duration: 0.1s;
  }
}
</style>
