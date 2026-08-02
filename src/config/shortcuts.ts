/**
 * 全局键盘快捷键
 *
 * 这里是快捷键的唯一事实来源：KeyboardHelpPanel 的帮助面板从这里渲染。
 * 实际的按键分发在 composables/useKeyboardShortcuts.ts 的 switch 里，
 * 新增快捷键时两处都要改 —— 这里决定「用户看到什么」，那里决定「按下去做什么」。
 */

import type { Component } from 'vue'
import {
  X,
  Home,
  Settings,
  MessageSquare,
  BookOpen,
  History,
  Grid3x3,
  Search,
  HelpCircle,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Navigation,
  Command,
  Zap,
} from '@lucide/vue'

export interface Shortcut {
  /** 按键，直接展示在 kbd 里 */
  key: string
  /** 这个快捷键做什么 */
  label: string
  icon: Component
  /** 行内图标配色，用 Tailwind 类 */
  iconClass: string
}

export interface ShortcutGroup {
  label: string
  icon: Component
  items: Shortcut[]
}

export const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    label: '导航',
    icon: Navigation,
    items: [
      { key: 'Esc', label: '关闭当前面板', icon: X, iconClass: 'text-gray-400' },
      { key: 'H', label: '返回首页', icon: Home, iconClass: 'text-blue-400' },
      { key: ',', label: '打开/关闭设置', icon: Settings, iconClass: 'text-gray-400' },
      { key: 'C', label: '打开/关闭评论', icon: MessageSquare, iconClass: 'text-theme-primary-light' },
      { key: 'V', label: '打开/关闭作品介绍', icon: BookOpen, iconClass: 'text-purple-400' },
      { key: 'Y', label: '打开/关闭搜索历史', icon: History, iconClass: 'text-amber-400' },
      { key: 'N', label: '站点导航', icon: Grid3x3, iconClass: 'text-cyan-400' },
    ],
  },
  {
    label: '操作',
    icon: Zap,
    items: [
      { key: '/', label: '聚焦搜索框', icon: Search, iconClass: 'text-green-400' },
      { key: '?', label: '显示/隐藏快捷键帮助', icon: HelpCircle, iconClass: 'text-indigo-400' },
    ],
  },
  {
    label: '滚动',
    icon: Command,
    items: [
      { key: 'T', label: '回到顶部', icon: ArrowUp, iconClass: 'text-rose-400' },
      { key: '[', label: '上一个平台', icon: ChevronLeft, iconClass: 'text-orange-400' },
      { key: ']', label: '下一个平台', icon: ChevronRight, iconClass: 'text-orange-400' },
    ],
  },
]
