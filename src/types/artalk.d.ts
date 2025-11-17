declare module 'artalk/dist/Artalk.mjs' {
  interface ArtalkConfig {
    el: string | HTMLElement
    pageKey: string
    pageTitle?: string
    server: string
    site: string
    [key: string]: any
  }

  interface ArtalkInstance {
    destroy(): void
    update(config?: Partial<ArtalkConfig>): void
    reload(): void
    [key: string]: any
  }

  class Artalk {
    static init(config: ArtalkConfig): ArtalkInstance
  }

  export default Artalk
}

