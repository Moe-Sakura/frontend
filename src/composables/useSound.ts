/**
 * 音效管理 composable
 * 使用 Web Audio API 生成原生 UI 音效
 */

import { ref } from 'vue'

// 音效是否启用（初始值，会被 settings store 覆盖）
const soundEnabled = ref(true)

// 初始化音效设置（从 settings store 同步）
export function initSoundFromSettings(enabled: boolean): void {
  soundEnabled.value = enabled
}

// 监听 settings 变化的函数（供外部调用）
export function syncSoundWithSettings(enabled: boolean): void {
  soundEnabled.value = enabled
}

// AudioContext 单例
let audioContext: AudioContext | null = null

// 获取或创建 AudioContext
function getAudioContext(): AudioContext | null {
  if (!soundEnabled.value) {
    return null
  }
  
  if (!audioContext) {
    try {
      audioContext = new AudioContext()
    } catch {
      console.warn('[Sound] Web Audio API 不可用')
    return null
  }
}

  // 恢复被暂停的 AudioContext（浏览器自动播放策略）
  if (audioContext.state === 'suspended') {
    void audioContext.resume()
  }
  
  return audioContext
}

// ========================================
// 音效类型定义
// ========================================
export type SoundType = 
  | 'tap'             // 轻触
  | 'button'          // 按钮
  | 'select'          // 选择
  | 'toggle_on'       // 开关打开
  | 'toggle_off'      // 开关关闭
  | 'type'            // 打字
  | 'swipe'           // 滑动
  | 'notification'    // 通知
  | 'celebration'     // 庆祝
  | 'caution'         // 警告
  | 'disabled'        // 禁用
  | 'transition_up'   // 上升过渡
  | 'transition_down' // 下降过渡
  | 'progress_loop'   // 进度循环
  | 'ringtone_loop'   // 铃声循环

// ========================================
// 音效合成函数
// ========================================

// 创建增益节点并连接
function createGain(ctx: AudioContext, volume: number): GainNode {
  const gain = ctx.createGain()
  gain.gain.value = volume
  gain.connect(ctx.destination)
  return gain
}

// 轻触音效 - 短促高频点击
function playTapSound(ctx: AudioContext): void {
  const osc = ctx.createOscillator()
  const gain = createGain(ctx, 0.15)
  
  osc.type = 'sine'
  osc.frequency.setValueAtTime(800, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.05)
  
  gain.gain.setValueAtTime(0.15, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05)
  
  osc.connect(gain)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.05)
}

// 按钮音效 - 稍长的确认音
function playButtonSound(ctx: AudioContext): void {
  const osc = ctx.createOscillator()
  const gain = createGain(ctx, 0.12)
  
  osc.type = 'sine'
  osc.frequency.setValueAtTime(600, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.03)
  osc.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.08)
  
  gain.gain.setValueAtTime(0.12, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08)
  
  osc.connect(gain)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.08)
}

// 选择音效 - 清脆的选中音
function playSelectSound(ctx: AudioContext): void {
  const osc = ctx.createOscillator()
  const gain = createGain(ctx, 0.1)
  
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(1200, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.06)
  
  gain.gain.setValueAtTime(0.1, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06)
  
  osc.connect(gain)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.06)
}

// 开关打开音效 - 上升音调
function playToggleOnSound(ctx: AudioContext): void {
  const osc = ctx.createOscillator()
  const gain = createGain(ctx, 0.12)
  
  osc.type = 'sine'
  osc.frequency.setValueAtTime(400, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1)
  
  gain.gain.setValueAtTime(0.12, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)
  
  osc.connect(gain)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.1)
}

// 开关关闭音效 - 下降音调
function playToggleOffSound(ctx: AudioContext): void {
  const osc = ctx.createOscillator()
  const gain = createGain(ctx, 0.12)
  
  osc.type = 'sine'
  osc.frequency.setValueAtTime(800, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1)
  
  gain.gain.setValueAtTime(0.12, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)
  
  osc.connect(gain)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.1)
}

// 打字音效 - 极短的敲击音
function playTypeSound(ctx: AudioContext): void {
  const osc = ctx.createOscillator()
  const gain = createGain(ctx, 0.08)
  
  osc.type = 'square'
  osc.frequency.setValueAtTime(1000 + Math.random() * 200, ctx.currentTime)
  
  gain.gain.setValueAtTime(0.08, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02)
  
  osc.connect(gain)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.02)
}

// 滑动音效 - 平滑扫过
function playSwipeSound(ctx: AudioContext): void {
  const osc = ctx.createOscillator()
  const gain = createGain(ctx, 0.08)
  
  osc.type = 'sine'
  osc.frequency.setValueAtTime(300, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.15)
  
  gain.gain.setValueAtTime(0.001, ctx.currentTime)
  gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.05)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
  
  osc.connect(gain)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.15)
}

// 通知音效 - 双音提示
function playNotificationSound(ctx: AudioContext): void {
  const playNote = (freq: number, startTime: number) => {
    const osc = ctx.createOscillator()
    const gain = createGain(ctx, 0.15)
    
    osc.type = 'sine'
    osc.frequency.value = freq
    
    gain.gain.setValueAtTime(0.15, startTime)
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.12)
    
    osc.connect(gain)
    osc.start(startTime)
    osc.stop(startTime + 0.12)
  }
  
  playNote(880, ctx.currentTime)
  playNote(1100, ctx.currentTime + 0.1)
}

// 庆祝音效 - 上升和弦
function playCelebrationSound(ctx: AudioContext): void {
  const notes = [523.25, 659.25, 783.99] // C5, E5, G5
  
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const gain = createGain(ctx, 0.1)
    
    osc.type = 'sine'
    osc.frequency.value = freq
    
    const startTime = ctx.currentTime + i * 0.05
    gain.gain.setValueAtTime(0.1, startTime)
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2)
    
    osc.connect(gain)
    osc.start(startTime)
    osc.stop(startTime + 0.2)
  })
}

// 警告音效 - 低频警示
function playCautionSound(ctx: AudioContext): void {
  const osc = ctx.createOscillator()
  const gain = createGain(ctx, 0.15)
  
  osc.type = 'sawtooth'
  osc.frequency.setValueAtTime(200, ctx.currentTime)
  osc.frequency.setValueAtTime(180, ctx.currentTime + 0.1)
  
  gain.gain.setValueAtTime(0.15, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
  
  osc.connect(gain)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.2)
}

// 禁用音效 - 沉闷的拒绝音
function playDisabledSound(ctx: AudioContext): void {
  const osc = ctx.createOscillator()
  const gain = createGain(ctx, 0.1)
  
  osc.type = 'sine'
  osc.frequency.setValueAtTime(150, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1)
  
  gain.gain.setValueAtTime(0.1, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)
  
  osc.connect(gain)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.1)
}

// 上升过渡音效
function playTransitionUpSound(ctx: AudioContext): void {
  const osc = ctx.createOscillator()
  const gain = createGain(ctx, 0.1)
  
  osc.type = 'sine'
  osc.frequency.setValueAtTime(300, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.15)
  
  gain.gain.setValueAtTime(0.1, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
  
  osc.connect(gain)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.15)
}

// 下降过渡音效
function playTransitionDownSound(ctx: AudioContext): void {
  const osc = ctx.createOscillator()
  const gain = createGain(ctx, 0.1)
  
  osc.type = 'sine'
  osc.frequency.setValueAtTime(900, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.15)
  
  gain.gain.setValueAtTime(0.1, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
  
  osc.connect(gain)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.15)
}

// 进度循环音效（简化版，单次播放）
function playProgressLoopSound(ctx: AudioContext): void {
  const osc = ctx.createOscillator()
  const gain = createGain(ctx, 0.08)
  
  osc.type = 'sine'
  osc.frequency.setValueAtTime(440, ctx.currentTime)
  osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.3)
  osc.frequency.linearRampToValueAtTime(440, ctx.currentTime + 0.6)
  
  gain.gain.setValueAtTime(0.08, ctx.currentTime)
  gain.gain.setValueAtTime(0.08, ctx.currentTime + 0.5)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
  
  osc.connect(gain)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.6)
}

// 铃声循环音效（简化版，单次播放）
function playRingtoneLoopSound(ctx: AudioContext): void {
  const notes = [880, 988, 880, 784]
  
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const gain = createGain(ctx, 0.12)
    
    osc.type = 'sine'
    osc.frequency.value = freq
    
    const startTime = ctx.currentTime + i * 0.15
    gain.gain.setValueAtTime(0.12, startTime)
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.12)
    
    osc.connect(gain)
    osc.start(startTime)
    osc.stop(startTime + 0.12)
  })
}

// 音效播放函数映射
const soundFunctions: Record<SoundType, (ctx: AudioContext) => void> = {
  tap: playTapSound,
  button: playButtonSound,
  select: playSelectSound,
  toggle_on: playToggleOnSound,
  toggle_off: playToggleOffSound,
  type: playTypeSound,
  swipe: playSwipeSound,
  notification: playNotificationSound,
  celebration: playCelebrationSound,
  caution: playCautionSound,
  disabled: playDisabledSound,
  transition_up: playTransitionUpSound,
  transition_down: playTransitionDownSound,
  progress_loop: playProgressLoopSound,
  ringtone_loop: playRingtoneLoopSound,
}

// 播放音效
function playSound(type: SoundType): void {
  if (!soundEnabled.value) {
    return
  }
  
  try {
    const ctx = getAudioContext()
    if (!ctx) {
      return
    }
    
    const fn = soundFunctions[type]
    if (fn) {
      fn(ctx)
    }
  } catch {
    // 静默处理错误
  }
}

// ========================================
// 兼容旧 API 的音效类型（映射到新类型）
// ========================================
export type LegacySoundType = 
  | 'click'
  | 'success'  
  | 'error'
  | 'pop'
  | 'whoosh'
  | 'toggle'
  | 'hover'
  | 'complete'
  | 'warning'
  | 'typing'
  | 'coin'
  | 'levelup'
  | 'bubble'
  | 'sweep'
  | 'ding'
  | 'chime'
  | 'bounce'
  | 'unlock'
  | 'close'

// 旧 API 映射
const legacyMap: Record<LegacySoundType, SoundType> = {
  click: 'tap',
  success: 'celebration',
  error: 'caution',
  pop: 'button',
  whoosh: 'swipe',
  toggle: 'toggle_on',
  hover: 'tap',
  complete: 'celebration',
  warning: 'caution',
  typing: 'type',
  coin: 'celebration',
  levelup: 'celebration',
  bubble: 'button',
  sweep: 'swipe',
  ding: 'notification',
  chime: 'notification',
  bounce: 'transition_up',
  unlock: 'celebration',
  close: 'transition_down',
}

// 兼容旧 API 的播放方法
function playLegacySound(type: LegacySoundType): void {
  const mappedType = legacyMap[type]
  playSound(mappedType)
}

// ========================================
// 导出 composable
// ========================================
export function useSound() {
  return {
    soundEnabled,
    playSound,
    playLegacySound,
    toggleSound: () => {
      soundEnabled.value = !soundEnabled.value
    },
    setSoundEnabled: (enabled: boolean) => {
      soundEnabled.value = enabled
    },
  }
}

// ========================================
// 导出便捷方法
// ========================================
export const playTap = () => playSound('tap')
export const playButton = () => playSound('button')
export const playSelect = () => playSound('select')
export const playToggleOn = () => playSound('toggle_on')
export const playToggleOff = () => playSound('toggle_off')
export const playType = () => playSound('type')
export const playSwipe = () => playSound('swipe')
export const playNotification = () => playSound('notification')
export const playCelebration = () => playSound('celebration')
export const playCaution = () => playSound('caution')
export const playDisabled = () => playSound('disabled')
export const playTransitionUp = () => playSound('transition_up')
export const playTransitionDown = () => playSound('transition_down')
export const playProgressLoop = () => playSound('progress_loop')
export const playRingtoneLoop = () => playSound('ringtone_loop')

// ========================================
// 兼容旧 API 的便捷方法
// ========================================
export const playClick = () => playLegacySound('click')
export const playSuccess = () => playLegacySound('success')
export const playError = () => playLegacySound('error')
export const playPop = () => playLegacySound('pop')
export const playWhoosh = () => playLegacySound('whoosh')
export const playToggle = () => playLegacySound('toggle')
export const playHover = () => playLegacySound('hover')
export const playComplete = () => playLegacySound('complete')
export const playWarning = () => playLegacySound('warning')
export const playTyping = () => playLegacySound('typing')
export const playCoin = () => playLegacySound('coin')
export const playLevelup = () => playLegacySound('levelup')
export const playBubble = () => playLegacySound('bubble')
export const playSweep = () => playLegacySound('sweep')
export const playDing = () => playLegacySound('ding')
export const playChime = () => playLegacySound('chime')
export const playBounce = () => playLegacySound('bounce')
export const playUnlock = () => playLegacySound('unlock')
export const playClose = () => playLegacySound('close')
