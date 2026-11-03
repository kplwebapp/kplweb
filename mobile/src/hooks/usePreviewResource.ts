import { useCallback, useState } from 'react'

/** Simulates pull-to-refresh for Phase 1 fixtures. */
export function usePreviewRefresh(delayMs = 600) {
  const [refreshing, setRefreshing] = useState(false)
  const onRefresh = useCallback(() => {
    setRefreshing(true)
    const timer = setTimeout(() => setRefreshing(false), delayMs)
    return () => clearTimeout(timer)
  }, [delayMs])
  return { refreshing, onRefresh }
}
