import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { DEFAULT_API_CONFIG, useSettingsStore } from './settings'

const legacy = {
  aiTranslateApiUrl: 'https://ai.searchgal.top/v1/chat/completions',
  aiTranslateModel: 'Qwen/Qwen2.5-32B-Instruct',
}

function loadStoredSettings(key: string) {
  vi.stubGlobal('localStorage', {
    getItem: () => JSON.stringify({ ...legacy, aiTranslateApiKey: key, enableSound: false }),
    setItem: vi.fn(),
  })
  return useSettingsStore()
}

beforeEach(() => {
  setActivePinia(createPinia())
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it('保留使用旧地址及模型时自填的密钥', async () => {
  const store = loadStoredSettings('user-supplied-api-key')
  await store.waitForTranslationSettings()
  expect(store.settings).toMatchObject({ ...legacy, aiTranslateApiKey: 'user-supplied-api-key' })
})

it('只迁移指纹匹配的旧默认凭据，保留其他设置', async () => {
  const digest = Buffer.from('1f6f2bea47ce4bb6a11906d892e915414a35457afe0f2a57a887092d2a7aeb47', 'hex')
  vi.spyOn(globalThis.crypto.subtle, 'digest').mockResolvedValue(Uint8Array.from(digest).buffer)
  const store = loadStoredSettings('legacy-default-test-fixture')
  await store.waitForTranslationSettings()
  expect(store.settings).toMatchObject({
    aiTranslateApiUrl: DEFAULT_API_CONFIG.aiTranslateApiUrl,
    aiTranslateApiKey: '',
    aiTranslateModel: 'deepseek-flash',
    enableSound: false,
  })
  expect(store.settingsHistory[0]?.aiTranslateApiKey).toBe('')
})
