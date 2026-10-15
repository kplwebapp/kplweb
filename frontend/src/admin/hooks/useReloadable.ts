import { useCallback, useEffect, useState } from 'react'

type State<T> = { key: string; token: number; data: T | null; error: string }

/**
 * Loads data for `key` and reloads on demand. While reloading, the previous data stays on screen;
 * `loading` is only true until the first response for the current key arrives.
 * `load` must be stable (wrap it in useCallback). With `keepPrevious`, data for the previous key
 * also stays on screen until the new key's data arrives.
 */
export function useReloadable<T>(load: () => Promise<T>, key: string, keepPrevious = false) {
  const [token, setToken] = useState(0)
  const [state, setState] = useState<State<T> | null>(null)

  useEffect(() => {
    let cancelled = false
    load()
      .then((data) => { if (!cancelled) setState({ key, token, data, error: '' }) })
      .catch((err) => {
        if (!cancelled) setState({ key, token, data: null, error: err instanceof Error ? err.message : 'Failed to load.' })
      })
    return () => { cancelled = true }
  }, [load, key, token])

  const reload = useCallback(() => setToken((t) => t + 1), [])
  const current = state?.key === key ? state : null
  const shown = current ?? (keepPrevious ? state : null)

  return { data: shown?.data ?? null, error: shown?.error ?? '', loading: !current, reload }
}
