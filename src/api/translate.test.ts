import { afterEach, expect, it, vi } from 'vitest'
import { translateAllContent } from './translate'

afterEach(() => vi.unstubAllGlobals())

it('默认走站内接口，简介为空时也能对应标签和台词', async () => {
  const mock = vi.fn<typeof fetch>().mockResolvedValue(Response.json({
    translation: '===SECTION===\n多结局\n===SECTION===\n你好',
  }))
  vi.stubGlobal('fetch', mock)

  expect(await translateAllContent(null, ['Multiple Endings'], ['Hello'])).toEqual({
    description: null, tags: ['多结局'], quotes: ['你好'],
  })
  const [url, request] = mock.mock.calls[0] ?? []
  expect(url).toBe('/api/translate')
  expect(new Headers(request?.headers).has('Authorization')).toBe(false)
  expect(JSON.parse(String(request?.body))).toMatchObject({ mode: 'combined' })
})
