/**
 * 自定义进度条 - 使用原生 CSS 动画
 * 功能：页面顶部进度条 + 右上角 spinner
 */

// 状态
let progress = 0
let activeRequests = 0
let trickleInterval: number | null = null
let barElement: HTMLElement | null = null
let spinnerElement: HTMLElement | null = null
let isStarted = false

// 配置
const config = {
  minimum: 0.08,
  trickleSpeed: 200,
  speed: 300,
}

/**
 * 创建进度条 DOM 元素
 */
function createElements() {
  if (barElement) {return}

  // 创建容器
  const container = document.createElement('div')
  container.id = 'progress-bar'
  container.innerHTML = `
    <div class="progress-bar"></div>
    <div class="progress-peg"></div>
    <div class="progress-spinner">
      <div class="spinner-icon"></div>
    </div>
  `
  document.body.appendChild(container)

  barElement = container.querySelector('.progress-bar')
  spinnerElement = container.querySelector('.progress-spinner')

  // 添加样式
  if (!document.getElementById('progress-styles')) {
    const style = document.createElement('style')
    style.id = 'progress-styles'
    style.textContent = `
      #progress-bar {
        pointer-events: none;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 9999;
      }
      
      #progress-bar .progress-bar {
        background: linear-gradient(90deg, #ff1493, #d946ef, #ff69b4, #ff1493);
        background-size: 300% 100%;
        animation: progress-gradient 2s linear infinite;
        height: 3px;
        width: 0%;
        position: absolute;
        top: 0;
        left: 0;
        transition: width 0.3s ease-out, opacity 0.2s ease;
      }
      
      @keyframes progress-gradient {
        0% { background-position: 0% 50%; }
        100% { background-position: 300% 50%; }
      }
      
      #progress-bar .progress-peg {
        display: block;
        position: absolute;
        right: 0;
        top: 0;
        width: 100px;
        height: 3px;
        opacity: 1;
        transform: rotate(3deg) translate(0px, -4px);
      }
      
      #progress-bar .progress-spinner {
        display: none;
        position: fixed;
        top: 16px;
        right: 16px;
        z-index: 9999;
      }
      
      #progress-bar .spinner-icon {
        width: 20px;
        height: 20px;
        box-sizing: border-box;
        border: 2px solid transparent;
        border-top-color: #ff1493;
        border-left-color: #d946ef;
        border-radius: 50%;
        animation: progress-spin 0.6s linear infinite;
      }
      
      @keyframes progress-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      /* 暗色模式 */
      .dark #progress-bar .progress-bar {
        /* 无额外阴影 */
      }
      
      .dark #progress-bar .spinner-icon {
        border-top-color: #ff69b4;
        border-left-color: #e879f9;
      }
      
      /* 移动端 */
      @media (max-width: 640px) {
        #progress-bar .progress-bar { height: 2px; }
        #progress-bar .progress-peg { height: 2px; }
        #progress-bar .progress-spinner { top: 12px; right: 12px; }
        #progress-bar .spinner-icon { width: 16px; height: 16px; }
      }
    `
    document.head.appendChild(style)
  }
}

/**
 * 设置进度值
 */
function set(n: number) {
  createElements()
  
  n = Math.max(config.minimum, Math.min(1, n))
  progress = n
  
  if (barElement) {
    barElement.style.width = `${n * 100}%`
  }
}

/**
 * 递增进度
 */
function inc(amount?: number) {
  if (!isStarted) {return}
  
  if (progress >= 1) {return}
  
  if (typeof amount !== 'number') {
    // 自动计算递增量（越接近完成，递增越慢）
    if (progress < 0.2) {amount = 0.1}
    else if (progress < 0.5) {amount = 0.04}
    else if (progress < 0.8) {amount = 0.02}
    else if (progress < 0.99) {amount = 0.005}
    else {amount = 0}
  }
  
  set(Math.min(progress + amount, 0.994))
}

/**
 * 开始 trickle（自动递增）
 */
function startTrickle() {
  if (trickleInterval) {return}
  
  trickleInterval = window.setInterval(() => {
    inc()
  }, config.trickleSpeed)
}

/**
 * 停止 trickle
 */
function stopTrickle() {
  if (trickleInterval) {
    clearInterval(trickleInterval)
    trickleInterval = null
  }
}

/**
 * 开始进度条
 */
export function startProgress() {
  activeRequests++
  
  if (activeRequests === 1) {
    createElements()
    isStarted = true
    progress = 0
    
    if (barElement) {
      barElement.style.opacity = '1'
      barElement.style.width = '0%'
    }
    
    if (spinnerElement) {
      spinnerElement.style.display = 'block'
    }
    
    set(config.minimum)
    startTrickle()
  }
}

/**
 * 结束进度条
 */
export function doneProgress() {
  activeRequests = Math.max(0, activeRequests - 1)
  
  if (activeRequests === 0 && isStarted) {
    stopTrickle()
    
    // 先完成到 100%
    set(1)
    
    // 然后淡出
    setTimeout(() => {
      if (barElement) {
        barElement.style.opacity = '0'
        
        // 重置状态
        setTimeout(() => {
          if (barElement) {
            barElement.style.width = '0%'
          }
          isStarted = false
          progress = 0
        }, 200)
      }
      
      if (spinnerElement) {
        spinnerElement.style.display = 'none'
      }
    }, config.speed)
  }
}

/**
 * 强制完成进度条
 */
export function forceComplete() {
  activeRequests = 0
  stopTrickle()
  
  if (barElement) {
    barElement.style.width = '100%'
    barElement.style.opacity = '0'
  }
  
  if (spinnerElement) {
    spinnerElement.style.display = 'none'
  }
  
  isStarted = false
  progress = 0
}

/**
 * 设置进度值（导出）
 */
export function setProgress(n: number) {
  set(n)
}

/**
 * 递增进度（导出）
 */
export function incProgress(amount?: number) {
  inc(amount)
}

/**
 * 创建带进度条的 fetch 包装器
 */
export function createProgressFetch() {
  const originalFetch = window.fetch

  window.fetch = async function (...args) {
    startProgress()
    try {
      const response = await originalFetch.apply(this, args)
      return response
    } finally {
      doneProgress()
    }
  }

  return () => {
    window.fetch = originalFetch
  }
}

/**
 * 使用进度条的 composable
 */
export function useProgress() {
  return {
    start: startProgress,
    done: doneProgress,
    forceComplete,
    set: setProgress,
    inc: incProgress,
  }
}
