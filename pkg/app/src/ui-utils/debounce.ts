import { createEffect, createSignal, onCleanup } from "solid-js"

/**
 * Creates a debounced getter that tracks another signal
 * @param sourceGetter - The source signal getter to track
 * @param delay - Debounce delay in milliseconds (default: 500ms)
 * @returns Debounced getter function
 */
export function createDebouncedGetter<T>(sourceGetter: () => T, delay = 200) {
  const [debouncedValue, setDebouncedValue] = createSignal(sourceGetter())
  let timeoutId: NodeJS.Timeout

  createEffect(() => {
    const currentValue = sourceGetter()

    // Clear existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    // Set new timeout
    timeoutId = setTimeout(() => {
      setDebouncedValue(() => currentValue)
    }, delay)
  })

  // Cleanup timeout on disposal
  onCleanup(() => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  })

  return debouncedValue
}
