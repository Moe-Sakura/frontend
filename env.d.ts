/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface Window {
  Pace: {
    restart(): void
    options: {
      ajax?: boolean
      document?: boolean
      eventLag?: boolean
      elements?: boolean
      restartOnPushState?: boolean
      restartOnRequestAfter?: boolean
    }
  }
}
