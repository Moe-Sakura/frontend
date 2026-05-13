import type { PiniaPluginContext, StateTree, Store } from 'pinia'

// ============================================
// 类型定义
// ============================================

export interface PersistOptions {
  /** 是否启用持久化 */
  enabled: boolean
  /** 存储 key 前缀 */
  prefix?: string
  /** 需要持久化的状态路径 */
  paths?: string[]
  /** 使用 sessionStorage 而不是 localStorage */
  session?: boolean
  /** 自定义序列化函数 */
  serialize?: (state: StateTree) => string
  /** 自定义反序列化函数 */
  deserialize?: (value: string) => StateTree
}

// 扩展 Pinia 类型 - 使用 interface 合并
declare module 'pinia' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface DefineStoreOptionsBase<S, Store> {
    persist?: boolean | PersistOptions
    undoRedo?: boolean
    syncTabs?: boolean
  }
  
  interface PiniaCustomProperties {
    getPerformanceStats?: () => Record<string, {
      calls: number
      avgDuration: string
      totalDuration: string
    }>
    $persisted?: boolean
    $undo?: () => boolean
    $redo?: () => boolean
    $canUndo?: () => boolean
    $canRedo?: () => boolean
    $snapshot?: (name: string) => void
    $restore?: (name: string) => boolean
    $listSnapshots?: () => string[]
    $deleteSnapshot?: (name: string) => boolean
  }
}

// ============================================
// 辅助函数
// ============================================

/**
 * 从嵌套对象中获取指定路径的值
 */
function getValueByPath(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((acc: unknown, key) => {
    if (acc && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[key]
    }
    return undefined
  }, obj)
}

/**
 * 在嵌套对象中设置指定路径的值
 */
function setValueByPath(obj: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split('.')
  const lastKey = keys.pop()
  if (!lastKey) {return}
  
  let current = obj
  for (const key of keys) {
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {}
    }
    current = current[key] as Record<string, unknown>
  }
  current[lastKey] = value
}

/**
 * 提取指定路径的状态
 */
function pickStatePaths(state: StateTree, paths: string[]): StateTree {
  const result: Record<string, unknown> = {}
  for (const path of paths) {
    const value = getValueByPath(state, path)
    if (value !== undefined) {
      setValueByPath(result, path, value)
    }
  }
  return result
}

// ============================================
// Pinia 插件
// ============================================

/**
 * Pinia 插件：自动持久化 store 状态
 * 
 * 用法：
 * ```ts
 * defineStore('example', () => {...}, {
 *   persist: true // 简单启用
 *   // 或
 *   persist: {
 *     enabled: true,
 *     paths: ['user', 'settings'], // 只持久化部分状态
 *     session: true, // 使用 sessionStorage
 *   }
 * })
 * ```
 */
export function piniaPersistedState(context: PiniaPluginContext) {
  const { store, options } = context
  
  // 获取持久化配置
  const persistOption = options.persist
  if (!persistOption) {return}
  
  const config: PersistOptions = typeof persistOption === 'boolean'
    ? { enabled: persistOption }
    : persistOption
  
  if (!config.enabled) {return}
  
  const prefix = config.prefix ?? 'pinia'
  const storageKey = `${prefix}-${store.$id}`
  const storage = config.session ? sessionStorage : localStorage
  const serialize = config.serialize ?? JSON.stringify
  const deserialize = config.deserialize ?? JSON.parse
  
  // 从 storage 恢复状态
  try {
    const savedState = storage.getItem(storageKey)
    if (savedState) {
      const parsed = deserialize(savedState)
      store.$patch(parsed)
      store.$persisted = true
    }
  } catch (error) {
    console.error(`[Pinia Persist] Failed to restore state for "${store.$id}":`, error)
  }
  
  // 监听状态变化并保存
  store.$subscribe((_mutation, state) => {
    try {
      const stateToPersist = config.paths 
        ? pickStatePaths(state, config.paths)
        : state
      storage.setItem(storageKey, serialize(stateToPersist))
    } catch (error) {
      console.error(`[Pinia Persist] Failed to persist state for "${store.$id}":`, error)
    }
  })
}

/**
 * Pinia 插件：开发环境日志
 */
export function piniaLogger(context: PiniaPluginContext) {
  // 仅在开发环境启用
  if (import.meta.env.PROD) {return}
  
  const { store } = context
  
  // 监听 actions
  store.$onAction(({ name, args, after, onError }) => {
    const startTime = Date.now()
    
    console.info(`🚀 [${store.$id}] Action "${name}" called with:`, args)
    
    after((result) => {
      const duration = Date.now() - startTime
      console.info(`✅ [${store.$id}] Action "${name}" completed in ${duration}ms`, result)
    })
    
    onError((error) => {
      const duration = Date.now() - startTime
      console.error(`❌ [${store.$id}] Action "${name}" failed after ${duration}ms:`, error)
    })
  })
  
  // 监听状态变化
  store.$subscribe((mutation, state) => {
    console.info(`📝 [${store.$id}] State changed:`, {
      type: mutation.type,
      storeId: mutation.storeId,
      events: mutation.events,
      state: { ...state },
    })
  })
}

/**
 * Pinia 插件：性能监控
 */
export function piniaPerformance(context: PiniaPluginContext) {
  const { store } = context
  
  // 统计数据
  const stats = {
    actionCalls: new Map<string, number>(),
    actionDurations: new Map<string, number[]>(),
  }
  
  // 监听 actions
  store.$onAction(({ name, after }) => {
    const startTime = performance.now()
    
    // 增加调用次数
    stats.actionCalls.set(name, (stats.actionCalls.get(name) || 0) + 1)
    
    after(() => {
      const duration = performance.now() - startTime
      
      // 记录执行时间
      if (!stats.actionDurations.has(name)) {
        stats.actionDurations.set(name, [])
      }
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      stats.actionDurations.get(name)!.push(duration)
    })
  })
  
  interface PerformanceStatEntry {
    calls: number
    avgDuration: string
    totalDuration: string
  }

  // 添加获取统计信息的方法
  store.getPerformanceStats = () => {
    const result: Record<string, PerformanceStatEntry> = {}
    
    for (const [action, calls] of stats.actionCalls.entries()) {
      const durations = stats.actionDurations.get(action) || []
      const avgDuration = durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : 0
      
      result[action] = {
        calls,
        avgDuration: avgDuration.toFixed(2) + 'ms',
        totalDuration: durations.reduce((a, b) => a + b, 0).toFixed(2) + 'ms',
      }
    }
    
    return result
  }
}

/**
 * Pinia 插件：错误处理
 */
export function piniaErrorHandler(context: PiniaPluginContext) {
  const { store } = context
  
  // 监听 actions 错误
  store.$onAction(({ name, onError }) => {
    onError((error) => {
      // 可以在这里集成错误上报服务
      console.error(`[Pinia Error] Action "${name}" in store "${store.$id}":`, error)
      
      // 可以触发全局错误通知
      // 例如：通过 UIStore 显示 toast
    })
  })
}

/**
 * Pinia 插件：撤销/重做功能
 */
export function piniaUndoRedo(context: PiniaPluginContext) {
  const { store, options } = context
  
  // 只对配置了 undoRedo 的 store 启用
  if (!(options as { undoRedo?: boolean }).undoRedo) {return}
  
  const history: StateTree[] = []
  let currentIndex = -1
  const maxHistory = 50
  
  // 记录状态变化
  store.$subscribe((_mutation, state) => {
    // 如果当前不在最新状态，清除后面的历史
    if (currentIndex < history.length - 1) {
      history.splice(currentIndex + 1)
    }
    
    // 添加新状态
    history.push(JSON.parse(JSON.stringify(state)))
    currentIndex = history.length - 1
    
    // 限制历史记录数量
    if (history.length > maxHistory) {
      history.shift()
      currentIndex--
    }
  })
  
  // 添加撤销方法
  ;(store as Store & { $undo?: () => boolean }).$undo = () => {
    if (currentIndex > 0) {
      currentIndex--
      const snapshot = history[currentIndex]
      if (snapshot) {store.$patch(snapshot)}
      return true
    }
    return false
  }
  
  // 添加重做方法
  ;(store as Store & { $redo?: () => boolean }).$redo = () => {
    if (currentIndex < history.length - 1) {
      currentIndex++
      const snapshot = history[currentIndex]
      if (snapshot) {store.$patch(snapshot)}
      return true
    }
    return false
  }
  
  // 添加检查方法
  ;(store as Store & { $canUndo?: () => boolean }).$canUndo = () => currentIndex > 0
  ;(store as Store & { $canRedo?: () => boolean }).$canRedo = () => currentIndex < history.length - 1
}

/**
 * Pinia 插件：状态快照
 */
export function piniaSnapshot(context: PiniaPluginContext) {
  const { store } = context
  
  const snapshots = new Map<string, StateTree>()
  
  // 创建快照
  ;(store as Store & { $snapshot?: (name: string) => void }).$snapshot = (name: string) => {
    snapshots.set(name, JSON.parse(JSON.stringify(store.$state)))
  }
  
  // 恢复快照
  ;(store as Store & { $restore?: (name: string) => boolean }).$restore = (name: string) => {
    const snapshot = snapshots.get(name)
    if (snapshot) {
      store.$patch(snapshot)
      return true
    }
    return false
  }
  
  // 列出所有快照
  ;(store as Store & { $listSnapshots?: () => string[] }).$listSnapshots = () => {
    return Array.from(snapshots.keys())
  }
  
  // 删除快照
  ;(store as Store & { $deleteSnapshot?: (name: string) => boolean }).$deleteSnapshot = (name: string) => {
    return snapshots.delete(name)
  }
}

/**
 * Pinia 插件：状态同步（跨标签页）
 */
export function piniaSyncTabs(context: PiniaPluginContext) {
  const { store, options } = context
  
  // 只对配置了 syncTabs 的 store 启用
  if (!(options as { syncTabs?: boolean }).syncTabs) {return}
  
  // 检查浏览器是否支持 BroadcastChannel
  if (typeof BroadcastChannel === 'undefined') {
    if (import.meta.env.DEV) {
      console.warn(`[pinia-sync-tabs] BroadcastChannel not supported, skipping sync for store: ${store.$id}`)
    }
    return
  }
  
  const channelName = `pinia-sync-${store.$id}`
  
  try {
    // 创建广播频道
    const channel = new BroadcastChannel(channelName)
    
    // 监听其他标签页的状态变化
    channel.onmessage = (event) => {
      if (event.data?.type === 'state-update') {
        store.$patch(event.data.state)
      }
    }
    
    // 当前标签页状态变化时广播
    store.$subscribe((_mutation, state) => {
      try {
        channel.postMessage({
          type: 'state-update',
          state: JSON.parse(JSON.stringify(state)),
        })
      } catch {
        // 静默处理序列化错误
      }
    })
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn(`[pinia-sync-tabs] Failed to create BroadcastChannel for store: ${store.$id}`, error)
    }
  }
}
