<script setup lang="ts">
import { computed } from 'vue'
import { useSearchStore } from '@/stores/search'
import { CHANNEL_TAGS, METHOD_TAGS, type ResultTagMeta } from '@/config/resultTags'
import { playTap, playSelect } from '@/composables/useSound'

const searchStore = useSearchStore()

/**
 * 只保留当前结果里真实出现过的标签
 * 否则每次搜索都会渲染一整排点了必定空结果的 chip
 */
function usableTags(tags: readonly ResultTagMeta[]) {
  return computed(() => tags.filter(tag => searchStore.availableTags.has(tag.key)))
}

const channelTags = usableTags(CHANNEL_TAGS)
const methodTags = usableTags(METHOD_TAGS)

// 某一维度只有一个可选值时，筛选它没有意义（点了等于没筛）
const showChannelRow = computed(() => channelTags.value.length > 1)
const showMethodRow = computed(() => methodTags.value.length > 1)
const showPanel = computed(() => showChannelRow.value || showMethodRow.value)

function selectChannel(tag: string) {
  playSelect()
  searchStore.setChannelFilter(tag)
}

function selectMethod(tag: string) {
  playSelect()
  searchStore.setMethodFilter(tag)
}

function resetChannel() {
  if (!searchStore.channelFilter) {return}
  playTap()
  searchStore.channelFilter = ''
}

function resetMethod() {
  if (!searchStore.methodFilter) {return}
  playTap()
  searchStore.methodFilter = ''
}
</script>

<template>
  <div
    v-if="showPanel"
    class="result-filter-panel glassmorphism-card rounded-none px-3 py-3 sm:rounded-xl sm:px-4"
  >
    <div class="space-y-2.5">
      <!-- 渠道 -->
      <div v-if="showChannelRow" class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="filter-chip"
          :class="searchStore.channelFilter ? 'filter-chip-idle' : 'filter-chip-selected'"
          :aria-pressed="!searchStore.channelFilter"
          @click="resetChannel"
        >
          全部渠道
        </button>
        <button
          v-for="tag in channelTags"
          :key="tag.key"
          type="button"
          class="filter-chip"
          :class="searchStore.channelFilter === tag.key ? 'filter-chip-selected' : 'filter-chip-idle'"
          :aria-pressed="searchStore.channelFilter === tag.key"
          @click="selectChannel(tag.key)"
        >
          <component :is="tag.icon" :size="12" />
          <span>{{ tag.label }}</span>
        </button>
      </div>

      <!-- 获取方式 -->
      <div v-if="showMethodRow" class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="filter-chip"
          :class="searchStore.methodFilter ? 'filter-chip-idle' : 'filter-chip-selected'"
          :aria-pressed="!searchStore.methodFilter"
          @click="resetMethod"
        >
          全部方式
        </button>
        <button
          v-for="tag in methodTags"
          :key="tag.key"
          type="button"
          class="filter-chip"
          :class="searchStore.methodFilter === tag.key ? 'filter-chip-selected' : 'filter-chip-idle'"
          :aria-pressed="searchStore.methodFilter === tag.key"
          @click="selectMethod(tag.key)"
        >
          <component :is="tag.icon" :size="12" />
          <span>{{ tag.label }}</span>
        </button>
      </div>

      <!-- 筛选结果为空时的提示（否则用户只会看到一片空白） -->
      <p
        v-if="searchStore.isFiltering && searchStore.filteredPlatformCount === 0"
        class="pt-1 text-xs text-gray-500 dark:text-slate-400"
      >
        没有同时满足所选渠道与方式的站点，试试放宽条件。
      </p>
    </div>
  </div>
</template>

<style scoped>
.result-filter-panel {
  /* glassmorphism-card 自带 hover 位移，筛选栏常驻，跟着抬起会很晃 */
  transition: none;
}

.result-filter-panel:hover {
  transform: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.dark .result-filter-panel:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border-radius: var(--radius-sm, 0.5rem);
  border: var(--border-thin, 1px) solid transparent;
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.25;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s ease-out, border-color 0.2s ease-out,
              color 0.2s ease-out, transform 0.2s ease-out;
}

.filter-chip:active {
  transform: scale(0.95);
}

.filter-chip-idle {
  background: rgba(var(--color-bg-light, 255, 255, 255), 0.6);
  border-color: rgba(var(--brand-primary, 255, 20, 147), var(--opacity-border, 0.15));
  color: rgb(var(--text-secondary, 107, 114, 128));
}

.filter-chip-idle:hover {
  background: rgba(var(--brand-primary, 255, 20, 147), 0.08);
  border-color: rgba(var(--brand-primary, 255, 20, 147), var(--opacity-border-hover, 0.25));
  color: rgb(var(--brand-primary-dark, 199, 21, 133));
}

.filter-chip-selected {
  background: rgb(var(--brand-primary, 255, 20, 147));
  border-color: rgb(var(--brand-primary, 255, 20, 147));
  color: #fff;
  box-shadow: 0 2px 8px rgba(var(--brand-primary, 255, 20, 147), 0.3);
}

.dark .filter-chip-idle {
  background: rgba(var(--color-bg-dark, 30, 41, 59), 0.6);
  border-color: rgba(var(--brand-primary-light, 255, 105, 180), var(--opacity-border-dark, 0.2));
  color: rgb(var(--text-secondary, 148, 163, 184));
}

.dark .filter-chip-idle:hover {
  background: rgba(var(--brand-primary-light, 255, 105, 180), 0.12);
  color: rgb(var(--brand-primary-light, 255, 105, 180));
}
</style>
