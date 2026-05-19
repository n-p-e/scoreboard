import { createSignal } from "solid-js"

export function createAsyncAction<Args extends unknown[], Result>(
  fn: (...args: Args) => Promise<Result>
) {
  const [loading, setLoading] = createSignal(false)
  const [error, setError] = createSignal<Error | null>(null)
  const [result, setResult] = createSignal<Result | null>(null)

  const run = async (...args: Args): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      const res: Result = await fn(...args)
      setResult(() => res)
    } catch (e) {
      console.error(e)
      setError(e instanceof Error ? e : new Error(String(e)))
    } finally {
      setLoading(false)
    }
  }

  return {
    run,
    get loading() {
      return loading()
    },
    get error() {
      return error()
    },
    get result() {
      return result()
    },
  }
}
