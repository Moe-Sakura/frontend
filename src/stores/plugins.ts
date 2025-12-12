import type { PiniaPluginContext } from 'pinia'

/**
 * Pinia 插件：自动持久化 store 状态到 localStorage
 */
export function piniaPersistedState(context: PiniaPluginContext) {
  const { store, options } = context
  
  // 只对配置了 persist 选项的 store 进行持久化
  if (!options.persist) {return}
  
  const storageKey = `pinia-${store.$id}`
  
  // 从 localStorage 恢复状态
  const savedState = localStorage.getItem(storageKey)
  if (savedState) {
    try {
      const parsed = JSON.parse(savedState)
      store.$patch(parsed)
    } catch (error) {
      console.error(`Failed to restore state for store "${store.$id}":`, error)
    }
  }
  
  // 监听状态变化并保存
  store.$subscribe((_, state) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state))
    } catch (error) {
      console.error(`Failed to persist state for store "${store.$id}":`, error)
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
    
    console.log(`🚀 [${store.$id}] Action "${name}" called with:`, args)
    
    after((result) => {
      const duration = Date.now() - startTime
      console.log(`✅ [${store.$id}] Action "${name}" completed in ${duration}ms`, result)
    })
    
    onError((error) => {
      const duration = Date.now() - startTime
      console.error(`❌ [${store.$id}] Action "${name}" failed after ${duration}ms:`, error)
    })
  })
  
  // 监听状态变化
  store.$subscribe((mutation, state) => {
    console.log(`📝 [${store.$id}] State changed:`, {
      type: mutation.type,
      storeId: mutation.storeId,
      payload: mutation.payload,
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
      console.error(`Error in action "${name}" of store "${store.$id}":`, error)
      
      // 可以触发全局错误通知
      // 例如：通过 UIStore 显示 toast
    })
  })
}

