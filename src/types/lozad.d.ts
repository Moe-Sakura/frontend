declare module 'lozad' {
  interface LozadOptions {
    /** Root element for intersection observer */
    root?: Element | null
    /** Margin around the root element */
    rootMargin?: string
    /** Intersection threshold (0 to 1) */
    threshold?: number | number[]
    /** Enable auto reload for dynamically added elements */
    enableAutoReload?: boolean
    /** Callback when element is loaded */
    loaded?: (el: Element) => void
    /** Custom load function */
    load?: (el: Element) => void
  }

  interface LozadObserver {
    /** Start observing elements */
    observe(): void
    /** Trigger load for specific element */
    triggerLoad(el: Element): void
    /** Access the IntersectionObserver instance */
    observer: IntersectionObserver
  }

  /**
   * Creates a lozad observer instance
   * @param selector - CSS selector or NodeList of elements to observe
   * @param options - Configuration options
   */
  function lozad(
    selector?: string | NodeList | Element,
    options?: LozadOptions
  ): LozadObserver

  export default lozad
}

