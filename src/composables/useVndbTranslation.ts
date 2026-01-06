/**
 * VNDB 翻译管理 composable
 * 处理 VNDB 面板中的 AI 翻译功能
 */

import { ref, computed } from 'vue'
import { translateAllContent } from '@/api/translate'
import { playCelebration, playCaution, playTap, playToggleOn, playToggleOff } from '@/composables/useSound'
import type { VndbInfo, VndbQuote } from '@/types/vndb'

export function useVndbTranslation() {
  // 描述翻译状态
  const isTranslating = ref(false)
  const translatedDescription = ref<string | null>(null)
  const showOriginal = ref(false)
  const translateError = ref(false)

  // 标签翻译状态
  const isTranslatingTags = ref(false)
  const translatedTags = ref<Map<string, string>>(new Map())
  const showOriginalTags = ref(false)
  const translateTagsError = ref(false)

  // 名言翻译状态
  const isTranslatingQuotes = ref(false)
  const translatedQuotes = ref<Map<string, string>>(new Map())
  const showOriginalQuotes = ref(false)
  const translateQuotesError = ref(false)

  // 一键翻译状态
  const isTranslatingAllRef = ref(false)

  // 计算属性
  const isTranslatingAll = computed(() => 
    isTranslatingAllRef.value || isTranslating.value || isTranslatingTags.value || isTranslatingQuotes.value,
  )

  const hasAnyTranslation = computed(() => 
    translatedDescription.value || translatedTags.value.size > 0 || translatedQuotes.value.size > 0,
  )

  // 重置所有翻译状态
  function resetTranslation() {
    translatedDescription.value = null
    showOriginal.value = false
    isTranslating.value = false
    translateError.value = false

    translatedTags.value = new Map()
    showOriginalTags.value = false
    isTranslatingTags.value = false
    translateTagsError.value = false

    translatedQuotes.value = new Map()
    showOriginalQuotes.value = false
    isTranslatingQuotes.value = false
    translateQuotesError.value = false

    isTranslatingAllRef.value = false
  }

  // 一键翻译（内部实现）
  async function translateAllInternal(
    vndbInfo: VndbInfo | null,
    quotes: VndbQuote[],
    currentVnId: string | null,
    silent = false,
  ): Promise<boolean> {
    if (isTranslatingAll.value) {
      return false
    }
    
    if (!silent) {
      playTap()
    }
    
    isTranslatingAllRef.value = true
    const vnIdAtStart = currentVnId
    
    try {
      // 收集需要翻译的内容
      const descText = (!translatedDescription.value && vndbInfo?.description) 
        ? vndbInfo.description 
        : null
      
      const tagNames = (translatedTags.value.size === 0 && vndbInfo?.tags?.length) 
        ? vndbInfo.tags.map(t => t.name)
        : null
      
      const quoteTexts = (translatedQuotes.value.size === 0 && quotes.length > 0)
        ? quotes.map(q => q.quote)
        : null
      
      // 如果没有任何需要翻译的内容
      if (!descText && !tagNames && !quoteTexts) {
        isTranslatingAllRef.value = false
        return false
      }
      
      // 单次 API 请求翻译所有内容
      const result = await translateAllContent(descText, tagNames, quoteTexts)
      
      // 检查是否仍是同一个游戏
      if (currentVnId !== vnIdAtStart) {
        isTranslatingAllRef.value = false
        return false
      }
      
      // 应用翻译结果
      let hasSuccess = false
      
      if (result.description && descText) {
        translatedDescription.value = result.description
        showOriginal.value = false
        hasSuccess = true
      }
      
      if (result.tags && tagNames) {
        const newMap = new Map<string, string>()
        tagNames.forEach((original, index) => {
          if (result.tags?.[index]) {
            newMap.set(original, result.tags[index])
          }
        })
        if (newMap.size > 0) {
          translatedTags.value = newMap
          showOriginalTags.value = false
          hasSuccess = true
        }
      }
      
      if (result.quotes && quoteTexts) {
        const newMap = new Map<string, string>()
        quoteTexts.forEach((original, index) => {
          if (result.quotes?.[index]) {
            newMap.set(original, result.quotes[index])
          }
        })
        if (newMap.size > 0) {
          translatedQuotes.value = newMap
          showOriginalQuotes.value = false
          hasSuccess = true
        }
      }
      
      if (!silent && hasSuccess) {
        playCelebration()
      } else if (!silent && !hasSuccess) {
        translateError.value = true
        playCaution()
      }
      
      isTranslatingAllRef.value = false
      return hasSuccess
    } catch {
      if (!silent) {
        translateError.value = true
        playCaution()
      }
      isTranslatingAllRef.value = false
      return false
    }
  }

  // 一键翻译（用户点击）
  async function handleTranslateAll(
    vndbInfo: VndbInfo | null,
    quotes: VndbQuote[],
    currentVnId: string | null,
  ) {
    return translateAllInternal(vndbInfo, quotes, currentVnId, false)
  }

  // 一键翻译（静默模式）
  async function handleTranslateAllSilent(
    vndbInfo: VndbInfo | null,
    quotes: VndbQuote[],
    currentVnId: string | null,
  ) {
    return translateAllInternal(vndbInfo, quotes, currentVnId, true)
  }

  // 切换所有翻译的显示状态
  function toggleAllTranslations() {
    const newState = !showOriginal.value
    if (newState) {
      playToggleOff()
    } else {
      playToggleOn()
    }
    showOriginal.value = newState
    showOriginalTags.value = newState
    showOriginalQuotes.value = newState
  }

  // 获取标签显示名称
  function getTagDisplayName(tagName: string): string {
    if (showOriginalTags.value || translatedTags.value.size === 0) {
      return tagName
    }
    return translatedTags.value.get(tagName) || tagName
  }

  // 获取名言显示文本
  function getQuoteDisplayText(quote: string): string {
    if (showOriginalQuotes.value || translatedQuotes.value.size === 0) {
      return quote
    }
    return translatedQuotes.value.get(quote) || quote
  }

  return {
    // 状态
    isTranslating,
    translatedDescription,
    showOriginal,
    translateError,
    isTranslatingTags,
    translatedTags,
    showOriginalTags,
    translateTagsError,
    isTranslatingQuotes,
    translatedQuotes,
    showOriginalQuotes,
    translateQuotesError,
    
    // 计算属性
    isTranslatingAll,
    hasAnyTranslation,
    
    // 方法
    resetTranslation,
    handleTranslateAll,
    handleTranslateAllSilent,
    toggleAllTranslations,
    getTagDisplayName,
    getQuoteDisplayText,
  }
}

