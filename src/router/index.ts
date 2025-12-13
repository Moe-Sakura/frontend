import { createRouter, createWebHistory } from 'vue-router'
import { useUIStore } from '@/stores/ui'

// UI 面板类型
export type UIPanel = 'settings' | 'comments' | 'history' | 'vndb' | null

// 从查询参数获取当前面板
export function getUIPanelFromQuery(query: Record<string, string | string[]>): UIPanel {
  const ui = query.ui
  if (ui === 'settings' || ui === 'comments' || ui === 'history' || ui === 'vndb') {
    return ui
  }
  return null
}

// 生成带 ui 参数的查询对象（保留其他参数）
export function createUIQuery(panel: UIPanel, currentQuery: Record<string, string | string[]> = {}): Record<string, string | string[] | undefined> {
  const newQuery = { ...currentQuery }
  if (panel) {
    newQuery.ui = panel
  } else {
    delete newQuery.ui
  }
  return newQuery
}

// 路由配置
const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      meta: { title: 'SearchGal - Galgame 资源搜索' },
    },
    // 捕获所有未匹配的路由
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

// 路由守卫 - 根据查询参数控制模态框
router.beforeEach((to, _from, next) => {
  const panel = getUIPanelFromQuery(to.query as Record<string, string>)
  
  // 更新页面标题
  const titles: Record<string, string> = {
    settings: '设置 - SearchGal',
    comments: '评论 - SearchGal',
    history: '搜索历史 - SearchGal',
    vndb: '作品信息 - SearchGal',
  }
  document.title = panel ? titles[panel] : 'SearchGal - Galgame 资源搜索'
  
  next()
})

// 路由变化后处理模态框状态
router.afterEach((to) => {
  // 延迟执行，确保 pinia store 已初始化
  setTimeout(() => {
    const uiStore = useUIStore()
    const panel = getUIPanelFromQuery(to.query as Record<string, string>)
    
    // 先关闭所有模态框，确保互斥
    uiStore.closeAllModals()
    
    // 然后根据 ui 参数打开对应的模态框
    switch (panel) {
      case 'settings':
        uiStore.isSettingsModalOpen = true
        break
      case 'comments':
        uiStore.isCommentsModalOpen = true
        break
      case 'history':
        uiStore.isHistoryModalOpen = true
        break
      case 'vndb':
        uiStore.isVndbPanelOpen = true
        break
    }
  }, 0)
})

export default router
