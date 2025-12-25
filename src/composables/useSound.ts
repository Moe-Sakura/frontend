/**
 * 音效管理 composable
 * 使用 snd-lib 提供精心设计的 UI 音效
 * https://snd.dev/
 */

import { ref } from 'vue'
import Snd from 'snd-lib'

// 音效是否启用
const soundEnabled = ref(true)

// snd-lib 实例（单例）
let sndInstance: Snd | null = null
let isLoaded = false
let isLoading = false

// 当前音效套件
const currentKit = ref<'SND01' | 'SND02'>('SND01')

// 获取或创建 snd 实例
async function getSnd(): Promise<Snd | null> {
  if (!soundEnabled.value) {
    return null
  }
  
  if (sndInstance && isLoaded) {
    return sndInstance
  }
  
  if (isLoading) {
    // 等待加载完成
    return new Promise((resolve) => {
      const check = setInterval(() => {
        if (isLoaded) {
          clearInterval(check)
          resolve(sndInstance)
        }
      }, 50)
    })
  }
  
  try {
    isLoading = true
    sndInstance = new Snd()
  
    // 加载音效套件
    const kit = currentKit.value === 'SND01' ? Snd.KITS.SND01 : Snd.KITS.SND02
    await sndInstance.load(kit)
    
    isLoaded = true
    isLoading = false
    return sndInstance
  } catch (error) {
    console.warn('[Sound] Failed to load snd-lib:', error)
    isLoading = false
    return null
  }
}

// 预加载音效（可选，用于首次交互前预热）
async function preloadSounds(): Promise<void> {
  await getSnd()
}

// 切换音效套件
async function switchKit(kit: 'SND01' | 'SND02'): Promise<void> {
  if (currentKit.value === kit) {
    return
  }
  
  currentKit.value = kit
  isLoaded = false
  
  if (sndInstance) {
    try {
      const sndKit = kit === 'SND01' ? Snd.KITS.SND01 : Snd.KITS.SND02
      await sndInstance.load(sndKit)
      isLoaded = true
    } catch (error) {
      console.warn('[Sound] Failed to switch kit:', error)
    }
  }
}

// ========================================
// 音效类型定义（对应 snd-lib 的 SOUNDS）
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

// 音效类型映射到 snd-lib 的 SOUNDS
const soundMap: Record<SoundType, keyof typeof Snd.SOUNDS> = {
  tap: 'TAP',
  button: 'BUTTON',
  select: 'SELECT',
  toggle_on: 'TOGGLE_ON',
  toggle_off: 'TOGGLE_OFF',
  type: 'TYPE',
  swipe: 'SWIPE',
  notification: 'NOTIFICATION',
  celebration: 'CELEBRATION',
  caution: 'CAUTION',
  disabled: 'DISABLED',
  transition_up: 'TRANSITION_UP',
  transition_down: 'TRANSITION_DOWN',
  progress_loop: 'PROGRESS_LOOP',
  ringtone_loop: 'RINGTONE_LOOP',
}

// 播放音效
async function playSound(type: SoundType): Promise<void> {
  if (!soundEnabled.value) {
    return
  }
  
  try {
    const snd = await getSnd()
    if (!snd) {
      return
    }
    
    const soundKey = soundMap[type]
    const sound = Snd.SOUNDS[soundKey]
    
    if (sound) {
      snd.play(sound)
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
async function playLegacySound(type: LegacySoundType): Promise<void> {
  const mappedType = legacyMap[type]
  return playSound(mappedType)
}

// ========================================
// 导出 composable
// ========================================
export function useSound() {
  return {
    soundEnabled,
    currentKit,
    playSound,
    playLegacySound,
    preloadSounds,
    switchKit,
    toggleSound: () => {
      soundEnabled.value = !soundEnabled.value
    },
    setSoundEnabled: (enabled: boolean) => {
      soundEnabled.value = enabled
    },
  }
}

// ========================================
// 导出便捷方法（使用 snd-lib 原生音效）
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
