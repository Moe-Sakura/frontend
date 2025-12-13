/**
 * 音效管理 composable
 * 提供轻量级的 UI 音效反馈
 * 每次触发都有轻微的随机音调变化
 */

import { ref } from 'vue'

// 音效类型
export type SoundType = 'click' | 'success' | 'error' | 'pop' | 'whoosh' | 'toggle'

// 音效是否启用
const soundEnabled = ref(true)

// 音频上下文（懒加载）
let audioContext: AudioContext | null = null

// 获取音频上下文
function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)()
  }
  return audioContext
}

// 随机音调偏移 (-range 到 +range)
function randomPitch(baseFreq: number, range: number = 0.15): number {
  const offset = (Math.random() - 0.5) * 2 * range
  return baseFreq * (1 + offset)
}

// 从音符序列中随机选择变体
function randomNote(notes: number[]): number {
  return notes[Math.floor(Math.random() * notes.length)]
}

// 播放音效
function playSound(type: SoundType, volume = 0.3) {
  if (!soundEnabled.value) {return}

  try {
    const ctx = getAudioContext()
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    // 根据类型设置不同的音效参数（带随机音调变化）
    switch (type) {
      case 'click': {
        // 清脆的点击音 - 随机选择不同音高
        const clickNotes = [700, 750, 800, 850, 900]
        const baseFreq = randomNote(clickNotes)
        oscillator.frequency.setValueAtTime(baseFreq, ctx.currentTime)
        oscillator.frequency.exponentialRampToValueAtTime(baseFreq * 0.7, ctx.currentTime + 0.05)
        gainNode.gain.setValueAtTime(volume, ctx.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05)
        oscillator.start(ctx.currentTime)
        oscillator.stop(ctx.currentTime + 0.05)
        break
      }

      case 'success': {
        // 上升的成功音 - 随机选择和弦
        const chords = [
          [523, 659, 784],   // C大调 (C-E-G)
          [587, 740, 880],   // D大调 (D-F#-A)
          [659, 831, 988],   // E大调 (E-G#-B)
          [698, 880, 1047],  // F大调 (F-A-C)
        ]
        const chord = chords[Math.floor(Math.random() * chords.length)]
        oscillator.frequency.setValueAtTime(chord[0], ctx.currentTime)
        oscillator.frequency.setValueAtTime(chord[1], ctx.currentTime + 0.1)
        oscillator.frequency.setValueAtTime(chord[2], ctx.currentTime + 0.2)
        gainNode.gain.setValueAtTime(volume, ctx.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
        oscillator.start(ctx.currentTime)
        oscillator.stop(ctx.currentTime + 0.3)
        break
      }

      case 'error': {
        // 低沉的错误音 - 轻微随机
        const baseFreq = randomPitch(200, 0.1)
        oscillator.frequency.setValueAtTime(baseFreq, ctx.currentTime)
        oscillator.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, ctx.currentTime + 0.15)
        gainNode.gain.setValueAtTime(volume, ctx.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15)
        oscillator.start(ctx.currentTime)
        oscillator.stop(ctx.currentTime + 0.15)
        break
      }

      case 'pop': {
        // 气泡弹出音 - 随机选择音高
        const popNotes = [350, 400, 450, 500, 550]
        const baseFreq = randomNote(popNotes)
        oscillator.frequency.setValueAtTime(baseFreq, ctx.currentTime)
        oscillator.frequency.exponentialRampToValueAtTime(baseFreq * 2, ctx.currentTime + 0.03)
        oscillator.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, ctx.currentTime + 0.06)
        gainNode.gain.setValueAtTime(volume * 0.8, ctx.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08)
        oscillator.start(ctx.currentTime)
        oscillator.stop(ctx.currentTime + 0.08)
        break
      }

      case 'whoosh': {
        // 滑动音效 - 随机起始音高
        const startFreqs = [1000, 1100, 1200, 1300, 1400]
        const startFreq = randomNote(startFreqs)
        oscillator.type = 'sawtooth'
        oscillator.frequency.setValueAtTime(startFreq, ctx.currentTime)
        oscillator.frequency.exponentialRampToValueAtTime(startFreq * 0.15, ctx.currentTime + 0.1)
        gainNode.gain.setValueAtTime(volume * 0.5, ctx.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)
        oscillator.start(ctx.currentTime)
        oscillator.stop(ctx.currentTime + 0.1)
        break
      }

      case 'toggle': {
        // 开关切换音 - 随机音程
        const togglePairs = [
          [500, 750],   // 五度
          [550, 825],   // 五度变体
          [600, 900],   // 五度
          [500, 800],   // 大六度
          [600, 1000],  // 大六度变体
        ]
        const pair = togglePairs[Math.floor(Math.random() * togglePairs.length)]
        oscillator.frequency.setValueAtTime(pair[0], ctx.currentTime)
        oscillator.frequency.setValueAtTime(pair[1], ctx.currentTime + 0.05)
        gainNode.gain.setValueAtTime(volume * 0.6, ctx.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)
        oscillator.start(ctx.currentTime)
        oscillator.stop(ctx.currentTime + 0.1)
        break
      }
    }
  } catch {
    // 静默处理音频播放失败
  }
}

// 导出 composable
export function useSound() {
  return {
    soundEnabled,
    playSound,
    toggleSound: () => {
      soundEnabled.value = !soundEnabled.value
    },
    setSoundEnabled: (enabled: boolean) => {
      soundEnabled.value = enabled
    },
  }
}

// 导出便捷方法
export const playClick = () => playSound('click')
export const playSuccess = () => playSound('success')
export const playError = () => playSound('error')
export const playPop = () => playSound('pop')
export const playWhoosh = () => playSound('whoosh')
export const playToggle = () => playSound('toggle')

