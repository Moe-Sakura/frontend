/**
 * 下线分流的迁移处理
 *
 * 节点从 api.json 的 servers 移除后，用户本地仍会残留旧地址：
 * localStorage 里的搜索状态、收藏或分享出去的带 ?api= 的链接。
 * 这些地址匹配不到任何服务器，会被当成「自定义 API」继续请求一个已下线的域名。
 * 这里统一把它们归零，回落到默认节点。
 *
 * 下线节点时：把 servers 里的条目移到 retiredServers，只保留 url。
 */
import apiData from '@/data/api.json'

/** 忽略首尾空白、结尾斜杠与大小写差异 */
function normalize(url: string): string {
  return url.trim().replace(/\/+$/, '').toLowerCase()
}

const retiredUrls = new Set(apiData.retiredServers.map(normalize))

/** 判断一个 API 地址是否属于已下线的分流 */
export function isRetiredApiUrl(url: string): boolean {
  return retiredUrls.has(normalize(url))
}

/** 已下线的分流地址返回空串（= 使用默认节点），其余原样返回 */
export function migrateApiUrl(url: string): string {
  return isRetiredApiUrl(url) ? '' : url
}
