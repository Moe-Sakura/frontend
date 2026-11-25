import type { TranslateMode } from '../types/vndb'

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

const MODE_CONFIG = {
  description: { prompt: DESCRIPTION_PROMPT, maxLength: 3000, maxTokens: 2000, temperature: 0.1 },
  tags: { prompt: TAGS_PROMPT, maxLength: 1500, maxTokens: 1000, temperature: 0.05 },
  quotes: { prompt: QUOTES_PROMPT, maxLength: 2000, maxTokens: 1500, temperature: 0.2 },
  combined: { prompt: COMBINED_PROMPT, maxLength: 6000, maxTokens: 4000, temperature: 0.15 },
} satisfies Record<TranslateMode | 'combined', {
  prompt: string
  maxLength: number
  maxTokens: number
  temperature: number
}>

export const MANAGED_TRANSLATION_PATH = '/api/translate'
export type TranslationRequestMode = keyof typeof MODE_CONFIG

export function isTranslationRequestMode(value: unknown): value is TranslationRequestMode {
  return typeof value === 'string' && Object.keys(MODE_CONFIG).includes(value)
}

export function buildTranslationRequest(mode: TranslationRequestMode, text: string, model: string) {
  const { prompt, maxLength, maxTokens, temperature } = MODE_CONFIG[mode]
  return {
    model,
    messages: [
      { role: 'system', content: prompt },
      { role: 'user', content: text.length > maxLength ? text.slice(0, maxLength) + '...' : text },
    ],
    temperature,
    max_tokens: maxTokens,
    top_p: 0.9,
    stream: false,
  }
}

export function readTranslationReply(data: unknown): string | null {
  const reply = data as { choices?: { message?: { content?: unknown } }[] } | null
  const content = reply?.choices?.[0]?.message?.content
  return typeof content === 'string' ? content.trim() || null : null
}
