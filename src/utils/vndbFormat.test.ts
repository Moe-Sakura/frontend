import { describe, expect, it } from 'vitest'
import { formatDate, renderDescription } from './vndbFormat'

describe('VNDB 展示格式', () => {
  it('格式化有效日期并保留未知的日期格式', () => {
    expect(formatDate('2026-11-26T12:00:00')).toBe('2026年11月26日')
    expect(formatDate('2026年冬')).toBe('2026年冬')
    expect(formatDate('')).toBe('未知')
  })

  it('转义原始 HTML 并保留剧透标记和换行', () => {
    expect(renderDescription('<b>原文</b>\n[spoiler]剧透[/spoiler]'))
      .toBe('&lt;b&gt;原文&lt;/b&gt;<br><span class="spoiler-text">剧透</span>')
  })
})
