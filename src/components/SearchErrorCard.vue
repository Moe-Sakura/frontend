<template>
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="opacity-0 translate-y-2 scale-95"
    enter-to-class="opacity-100 translate-y-0 scale-100"
    leave-active-class="transition-all duration-200 ease-in"
    leave-from-class="opacity-100 translate-y-0 scale-100"
    leave-to-class="opacity-0 translate-y-2 scale-95"
  >
    <div v-if="error" class="w-full max-w-2xl px-2 sm:px-0 mt-4">
      <div class="error-card">
        <!-- 错误头部 -->
        <div class="flex items-start gap-3">
          <div
            class="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
            :class="iconStyle.bgClass"
          >
            <component :is="iconStyle.icon" :size="22" class="text-white" />
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1.5 flex-wrap">
              <h4 class="text-base font-bold text-red-700 dark:text-red-300">
                {{ title }}
              </h4>
              <div class="flex items-center gap-1.5">
                <span class="px-2 py-0.5 rounded-md text-[11px] font-bold bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-sm">
                  {{ codeInfo.code }}
                </span>
                <span v-if="codeInfo.httpStatus" class="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 dark:bg-red-900/40 text-red-500 dark:text-red-400 font-mono">
                  {{ codeInfo.description }}
                </span>
              </div>
            </div>
            <p class="text-sm text-red-600 dark:text-red-400 break-words leading-relaxed">
              {{ formattedMessage }}
            </p>

            <div v-if="details" class="mt-2 p-2.5 rounded-lg bg-red-100/50 dark:bg-red-950/40 border border-red-200/50 dark:border-red-800/30">
              <div class="flex items-start gap-2">
                <div class="flex-shrink-0 text-[10px] font-mono font-semibold text-red-500 dark:text-red-400 bg-red-200/50 dark:bg-red-900/50 px-1.5 py-0.5 rounded">
                  DETAIL
                </div>
                <code class="text-[11px] text-red-600/80 dark:text-red-400/80 font-mono break-all leading-relaxed">
                  {{ details }}
                </code>
              </div>
            </div>
          </div>

          <button
            class="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all hover:scale-110"
            @click="emit('close')"
          >
            <X :size="18" />
          </button>
        </div>

        <!-- 建议操作 -->
        <div class="mt-4 pt-3 border-t border-red-200/30 dark:border-red-800/30 flex flex-wrap items-center gap-2">
          <span class="text-xs text-red-500/80 dark:text-red-400/80 font-medium">快速操作：</span>
          <button
            v-ripple="'rgba(239, 68, 68, 0.3)'"
            class="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 shadow-md shadow-red-500/20 hover:shadow-lg hover:shadow-red-500/30 transition-all flex items-center gap-1.5 disabled:opacity-50"
            :disabled="retryDisabled"
            @click="emit('retry')"
          >
            <RefreshCw :size="12" :class="{ 'animate-spin': retryDisabled }" />
            <span>{{ retryDisabled ? '请稍候...' : '重新搜索' }}</span>
          </button>
          <button
            class="px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200/50 dark:border-red-800/30 transition-colors"
            @click="emit('close')"
          >
            关闭提示
          </button>
          <a
            href="https://status.searchgal.top"
            target="_blank"
            rel="noopener noreferrer"
            class="px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200/50 dark:border-red-800/30 transition-colors flex items-center gap-1.5"
          >
            <Wifi :size="12" />
            <span>服务状态</span>
          </a>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AlertCircle, Clock, RefreshCw, Server, Wifi, WifiOff, X } from 'lucide-vue-next'

interface ErrorCodeInfo {
  code: string
  httpStatus?: number
  description: string
}

const props = defineProps<{
  error: string
  retryDisabled?: boolean
}>()

const emit = defineEmits<{
  close: []
  retry: []
}>()

const formattedMessage = computed(() => formatErrorMessage(props.error))
const details = computed(() => getErrorDetails(props.error))
const iconStyle = computed(() => getErrorIconStyle(props.error))
const title = computed(() => getErrorTitle(props.error))
const codeInfo = computed(() => getErrorCodeInfo(props.error))

function formatErrorMessage(error: string): string {
  const errorMappings: Record<string, string> = {
    'Failed to fetch': '无法连接到服务器，请检查网络连接',
    'Network Error': '网络错误，请检查您的网络连接',
    'timeout': '请求超时，服务器响应过慢',
    'CORS': '跨域请求被阻止，请联系管理员',
    '500': '服务器内部错误，请稍后重试',
    '502': '网关错误，后端服务可能不可用',
    '503': '服务暂时不可用，请稍后重试',
    '504': '网关超时，请稍后重试',
    '404': '请求的资源不存在',
    '403': '访问被拒绝',
    '401': '未授权访问',
    '429': '请求过于频繁，请稍后重试',
  }
  for (const [key, message] of Object.entries(errorMappings)) {
    if (error.toLowerCase().includes(key.toLowerCase())) {
      return message
    }
  }
  if (error.length > 200) {
    return error.substring(0, 200) + '...'
  }
  return error
}

function getErrorDetails(error: string): string | null {
  const technicalPatterns = [
    /\{[\s\S]*\}/,
    /Error:[\s\S]*/,
    /at\s+[\w.]+\s+\(/,
  ]
  for (const pattern of technicalPatterns) {
    const match = error.match(pattern)
    if (match && match[0].length > 50) {
      return match[0].substring(0, 300) + (match[0].length > 300 ? '...' : '')
    }
  }
  return null
}

function getErrorIconStyle(error: string): { icon: typeof WifiOff, bgClass: string } {
  const errorLower = error.toLowerCase()
  if (errorLower.includes('fetch') || errorLower.includes('network') || errorLower.includes('连接')) {
    return { icon: WifiOff, bgClass: 'bg-gradient-to-br from-orange-500 to-red-500 shadow-orange-500/30' }
  }
  if (errorLower.includes('timeout') || errorLower.includes('超时')) {
    return { icon: Clock, bgClass: 'bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-500/30' }
  }
  if (errorLower.includes('500') || errorLower.includes('502') || errorLower.includes('503') || errorLower.includes('server')) {
    return { icon: Server, bgClass: 'bg-gradient-to-br from-red-600 to-rose-600 shadow-red-600/30' }
  }
  return { icon: AlertCircle, bgClass: 'bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/30' }
}

function getErrorTitle(error: string): string {
  const errorLower = error.toLowerCase()
  if (errorLower.includes('fetch') || errorLower.includes('network')) {return '网络连接失败'}
  if (errorLower.includes('timeout') || errorLower.includes('超时')) {return '请求超时'}
  if (errorLower.includes('500')) {return '服务器内部错误'}
  if (errorLower.includes('502') || errorLower.includes('503')) {return '服务暂时不可用'}
  if (errorLower.includes('404')) {return '资源不存在'}
  if (errorLower.includes('429')) {return '请求频率过高'}
  return '搜索遇到问题'
}

function getErrorCodeInfo(error: string): ErrorCodeInfo {
  const errorLower = error.toLowerCase()
  const statusMatch = /\b(4\d{2}|5\d{2})\b/.exec(error)
  if (statusMatch?.[1]) {
    const status = parseInt(statusMatch[1])
    const statusDescriptions: Record<number, string> = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      405: 'Method Not Allowed',
      408: 'Request Timeout',
      429: 'Too Many Requests',
      500: 'Internal Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable',
      504: 'Gateway Timeout',
    }
    return {
      code: `HTTP ${status}`,
      httpStatus: status,
      description: statusDescriptions[status] || 'Server Error',
    }
  }
  if (errorLower.includes('fetch') || errorLower.includes('network') || errorLower.includes('连接')) {
    return { code: 'ERR_NETWORK', description: 'Network Error' }
  }
  if (errorLower.includes('timeout') || errorLower.includes('超时')) {
    return { code: 'ERR_TIMEOUT', description: 'Request Timeout' }
  }
  if (errorLower.includes('cors')) {
    return { code: 'ERR_CORS', description: 'Cross-Origin Blocked' }
  }
  if (errorLower.includes('abort') || errorLower.includes('取消')) {
    return { code: 'ERR_ABORTED', description: 'Request Aborted' }
  }
  if (errorLower.includes('dns') || errorLower.includes('resolve')) {
    return { code: 'ERR_DNS', description: 'DNS Resolution Failed' }
  }
  if (errorLower.includes('ssl') || errorLower.includes('certificate') || errorLower.includes('证书')) {
    return { code: 'ERR_SSL', description: 'SSL Certificate Error' }
  }
  if (errorLower.includes('parse') || errorLower.includes('json') || errorLower.includes('解析')) {
    return { code: 'ERR_PARSE', description: 'Response Parse Error' }
  }
  if (errorLower.includes('stream') || errorLower.includes('流')) {
    return { code: 'ERR_STREAM', description: 'Stream Error' }
  }
  return { code: 'ERR_UNKNOWN', description: 'Unknown Error' }
}
</script>

<style scoped>
.error-card {
  background: linear-gradient(135deg, rgba(var(--color-error, 254, 242, 242), var(--opacity-panel, 0.85)), rgba(254, 226, 226, var(--opacity-panel, 0.85)));
  border-radius: var(--radius-lg, 1rem);
  border-radius: 1rem;
  padding: 1rem;
  border: 1px solid rgba(239, 68, 68, 0.2);
  box-shadow:
    0 4px 20px -4px rgba(239, 68, 68, 0.2),
    0 0 0 1px rgba(255, 255, 255, 0.6) inset;
  animation: errorShake 0.5s ease-out;
}

:global(.dark) .error-card {
  background: linear-gradient(135deg, rgba(127, 29, 29, 0.4), rgba(153, 27, 27, 0.3));
  border: 1px solid rgba(239, 68, 68, 0.3);
  box-shadow:
    0 4px 20px -4px rgba(239, 68, 68, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.03) inset;
}

@keyframes errorShake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}
</style>
