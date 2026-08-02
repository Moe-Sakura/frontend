/**
 * 友情链接
 *
 * 数据本体仍留在 src/data/friends.json —— 页面上「交换友链」按钮直接指向那个
 * 文件在 GitHub 上的编辑页，投稿者改的就是它，所以不能搬走。这里只做一层
 * 带类型的适配，顺便把散在组件里的常量收拢过来。
 */

import friendsData from '@/data/friends.json'

export interface FriendLink {
  name: string
  desc: string
  url: string
  logo: string
}

export const FRIEND_LINKS: readonly FriendLink[] = friendsData.friends || []

/** 「交换友链」按钮的目标：friends.json 的 GitHub 在线编辑页 */
export const FRIEND_SUBMIT_URL =
  'https://github.com/Moe-Sakura/frontend/edit/dev/src/data/friends.json'

/**
 * logo 加载失败时的占位图：一个粉色实心圆。
 *
 * 这里的颜色是唯一一处写死的品牌色 —— data: URI 里的 SVG 是独立文档，
 * 取不到页面上的 --brand-primary，没法跟随用户自定义主题色。
 */
const FALLBACK_LOGO =
  'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ff1493"><circle cx="12" cy="12" r="10"/></svg>'

/**
 * 直接改 DOM 的 src 而不是改数据，所以不会触发重渲染。
 * 占位图是 data: URI，不会再次失败，因此不需要防重入。
 */
export function handleFriendLogoError(e: Event) {
  const img = e.target as HTMLImageElement
  img.src = FALLBACK_LOGO
}
