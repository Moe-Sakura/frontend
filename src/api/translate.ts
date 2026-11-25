/**
 * AI 翻译 API，支持站点默认翻译和用户自定义服务。
 */
import type { TranslateAllResult, TranslateMode } from '@/types/vndb'
import { getAiTranslateApiKey, getAiTranslateApiUrl, getAiTranslateModel, waitForTranslationSettings } from './config'
import {
  buildTranslationRequest,
  MANAGED_TRANSLATION_PATH,
  readTranslationReply,
  type TranslationRequestMode,
} from './translationRequest'

export type { TranslateMode, TranslateAllResult }

async function requestTranslation(
  text: string,
  mode: TranslationRequestMode,
  maxRetries: number,
): Promise<string | null> {
  await waitForTranslationSettings()
  const url = getAiTranslateApiUrl()
  const managed = url === MANAGED_TRANSLATION_PATH
  const key = managed ? '' : getAiTranslateApiKey()
  const headers = new Headers({ 'Content-Type': 'application/json' })
  if (key) headers.set('Authorization', `Bearer ${key}`)
  const body = JSON.stringify(managed
    ? { mode, text }
    : buildTranslationRequest(mode, text, getAiTranslateModel()))

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body,
        signal: AbortSignal.timeout(30_000),
      })
      if (response.ok) {
        const data = await response.json() as { translation?: unknown } | null
        const translation = managed
          ? (typeof data?.translation === 'string' ? data.translation.trim() : null)
          : readTranslationReply(data)
        if (translation) return translation
      } else if (response.status < 500 || managed) {
        return null
      }
    } catch {
      if (managed) return null
    }
    if (attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
    }
  }
  return null
}

export async function translateText(
  text: string,
  mode: TranslateMode = 'description',
  maxRetries = 2,
): Promise<string | null> {
  if (!text?.trim()) return null
  return requestTranslation(text, mode, maxRetries)
}

export async function translateAllContent(
  description: string | null,
  tags: string[] | null,
  quotes: string[] | null,
  maxRetries = 2,
): Promise<TranslateAllResult> {
  const result: TranslateAllResult = { description: null, tags: null, quotes: null }
  const descText = description?.trim().slice(0, 2800) || ''
  const tagsText = tags?.join('\n').slice(0, 1300) || ''
  const quotesText = quotes?.join('\n').slice(0, 1800) || ''
  if (!descText && !tagsText && !quotesText) return result

  const input = [descText, tagsText, quotesText].join('\n===SECTION===\n')
  const translation = await requestTranslation(input, 'combined', maxRetries)
  if (!translation) return result

  const parts = translation.split('===SECTION===').map(part => part.trim())
  if (parts.length === 4 && parts[0] === '') parts.shift()
  if (parts.length !== 3) return result

  const [translatedDescription, translatedTags, translatedQuotes] = parts
  if (descText && translatedDescription) result.description = translatedDescription
  if (tagsText && translatedTags) {
    result.tags = translatedTags.split('\n').map(line => line.trim()).filter(Boolean)
  }
  if (quotesText && translatedQuotes) {
    result.quotes = translatedQuotes.split('\n').map(line => line.trim()).filter(Boolean)
  }
  return result
}
