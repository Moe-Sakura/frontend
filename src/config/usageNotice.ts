/**
 * 首页「使用须知」的文案数据
 *
 * 原先是硬编码在 SearchHeader.vue 模板里的 115 行（占模板 30%），零 state、
 * 零事件。挪到这里之后改文案不用再动组件，模板只剩两个 v-for。
 *
 * 关于 `html` 字段：这些段落里的 <strong> / <a> 是排版的一部分，拆成
 * 结构化片段反而更难维护。字段值全部是本文件里的编译期常量，不接受任何
 * 运行时输入，所以模板里用 v-html 渲染是安全的 —— 但**不要**把用户输入
 * 或接口返回拼进来。
 *
 * 配色一律走 theme-* / 语义色工具类，不写死十六进制，用户换主题色时跟随。
 */

import type { Component } from 'vue'
import {
  Star,
  AlertTriangle,
  Heart,
  Search,
  Lightbulb,
  ShieldAlert,
  ShieldCheck,
  Wrench,
  BookOpen,
} from '@lucide/vue'

/** 强调卡片（顶部提示 + 底部「支持我们」共用同一套结构） */
export interface UsageCallout {
  key: string
  icon: Component
  /** 卡片外壳的渐变与描边 */
  cardClass: string
  /** 图标圆底的配色 */
  iconWrapClass: string
  /** 正文配色 */
  textClass: string
  /** 正文，含排版用的行内标签，详见文件头 */
  html: string
}

/** 说明列表的单条 */
export interface UsageTip {
  key: string
  icon: Component
  /** 仅配色，尺寸与对齐由模板统一给 */
  iconClass: string
  html: string
}

const THEME_CARD_CLASS =
  'bg-gradient-to-r from-theme-primary/5 to-rose-50 dark:from-theme-primary-darker/30 dark:to-rose-950/30 border border-theme-primary/20 dark:border-theme-primary-darker/30'
const THEME_ICON_WRAP_CLASS = 'bg-gradient-to-br from-theme-primary to-theme-accent'
const THEME_TEXT_CLASS = 'text-theme-primary-darker dark:text-theme-primary-lighter'

/** 说明列表**之前**的提示卡 */
export const USAGE_CALLOUTS: readonly UsageCallout[] = [
  {
    key: 'domain',
    icon: Star,
    cardClass: THEME_CARD_CLASS,
    iconWrapClass: THEME_ICON_WRAP_CLASS,
    textClass: THEME_TEXT_CLASS,
    html: '本站已更换新域名 <a href="https://www.searchgal.top" class="font-bold text-theme-primary dark:text-theme-primary-light hover:underline">searchgal.top</a>，请更新书签！',
  },
  {
    key: 'api-backend',
    icon: AlertTriangle,
    cardClass:
      'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200/50 dark:border-amber-800/30',
    iconWrapClass: 'bg-amber-500',
    textClass: 'text-amber-800 dark:text-amber-200',
    html: '如搜索异常请进右上角的<strong class="font-semibold">设置</strong>里尝试切换聚搜 API 后端试试！',
  },
] as const

/** 说明列表**之后**的卡片，目前只有「支持我们」 */
export const USAGE_FOOTER_CALLOUTS: readonly UsageCallout[] = [
  {
    key: 'support',
    icon: Star,
    cardClass:
      'bg-gradient-to-r from-theme-primary/5 to-purple-50 dark:from-theme-primary-darker/30 dark:to-purple-950/30 border border-theme-primary/20 dark:border-theme-primary-darker/30',
    iconWrapClass: THEME_ICON_WRAP_CLASS,
    textClass: THEME_TEXT_CLASS,
    html: '如觉得本站好用，请移步 <a href="https://github.com/Moe-Sakura" target="_blank" rel="noopener noreferrer" class="font-semibold hover:underline">GitHub</a> 给本项目点个免费的 <strong class="font-semibold">Star</strong> 吧！你的支持就是咱最大的动力 💕',
  },
] as const

export const USAGE_TIPS: readonly UsageTip[] = [
  {
    key: 'love',
    icon: Heart,
    iconClass: 'text-theme-primary',
    html: '本程序纯属<strong class="text-theme-primary dark:text-theme-primary-light">用爱发电</strong>，仅供绅士们交流学习使用，务必请大家<strong class="text-theme-primary dark:text-theme-primary-light">支持正版 Galgame</strong>！让爱与梦想延续！',
  },
  {
    key: 'aggregator',
    icon: Search,
    iconClass: 'text-cyan-500',
    html: '本站只做互联网内容的<strong class="text-cyan-600 dark:text-cyan-400">聚合搬运工</strong>，搜索结果均来自第三方站点，下载前请自行判断<strong class="text-cyan-600 dark:text-cyan-400">资源安全性</strong>。',
  },
  {
    key: 'keyword',
    icon: Lightbulb,
    iconClass: 'text-yellow-500',
    html: '搜索时请注意关键词长度！<strong class="text-yellow-600 dark:text-yellow-400">太短</strong>可能搜不全，<strong class="text-yellow-600 dark:text-yellow-400">太长</strong>则可能无法精准匹配。',
  },
  {
    key: 'no-abuse',
    icon: ShieldAlert,
    iconClass: 'text-red-500',
    html: '每次查询完毕即断开连接，<strong class="text-red-600 dark:text-red-400">严禁爆破或恶意爬取</strong>，做个文明的绅士！',
  },
  {
    key: 'site-down',
    icon: Wrench,
    iconClass: 'text-slate-500',
    html: '万一某个站点挂了，先看看自己的魔法是否到位，也可能是站点维护了，或者咱的<strong class="text-slate-600 dark:text-slate-300">驱动失效</strong>了。',
  },
  {
    key: 'adblock',
    icon: ShieldCheck,
    iconClass: 'text-green-500',
    html: '为了支持各站点长久运营，请关闭<strong class="text-green-600 dark:text-green-400">广告屏蔽插件</strong>或将站点加入白名单。',
  },
  {
    key: 'vndb',
    icon: BookOpen,
    iconClass: 'text-indigo-500',
    html: '游戏介绍数据由 <a href="https://vndb.org/" target="_blank" rel="noopener noreferrer" class="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">VNDB</a> 提供，AI翻译仅供参考。',
  },
] as const
