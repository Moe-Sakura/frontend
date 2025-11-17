// Pace.js 类型声明
interface PaceOptions {
  ajax?: boolean
  document?: boolean
  eventLag?: boolean
  elements?: boolean
  restartOnPushState?: boolean
  restartOnRequestAfter?: boolean
}

interface Pace {
  start(): void
  stop(): void
  restart(): void
  on(event: string, callback: () => void): void
  off(event: string, callback?: () => void): void
  options: PaceOptions
}

interface Window {
  Pace?: Pace
}

