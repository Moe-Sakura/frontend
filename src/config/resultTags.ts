/**
 * 搜索结果标签（渠道 / 获取方式）
 *
 * 标签 key 由后端 SSE 的 `result.tags` 返回，见 https://github.com/Moe-Sakura/SearchGal
 * 同一站点的所有条目共用一组标签，因此筛选实际是按「站点」过滤。
 *
 * 这里是标签的唯一事实来源：结果卡片上的徽标与筛选栏的 chip 都从此处取
 * 文案、图标和配色，新增标签只需在 RESULT_TAGS 里加一项。
 */

import type { Component } from 'vue'
import {
  CheckCircle,
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
} from '@lucide/vue'

/** channel = 资源存放渠道；method = 获取资源所需的操作 */
export type ResultTagGroup = 'channel' | 'method'

export interface ResultTagMeta {
  /** 后端返回的原始 key */
  key: string
  /** 展示文案 */
  label: string
  group: ResultTagGroup
  icon: Component
  /** 结果卡片徽标的配色（Tailwind 类） */
  chipClass: string
}

export const RESULT_TAGS: readonly ResultTagMeta[] = [
  // ========== 渠道 ==========
  {
    key: 'SuDrive',
    label: '自建盘',
    group: 'channel',
    icon: Server,
    chipClass: 'bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300 border-pink-400 dark:border-pink-600',
  },
  {
    key: 'NoSplDrive',
    label: '不限速盘',
    group: 'channel',
    icon: Rocket,
    chipClass: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-400 dark:border-emerald-600',
  },
  {
    key: 'BTmag',
    label: 'BT/磁力',
    group: 'channel',
    icon: Magnet,
    chipClass: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 border-violet-400 dark:border-violet-600',
  },
  {
    key: 'MixDrive',
    label: '混合盘',
    group: 'channel',
    icon: Layers,
    chipClass: 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 border-cyan-400 dark:border-cyan-600',
  },
  {
    key: 'SplDrive',
    label: '限速盘',
    group: 'channel',
    icon: Turtle,
    chipClass: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border-orange-400 dark:border-orange-600',
  },

  // ========== 获取方式 ==========
  {
    key: 'NoReq',
    label: '直接下载',
    group: 'method',
    icon: CheckCircle,
    chipClass: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-400 dark:border-green-600',
  },
  {
    key: 'Login',
    label: '需登录',
    group: 'method',
    icon: User,
    chipClass: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-400 dark:border-blue-600',
  },
  {
    key: 'Rep',
    label: '需留言',
    group: 'method',
    icon: Reply,
    chipClass: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border-indigo-400 dark:border-indigo-600',
  },
  {
    key: 'LoginRep',
    label: '登录+留言',
    group: 'method',
    icon: MessageCircle,
    chipClass: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-purple-400 dark:border-purple-600',
  },
  {
    key: 'magic',
    label: '需魔法',
    group: 'method',
    icon: Wand2,
    chipClass: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-400 dark:border-red-600',
  },
  {
    key: 'LoginPay',
    label: '需积分',
    group: 'method',
    icon: Coins,
    chipClass: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 border-yellow-400 dark:border-yellow-600',
  },
] as const

/** 未知标签的兜底配色 */
const FALLBACK_CHIP_CLASS =
  'bg-gray-100 dark:bg-gray-800/40 text-gray-600 dark:text-gray-400 border-gray-400 dark:border-gray-600'

const TAG_MAP = new Map(RESULT_TAGS.map(tag => [tag.key, tag]))

export const CHANNEL_TAGS = RESULT_TAGS.filter(t => t.group === 'channel')
export const METHOD_TAGS = RESULT_TAGS.filter(t => t.group === 'method')

export function getResultTag(key: string): ResultTagMeta | undefined {
  return TAG_MAP.get(key)
}

/** 后端可能返回未收录的标签，此时原样展示 key */
export function getResultTagLabel(key: string): string {
  return TAG_MAP.get(key)?.label ?? key
}

export function getResultTagIcon(key: string): Component {
  return TAG_MAP.get(key)?.icon ?? TagIcon
}

export function getResultTagChipClass(key: string): string {
  return TAG_MAP.get(key)?.chipClass ?? FALLBACK_CHIP_CLASS
}
