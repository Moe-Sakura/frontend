declare module 'artalk/dist/Artalk.mjs' {
  interface ArtalkConfig {
    el: string | HTMLElement
    pageKey: string
    pageTitle?: string
    server: string
    site: string
    darkMode?: 'auto' | boolean
    locale?: string
    placeholder?: string
    noComment?: string
    sendBtn?: string
    emoticons?: string | boolean | object
    vote?: boolean
    voteDown?: boolean
    uaBadge?: boolean
    listSort?: boolean
    preview?: boolean
    countEl?: string | boolean
    pvEl?: string | boolean
    statPageKeyAttr?: string
    heightLimit?: {
      content?: number
      children?: number
      scrollable?: boolean
    }
    imgUpload?: boolean
    reqTimeout?: number
    flatMode?: boolean | 'auto'
    nestMax?: number
    nestSort?: 'DATE_ASC' | 'DATE_DESC'
    marked?: boolean
    imgLazyLoad?: boolean | 'native' | 'data-src'
    dateFormatter?: (date: Date) => string
    avatarURLBuilder?: (comment: unknown) => string
    useBackendConf?: boolean
  }

  interface ArtalkInstance {
    destroy(): void
    update(config?: Partial<ArtalkConfig>): void
    reload(): void
    on(event: string, callback: (...args: unknown[]) => void): void
    off(event: string, callback?: (...args: unknown[]) => void): void
    trigger(event: string, ...args: unknown[]): void
    setDarkMode(darkMode: boolean | 'auto'): void
    getCommentCount(): number
    getComments(): unknown[]
  }

  class Artalk {
    static init(config: ArtalkConfig): ArtalkInstance
  }

  export default Artalk
}

