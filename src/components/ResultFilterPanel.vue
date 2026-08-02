<script setup lang="ts">
import { computed } from 'vue'
import { useSearchStore } from '@/stores/search'
import { CHANNEL_TAGS, METHOD_TAGS, type ResultTagMeta } from '@/config/resultTags'
import { playTap, playSelect } from '@/composables/useSound'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

const searchStore = useSearchStore()

/** ToggleGroup 的值不能是空串，用一个哨兵值代表「不筛选」 */
const ALL = '__all__'

/**
 * 只保留当前结果里真实出现过的标签
 * 否则每次搜索都会渲染一整排点了必定空结果的 chip
 */
function usableTags(tags: readonly ResultTagMeta[]) {
  return computed(() => tags.filter(tag => searchStore.availableTags.has(tag.key)))
}

const channelTags = usableTags(CHANNEL_TAGS)
const methodTags = usableTags(METHOD_TAGS)

interface FilterRow {
  key: 'channel' | 'method'
  /** 「不筛选」那颗 chip 的文案 */
  allLabel: string
  tags: ResultTagMeta[]
  /** 当前选中的标签 key，空串表示不筛选 */
  value: string
  apply: (tag: string) => void
}

/**
 * 两行筛选（渠道 / 获取方式）结构完全一致，合并成一张表渲染。
 * 某一维度只有一个可选值时不显示 —— 点了等于没筛。
 */
const rows = computed<FilterRow[]>(() => {
  const all: FilterRow[] = [
    {
      key: 'channel',
      allLabel: '全部渠道',
      tags: channelTags.value,
      value: searchStore.channelFilter,
      apply: tag => searchStore.setChannelFilter(tag),
    },
    {
      key: 'method',
      allLabel: '全部方式',
      tags: methodTags.value,
      value: searchStore.methodFilter,
      apply: tag => searchStore.setMethodFilter(tag),
    },
  ]
  return all.filter(row => row.tags.length > 1)
})

const showPanel = computed(() => rows.value.length > 0)

function onSelect(row: FilterRow, next: unknown) {
  // 再次点击已选中项时 Reka 会给出 undefined / null，等同于取消筛选
  const value = typeof next === 'string' ? next : ALL

  if (value === ALL) {
    if (!row.value) { return }   // 本来就没筛，不必发声
    playTap()
    row.apply('')
    return
  }

  playSelect()
  row.apply(value)
}
</script>

<template>
  <div
    v-if="showPanel"
    class="result-filter-panel glassmorphism-card rounded-none px-3 py-3 sm:rounded-xl sm:px-4"
  >
    <div class="space-y-2.5">
      <ToggleGroup
        v-for="row in rows"
        :key="row.key"
        type="single"
        variant="outline"
        :model-value="row.value || ALL"
        class="flex w-full flex-wrap items-center justify-start gap-2"
        @update:model-value="next => onSelect(row, next)"
      >
        <ToggleGroupItem :value="ALL" class="filter-chip">
          {{ row.allLabel }}
        </ToggleGroupItem>
        <ToggleGroupItem
          v-for="tag in row.tags"
          :key="tag.key"
          :value="tag.key"
          class="filter-chip"
        >
          <component :is="tag.icon" :size="12" />
          <span>{{ tag.label }}</span>
        </ToggleGroupItem>
      </ToggleGroup>

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

/*
 * 选中态由 ToggleGroupItem 的 data-state 决定（on / off），不再靠模板里
 * 手动切换 filter-chip-selected / filter-chip-idle 两个类。
 * 这些声明要盖过 Toggle 自带的 variant 样式，所以带上属性选择器提权。
 */
.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  height: auto;
  min-width: 0;
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

.filter-chip[data-state='off'] {
  background: rgba(var(--color-bg-light, 255, 255, 255), 0.6);
  border-color: rgba(var(--brand-primary, 255, 20, 147), var(--opacity-border, 0.15));
  color: rgb(var(--text-secondary, 107, 114, 128));
}

.filter-chip[data-state='off']:hover {
  background: rgba(var(--brand-primary, 255, 20, 147), 0.08);
  border-color: rgba(var(--brand-primary, 255, 20, 147), var(--opacity-border-hover, 0.25));
  color: rgb(var(--brand-primary-dark, 199, 21, 133));
}

.filter-chip[data-state='on'] {
  background: rgb(var(--brand-primary, 255, 20, 147));
  border-color: rgb(var(--brand-primary, 255, 20, 147));
  color: #fff;
  box-shadow: 0 2px 8px rgba(var(--brand-primary, 255, 20, 147), 0.3);
}

.dark .filter-chip[data-state='off'] {
  background: rgba(var(--color-bg-dark, 30, 41, 59), 0.6);
  border-color: rgba(var(--brand-primary-light, 255, 105, 180), var(--opacity-border-dark, 0.2));
  color: rgb(var(--text-secondary, 148, 163, 184));
}

.dark .filter-chip[data-state='off']:hover {
  background: rgba(var(--brand-primary-light, 255, 105, 180), 0.12);
  color: rgb(var(--brand-primary-light, 255, 105, 180));
}
</style>
