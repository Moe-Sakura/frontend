declare module 'pace-js' {
  interface PaceOptions {
    ajax?: boolean
    document?: boolean
    eventLag?: boolean
    elements?: boolean
    restartOnPushState?: boolean
    restartOnRequestAfter?: boolean
  }

  interface Pace {
    options: PaceOptions
    running: boolean
    start(): void
    stop(): void
    restart(): void
    track(fn: () => void): void
    ignore(fn: () => void): void
  }

  const pace: Pace
  export default pace
}

declare module 'pace-js/themes/blue/pace-theme-flash.css' {
  const content: string
  export default content
}

