/**
 * 分流探活
 *
 * 节点从 api.json 下线后，用户本地仍会残留旧地址（localStorage 里的搜索状态、
 * 收藏或分享出去的 ?api= 链接）。与其维护一份「已下线」名单，不如启动时直接
 * 探一下选中的地址通不通，不通就回落到默认节点 —— 以后再下线任何节点都自动生效，
 * 也能顺带兜住用户自己填的那个已经失效的自定义 API。
 *
 * 用 no-cors：拿到的是 opaque 响应，读不到状态码，但网络层失败（域名注销、
 * 连接被拒、TLS 握手失败）会 reject —— 下线的节点正是这个表现。
 * 另一种情况是域名还在、源站挂了，CDN 会返回 5xx，这在 no-cors 下算「成功」，
 * 但边缘要等十几秒才吐出来，所以超时取一个远短于它、又高于正常节点的值，
 * 把这类故障一并归为不可用。
 */

import apiData from '@/data/api.json'

/**
 * 正常节点实测 0.5~3s（含 TLS 与 302 跳转）；源站挂掉时 CDN 要 ~20s 才吐出 5xx。
 * 取 8s：对正常节点留足余量，又能把源站故障归为不可用。
 * 失败会重试一次，所以最坏 16s 才回落 —— 这段时间在后台跑，不挡启动。
 */
const PROBE_TIMEOUT_MS = 8000

async function pingOnce(url: string, timeoutMs: number): Promise<boolean> {
  const controller = new AbortController()
  const timer = setTimeout(() => { controller.abort() }, timeoutMs)

  try {
    await fetch(url, {
      method: 'GET',
      mode: 'no-cors',
      cache: 'no-store',
      signal: controller.signal,
    })
    return true
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}

/**
 * 探测一个 API 地址是否可用。
 * 失败会再试一次，避免网络抖动把用户从自己选的节点上踢走。
 */
export async function isApiReachable(
  url: string,
  timeoutMs = PROBE_TIMEOUT_MS,
): Promise<boolean> {
  if (await pingOnce(url, timeoutMs)) { return true }
  return pingOnce(url, timeoutMs)
}

/** 回落目标 = 列表里的第一个节点，也是清空 customApi 后实际会用的那个 */
const FALLBACK_URL = apiData.servers[0]?.url ?? ''

/**
 * 判断是否该把用户选的分流降级回默认节点。
 *
 * 单看「选中的地址探不通」是不够的 —— 冷启动时离线、门户认证未通过、
 * DNS/VPN 抖动，这些情况下**任何**地址都探不通，但用户的节点本身没问题。
 * 而降级会写进 localStorage（search store 的 watcher 会 autoSaveState），
 * 是不可逆的：用户手填的自定义 API 就此丢失，只留一行 console.warn。
 *
 * 所以要有对照：拿回落目标本身再探一次。
 * - 对照也不通 → 本机网络问题或全线故障，降级没有意义，保持用户的选择不动
 * - 对照通了而选中的不通 → 确实是那个节点的问题，可以降级
 *
 * 对照只探一次（不重试）：它失败时我们选择「不动」，是安全的方向，
 * 不值得再花一倍时间去确认。
 */
export async function shouldFallBackFromApi(selected: string): Promise<boolean> {
  if (!selected) { return false }

  // 浏览器自己都知道离线，不必浪费两次 8s 超时
  if (!navigator.onLine) { return false }

  if (await isApiReachable(selected)) { return false }

  // 回落目标就是选中的那个（或列表为空），无处可退
  if (!FALLBACK_URL || FALLBACK_URL === selected) { return false }

  return pingOnce(FALLBACK_URL, PROBE_TIMEOUT_MS)
}
