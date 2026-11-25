import { afterEach, describe, expect, it, vi } from 'vitest'
import { onRequest } from '../../functions/api/translate'

afterEach(() => vi.unstubAllGlobals())

function request(body: unknown, origin = 'https://searchgal.example') {
  return new Request('https://searchgal.example/api/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin },
    body: JSON.stringify(body),
  })
}

describe('站点翻译接口', () => {
  it('固定调用 ChooseC 和 deepseek-flash，只向浏览器返回译文', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(Response.json({
      model: 'deepseek-flash',
      choices: [{ message: { content: ' 你好 ' } }],
    }))
    vi.stubGlobal('fetch', fetchMock)

    const response = await onRequest({
      request: request({ mode: 'description', text: 'Hello', model: 'other', messages: [] }),
      env: { CHOOSEC_API_KEY: 'test-secret' },
    })
    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(await response.json()).toEqual({ translation: '你好' })
    const [url, config] = fetchMock.mock.calls[0] ?? []
    expect(url).toBe('https://api.choosec.cn/v1/chat/completions')
    expect(config?.redirect).toBe('manual')
    expect(new Headers(config?.headers).get('Authorization')).toBe('Bearer test-secret')
    expect(JSON.parse(String(config?.body))).toMatchObject({
      model: 'deepseek-flash',
      messages: [{ role: 'system' }, { role: 'user', content: 'Hello' }],
      stream: false,
    })
  })

  it('拒绝上游跳转，密钥只用于固定的 ChooseC 地址', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(Response.redirect('https://other.example/'))
    vi.stubGlobal('fetch', fetchMock)
    const response = await onRequest({
      request: request({ mode: 'description', text: 'Hello' }),
      env: { CHOOSEC_API_KEY: 'test-secret' },
    })
    expect(response.status).toBe(502)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('拒绝跨站、未知模式和缺失密钥，且不发送上游请求', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const valid = { mode: 'description', text: 'Hello' }

    expect((await onRequest({ request: request(valid, 'https://other.example'), env: {} })).status).toBe(403)
    expect((await onRequest({ request: request({ ...valid, mode: 'constructor' }), env: {} })).status).toBe(400)
    expect((await onRequest({ request: request(valid), env: {} })).status).toBe(503)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
