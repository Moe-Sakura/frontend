/**
 * 音效管理 composable
 * 使用 Vocaloid Miku 风格的合成音效
 * 特点：高音调、电子合成感、带颤音
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

// Miku 音符频率 (基于 A4 = 440Hz)
const MIKU_NOTES = {
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392.00,
  A4: 440.00,
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  F5: 698.46,
  G5: 783.99,
  A5: 880.00,
  B5: 987.77,
  C6: 1046.50,
}

// 随机选择
function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// 创建 Miku 风格的振荡器（带颤音）
function createMikuOscillator(
  ctx: AudioContext, 
  frequency: number, 
  type: OscillatorType = 'square',
  vibratoDepth: number = 10,
  vibratoRate: number = 6,
): { osc: OscillatorNode; gain: GainNode } {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  
  // 主振荡器 - 使用方波模拟 Vocaloid 音色
  osc.type = type
  osc.frequency.setValueAtTime(frequency, ctx.currentTime)
  
  // 添加颤音 (vibrato) - Miku 特征
  if (vibratoDepth > 0) {
    const vibrato = ctx.createOscillator()
    const vibratoGain = ctx.createGain()
    vibrato.frequency.setValueAtTime(vibratoRate, ctx.currentTime)
    vibratoGain.gain.setValueAtTime(vibratoDepth, ctx.currentTime)
    vibrato.connect(vibratoGain)
    vibratoGain.connect(osc.frequency)
    vibrato.start(ctx.currentTime)
    vibrato.stop(ctx.currentTime + 0.5)
  }
  
  osc.connect(gain)
  
  return { osc, gain }
}

// 播放 Miku 风格音效
function playSound(type: SoundType, volume = 0.25) {
  if (!soundEnabled.value) {return}

  try {
    const ctx = getAudioContext()

    switch (type) {
      case 'click': {
        // Miku 点击音 - 高音「ピッ」
        const notes = [MIKU_NOTES.E5, MIKU_NOTES.F5, MIKU_NOTES.G5, MIKU_NOTES.A5]
        const freq = randomChoice(notes)
        
        const { osc, gain } = createMikuOscillator(ctx, freq, 'square', 5, 8)
        gain.connect(ctx.destination)
        
        gain.gain.setValueAtTime(volume, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.06)
        
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.06)
        break
      }

      case 'success': {
        // Miku 成功音 - 上升琶音「ラララ♪」
        const melodies = [
          [MIKU_NOTES.C5, MIKU_NOTES.E5, MIKU_NOTES.G5, MIKU_NOTES.C6],
          [MIKU_NOTES.D5, MIKU_NOTES.F5, MIKU_NOTES.A5, MIKU_NOTES.D5 * 2],
          [MIKU_NOTES.E5, MIKU_NOTES.G5, MIKU_NOTES.B5, MIKU_NOTES.E5 * 2],
        ]
        const melody = randomChoice(melodies)
        
        melody.forEach((freq, i) => {
          const { osc, gain } = createMikuOscillator(ctx, freq, 'square', 12, 6)
          gain.connect(ctx.destination)
          
          const startTime = ctx.currentTime + i * 0.08
          gain.gain.setValueAtTime(0, startTime)
          gain.gain.linearRampToValueAtTime(volume * 0.8, startTime + 0.02)
          gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.12)
          
          osc.start(startTime)
          osc.stop(startTime + 0.12)
        })
        break
      }

      case 'error': {
        // Miku 错误音 - 下降「えっ？」
        const freq = randomChoice([MIKU_NOTES.A4, MIKU_NOTES.B4])
        
        const { osc, gain } = createMikuOscillator(ctx, freq, 'sawtooth', 15, 4)
        gain.connect(ctx.destination)
        
        osc.frequency.setValueAtTime(freq, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(freq * 0.5, ctx.currentTime + 0.2)
        
        gain.gain.setValueAtTime(volume * 0.7, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2)
        
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.2)
        break
      }

      case 'pop': {
        // Miku 弹出音 - 可爱「ポン♪」
        const notes = [MIKU_NOTES.C5, MIKU_NOTES.D5, MIKU_NOTES.E5, MIKU_NOTES.G5]
        const freq = randomChoice(notes)
        
        const { osc, gain } = createMikuOscillator(ctx, freq * 0.8, 'square', 8, 10)
        gain.connect(ctx.destination)
        
        // 快速上升音调
        osc.frequency.setValueAtTime(freq * 0.8, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(freq * 1.2, ctx.currentTime + 0.03)
        osc.frequency.exponentialRampToValueAtTime(freq, ctx.currentTime + 0.08)
        
        gain.gain.setValueAtTime(volume * 0.9, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)
        
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.1)
        break
      }

      case 'whoosh': {
        // Miku 滑动音 - 快速「シュッ」
        const startFreqs = [MIKU_NOTES.C6, MIKU_NOTES.D5 * 2, MIKU_NOTES.E5 * 2]
        const startFreq = randomChoice(startFreqs)
        
        const { osc, gain } = createMikuOscillator(ctx, startFreq, 'sawtooth', 0, 0)
        gain.connect(ctx.destination)
        
        osc.frequency.setValueAtTime(startFreq, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(startFreq * 0.2, ctx.currentTime + 0.12)
        
        gain.gain.setValueAtTime(volume * 0.5, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12)
        
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.12)
        break
      }

      case 'toggle': {
        // Miku 切换音 - 双音「ピコッ」
        const pairs = [
          [MIKU_NOTES.E5, MIKU_NOTES.A5],
          [MIKU_NOTES.G5, MIKU_NOTES.C6],
          [MIKU_NOTES.D5, MIKU_NOTES.G5],
          [MIKU_NOTES.F5, MIKU_NOTES.B5],
        ]
        const [freq1, freq2] = randomChoice(pairs)
        
        // 第一个音
        const { osc: osc1, gain: gain1 } = createMikuOscillator(ctx, freq1, 'square', 6, 8)
        gain1.connect(ctx.destination)
        gain1.gain.setValueAtTime(volume * 0.7, ctx.currentTime)
        gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05)
        osc1.start(ctx.currentTime)
        osc1.stop(ctx.currentTime + 0.05)
        
        // 第二个音（稍高）
        const { osc: osc2, gain: gain2 } = createMikuOscillator(ctx, freq2, 'square', 6, 8)
        gain2.connect(ctx.destination)
        gain2.gain.setValueAtTime(0, ctx.currentTime + 0.04)
        gain2.gain.linearRampToValueAtTime(volume * 0.8, ctx.currentTime + 0.05)
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12)
        osc2.start(ctx.currentTime + 0.04)
        osc2.stop(ctx.currentTime + 0.12)
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
