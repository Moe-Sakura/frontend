/**
 * AI 翻译 API
 * 处理 VNDB 内容的 AI 翻译功能
 */

import { getAiTranslateApiUrl, getAiTranslateApiKey, getAiTranslateModel } from './config'
import type { TranslateMode, TranslateAllResult } from '@/types/vndb'

// 重新导出类型
export type { TranslateMode, TranslateAllResult }

// ============================================
// 翻译提示词
// ============================================

const DESCRIPTION_PROMPT = `你是一名专业的视觉小说（Galgame/AVG）本地化专家。请将游戏简介精准翻译为简体中文。

【翻译规范】
1. 结构保留：保持原文段落划分，段落间用换行分隔
2. 术语处理：使用视觉小说领域通用的中文术语
3. 人名处理：优先使用中文圈广泛接受的译名，无通用译名时保留原名
4. 内容控制：禁止添加剧透、解释性文字或主观评价

【输出要求】
仅输出翻译后的纯文本，无需任何说明`

const TAGS_PROMPT = `你是一名视觉小说（Galgame/AVG）专家，精通 VNDB 标签体系。请将以下游戏标签翻译为简体中文。

【输入格式】
每行一个英文标签

【翻译规范】
1. 使用 VNDB 中文社区或 Bangumi 等平台的通用译法
2. 游戏机制类标签直译（如 Multiple Endings → 多结局）
3. 角色属性类标签使用二次元圈常用说法（如 Tsundere → 傲娇）
4. 无通用译法的专有名词可保留英文或音译
5. 保持简洁，每个标签译文不超过 10 个字

【输出要求】
每行输出一个翻译结果，与输入行数严格一一对应
仅输出译文，无需编号、原文或解释`

const QUOTES_PROMPT = `你是一名专业的视觉小说（Galgame/AVG）本地化专家。请将游戏中的经典台词/名言翻译为简体中文。

【输入格式】
每行一条英文/日文台词

【翻译规范】
1. 保留原文的情感色彩和语气特点
2. 台词中的人名保留原文或使用通用译名
3. 注意口语化表达，符合角色说话习惯
4. 保持原文的文学性和感染力
5. 不要添加引号或其他标点修饰

【输出要求】
每行输出一条翻译结果，与输入行数严格一一对应
仅输出译文，无需编号、原文或解释`

const COMBINED_PROMPT = `你是一名专业的视觉小说（Galgame/AVG）本地化专家。请将以下内容翻译为简体中文。

输入格式使用 ===SECTION=== 分隔三个部分：
1. 游戏简介
2. 游戏标签（每行一个）
3. 经典台词（每行一条）

【翻译规范】
- 简介：清除HTML标记，保持段落结构，使用通用中文术语
- 标签：使用二次元圈常用说法，保持简洁
- 台词：保留情感色彩和语气，注意口语化

【输出格式】
严格按照输入的相同格式输出，使用 ===SECTION=== 分隔三部分：
翻译后的简介
===SECTION===
翻译后的标签（每行一个，与输入行数对应）
===SECTION===
翻译后的台词（每行一条，与输入行数对应）

注意：输出不要以 ===SECTION=== 开头，直接输出翻译内容。仅输出翻译结果，无需任何说明。`

// ============================================
// 翻译函数
// ============================================

/**
 * AI 翻译文本
 * @param text - 要翻译的文本
 * @param mode - 翻译模式：description（简介）、tags（标签）或 quotes（名言）
 * @param maxRetries - 最大重试次数
 * @returns 翻译后的文本，失败返回 null
 */
export async function translateText(
  text: string, 
  mode: TranslateMode = 'description',
  maxRetries = 2,
): Promise<string | null> {
  if (!text || text.trim().length === 0) {
    return null
  }

  const modeConfig = {
    description: { prompt: DESCRIPTION_PROMPT, maxLength: 3000, maxTokens: 2000, temperature: 0.1 },
    tags: { prompt: TAGS_PROMPT, maxLength: 1500, maxTokens: 1000, temperature: 0.05 },
    quotes: { prompt: QUOTES_PROMPT, maxLength: 2000, maxTokens: 1500, temperature: 0.2 },
  }
  
  const config = modeConfig[mode]
  const textToTranslate = text.length > config.maxLength 
    ? text.substring(0, config.maxLength) + '...' 
    : text

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(getAiTranslateApiUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAiTranslateApiKey()}`,
        },
        body: JSON.stringify({
          model: getAiTranslateModel(),
          messages: [
            { role: 'system', content: config.prompt },
            { role: 'user', content: textToTranslate },
          ],
          temperature: config.temperature,
          max_tokens: config.maxTokens,
          top_p: 0.9,
          top_k: 50,
          repetition_penalty: 1.05,
          stream: false,
        }),
      })

      if (!response.ok) {
        if (attempt === maxRetries) {
          return null
        }
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)))
        continue
      }

      const data = await response.json()
      const translatedText = data.choices?.[0]?.message?.content?.trim()
      
      if (translatedText && translatedText.length > 0) {
        return translatedText
      }

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)))
        continue
      }

      return null
    } catch {
      if (attempt === maxRetries) {
        return null
      }
      await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)))
    }
  }

  return null
}

/**
 * 合并翻译：一次 API 请求翻译描述、标签和名言
 */
export async function translateAllContent(
  description: string | null,
  tags: string[] | null,
  quotes: string[] | null,
  maxRetries = 2,
): Promise<TranslateAllResult> {
  const result: TranslateAllResult = {
    description: null,
    tags: null,
    quotes: null,
  }

  const descText = description?.trim() || ''
  const tagsText = tags?.join('\n') || ''
  const quotesText = quotes?.join('\n') || ''

  if (!descText && !tagsText && !quotesText) {
    return result
  }

  const inputText = [descText, tagsText, quotesText].join('\n===SECTION===\n')
  const maxLength = 6000
  const textToTranslate = inputText.length > maxLength 
    ? inputText.substring(0, maxLength) + '...' 
    : inputText

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(getAiTranslateApiUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAiTranslateApiKey()}`,
        },
        body: JSON.stringify({
          model: getAiTranslateModel(),
          messages: [
            { role: 'system', content: COMBINED_PROMPT },
            { role: 'user', content: textToTranslate },
          ],
          temperature: 0.15,
          max_tokens: 4000,
          top_p: 0.9,
          top_k: 50,
          repetition_penalty: 1.05,
          stream: false,
        }),
      })

      if (!response.ok) {
        if (attempt === maxRetries) {
          return result
        }
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)))
        continue
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content?.trim()

      if (content) {
        let parts = content.split(/===SECTION===/).map((s: string) => s.trim())
        
        if (parts[0] === '') {
          parts = parts.slice(1)
        }
        
        if (parts[0] && descText) {
          result.description = parts[0]
        }
        if (parts[1] && tagsText) {
          const parsedTags = parts[1].split('\n').map((s: string) => s.trim()).filter((s: string) => s)
          result.tags = parsedTags.length > 0 ? parsedTags : null
        }
        if (parts[2] && quotesText) {
          const parsedQuotes = parts[2].split('\n').map((s: string) => s.trim()).filter((s: string) => s)
          result.quotes = parsedQuotes.length > 0 ? parsedQuotes : null
        }
        
        return result
      }

      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)))
        continue
      }

      return result
    } catch {
      if (attempt === maxRetries) {
        return result
      }
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)))
    }
  }

  return result
}

