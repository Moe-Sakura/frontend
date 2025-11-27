# Pinia Store 使用指南

SearchGal 使用 Pinia 进行状态管理，已充分优化和模块化。

## Store 模块

### 1. Search Store (`useSearchStore`)
**用途**：管理搜索相关的状态和逻辑

```typescript
import { useSearchStore } from '@/stores'

const searchStore = useSearchStore()

// 状态
searchStore.searchQuery      // 搜索关键词
searchStore.searchMode        // 搜索模式 ('game' | 'patch')
searchStore.platformResults   // 平台搜索结果
searchStore.vndbInfo          // VNDB 游戏信息
searchStore.isSearching       // 是否正在搜索
searchStore.searchProgress    // 搜索进度

// 计算属性
searchStore.hasResults        // 是否有搜索结果
searchStore.isVndbMode        // 是否为 VNDB 模式
searchStore.searchDisabled    // 是否禁用搜索（冷却时间）

// 方法
searchStore.setSearchQuery('关键词')
searchStore.setSearchMode('game')
searchStore.startSearch()
searchStore.endSearch()
searchStore.setPlatformResult('platform', data)
searchStore.loadMoreResults('platform', 20)
searchStore.clearResults()
```

### 2. UI Store (`useUIStore`)
**用途**：管理UI相关状态（主题、模态框、通知等）

```typescript
import { useUIStore } from '@/stores'

const uiStore = useUIStore()

// 主题
uiStore.isDarkMode
uiStore.toggleDarkMode()
uiStore.setDarkMode(true)

// 模态框
uiStore.isCommentsModalOpen
uiStore.isVndbPanelOpen
uiStore.isSettingsModalOpen
uiStore.toggleCommentsModal()
uiStore.closeAllModals()

// Toast 通知
uiStore.showToast('success', '操作成功！', 3000)
uiStore.showToast('error', '操作失败！')

// 浮动按钮
uiStore.showScrollToTop
uiStore.showPlatformNav
uiStore.togglePlatformNav()

// 加载状态
uiStore.setLoading(true, '加载中...')
uiStore.setLoading(false)
```

### 3. Settings Store (`useSettingsStore`)
**用途**：管理用户设置

```typescript
import { useSettingsStore } from '@/stores'

const settingsStore = useSettingsStore()

// 访问设置
settingsStore.settings.customApi
settingsStore.settings.autoLoadMore
settingsStore.settings.resultsPerPage

// 更新单个设置
settingsStore.updateSetting('resultsPerPage', 20)

// 批量更新
settingsStore.updateSettings({
  customApi: 'https://api.example.com',
  autoLoadMore: true,
})

// 重置设置
settingsStore.resetSettings()

// 导入导出
const json = settingsStore.exportSettings()
settingsStore.importSettings(json)
```

### 4. History Store (`useHistoryStore`)
**用途**：管理搜索历史

```typescript
import { useHistoryStore } from '@/stores'

const historyStore = useHistoryStore()

// 访问历史
historyStore.searchHistory        // 所有历史
historyStore.recentHistory        // 最近10条
historyStore.popularQueries       // 热门查询

// 添加历史
historyStore.addHistory({
  query: '关键词',
  mode: 'game',
  resultCount: 10,
})

// 删除历史
historyStore.removeHistory(0)
historyStore.removeHistoryByQuery('关键词')
historyStore.clearHistory()

// 搜索历史
const results = historyStore.searchInHistory('关键词')

// 统计信息
const stats = historyStore.getHistoryStats()
```

### 5. Cache Store (`useCacheStore`)
**用途**：管理缓存数据

```typescript
import { useCacheStore } from '@/stores'

const cacheStore = useCacheStore()

// VNDB 缓存
cacheStore.cacheVndbInfo('query', vndbData)
const cached = cacheStore.getVndbInfo('query')
const hasCache = cacheStore.hasVndbCache('query')

// 搜索结果缓存
cacheStore.cacheSearchResults('query', 'game', results)
const results = cacheStore.getSearchResults('query', 'game')

// 清理缓存
cacheStore.clearVndbCache()
cacheStore.clearSearchCache()
cacheStore.clearAllCache()
cacheStore.cleanExpiredCache() // 清理过期缓存

// 缓存统计
const stats = cacheStore.getCacheStats()
```

## Store 插件

### 开发环境日志
在开发环境自动记录所有 action 调用和状态变化

### 性能监控
自动记录每个 action 的执行时间和调用次数

```typescript
// 获取性能统计
const stats = searchStore.getPerformanceStats()
console.log(stats)
// {
//   startSearch: { calls: 5, avgDuration: '12.50ms', totalDuration: '62.50ms' },
//   ...
// }
```

### 错误处理
自动捕获和记录 store 中的错误

## 最佳实践

### 1. 组件中使用 Store
```vue
<script setup lang="ts">
import { useSearchStore, useUIStore } from '@/stores'

const searchStore = useSearchStore()
const uiStore = useUIStore()

// 使用 computed 访问状态
const hasResults = computed(() => searchStore.hasResults)

// 调用 actions
function handleSearch() {
  searchStore.startSearch()
  // ...
  searchStore.endSearch()
}
</script>
```

### 2. Store 之间通信
```typescript
// 在 searchStore 中使用 historyStore
const historyStore = useHistoryStore()
const cacheStore = useCacheStore()

// 搜索完成后添加历史
historyStore.addHistory({...})

// 使用缓存
const cached = cacheStore.getVndbInfo(query)
if (cached) {
  // 使用缓存数据
}
```

### 3. 响应式更新
```typescript
// ✅ 正确：使用 ref 或 computed
const searchQuery = computed(() => searchStore.searchQuery)

// ❌ 错误：直接解构会失去响应性
const { searchQuery } = searchStore

// ✅ 正确：使用 storeToRefs
import { storeToRefs } from 'pinia'
const { searchQuery } = storeToRefs(searchStore)
```

### 4. 性能优化
```typescript
// 使用缓存避免重复请求
function searchGame(query: string) {
  // 检查缓存
  const cached = cacheStore.getSearchResults(query, 'game')
  if (cached) {
    searchStore.setPlatformResult('platform', cached)
    return
  }
  
  // 执行搜索并缓存结果
  // ...
}
```

## 调试技巧

### 1. Vue DevTools
安装 Vue DevTools 扩展，可以实时查看所有 store 的状态

### 2. 控制台日志
开发环境会自动记录所有 action 和状态变化

### 3. 性能分析
```javascript
// 在控制台查看性能统计
console.log(useSearchStore().getPerformanceStats())
console.log(useCacheStore().getCacheStats())
console.log(useHistoryStore().getHistoryStats())
```

### 4. 手动清理
```javascript
// 清除所有缓存
useCacheStore().clearAllCache()

// 清除历史记录
useHistoryStore().clearHistory()

// 重置设置
useSettingsStore().resetSettings()
```

