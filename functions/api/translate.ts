import { buildTranslationRequest, isTranslationRequestMode, readTranslationReply } from '../../src/api/translationRequest'

const UPSTREAM_URL = 'https://api.choosec.cn/v1/chat/completions'
const MODEL = 'deepseek-flash'
const MAX_BODY_BYTES = 48_000

interface TranslationContext {
  request: Request
  env: { CHOOSEC_API_KEY?: string }
}

function json(body: { translation: string } | { error: string }, status = 200, headers?: HeadersInit) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store', ...headers } })
}

export async function onRequest({ request, env }: TranslationContext): Promise<Response> {
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405, { Allow: 'POST' })

  const origin = request.headers.get('Origin')
  if (origin && origin !== new URL(request.url).origin) return json({ error: 'Forbidden' }, 403)
  if (request.headers.get('Content-Type')?.split(';', 1)[0]?.trim().toLowerCase() !== 'application/json') {
    return json({ error: 'Expected JSON' }, 415)
  }
  if (Number(request.headers.get('Content-Length')) > MAX_BODY_BYTES) {
    return json({ error: 'Request too large' }, 413)
  }

  const raw = await request.text().catch(() => '')
  if (raw.length > MAX_BODY_BYTES) return json({ error: 'Request too large' }, 413)
  let input: { mode?: unknown; text?: unknown } | null
  try {
    input = JSON.parse(raw)
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }
  if (!isTranslationRequestMode(input?.mode) || typeof input?.text !== 'string' || !input.text.trim()) {
    return json({ error: 'Invalid translation input' }, 400)
  }

  const key = env.CHOOSEC_API_KEY?.trim()
  if (!key) return json({ error: 'Translation unavailable' }, 503)
  try {
    const upstream = await fetch(UPSTREAM_URL, {
      method: 'POST',
      redirect: 'manual',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(buildTranslationRequest(input.mode, input.text, MODEL)),
      signal: AbortSignal.timeout(25_000),
    })
    if (upstream.status === 429) return json({ error: 'Translation rate limited' }, 429)
    if (!upstream.ok) return json({ error: 'Translation provider failed' }, 502)

    const translation = readTranslationReply(await upstream.json())
    return translation ? json({ translation }) : json({ error: 'Empty translation' }, 502)
  } catch {
    return json({ error: 'Translation provider unavailable' }, 502)
  }
}
