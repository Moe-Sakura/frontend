/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
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
