import { createRouter, createWebHistory } from 'vue-router'
import { useUIStore } from '@/stores/ui'

// 路由配置
const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      meta: { title: 'SearchGal - Galgame 资源搜索' },
    },
    {
      path: '/settings',
      name: 'settings',
      meta: { title: '设置 - SearchGal' },
    },
    {
      path: '/comments',
      name: 'comments',
      meta: { title: '评论 - SearchGal' },
    },
    {
      path: '/history',
      name: 'history',
      meta: { title: '搜索历史 - SearchGal' },
    },
    // 捕获所有未匹配的路由
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

// 路由守卫 - 根据路由控制模态框
router.beforeEach((to, _from, next) => {
  // 更新页面标题
  if (to.meta.title) {
    document.title = to.meta.title as string
  }
  next()
})

// 路由变化后处理模态框状态
router.afterEach((to) => {
  // 延迟执行，确保 pinia store 已初始化
  setTimeout(() => {
    const uiStore = useUIStore()
    
    // 先关闭所有模态框，确保互斥
    uiStore.closeAllModals()
    
    // 然后根据路由打开对应的模态框
    switch (to.name) {
      case 'settings':
        uiStore.isSettingsModalOpen = true
        break
      case 'comments':
        uiStore.isCommentsModalOpen = true
        break
      case 'history':
        uiStore.isHistoryModalOpen = true
        break
      // home 路由不需要特殊处理，所有模态框已关闭
    }
  }, 0)
})

export default router

