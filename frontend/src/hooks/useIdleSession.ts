import { useCallback, useEffect, useRef } from 'react'

/** Minutes of no activity before the session ends. */
export const SESSION_IDLE_MINUTES = Math.max(
  1,
  Number(import.meta.env.VITE_SESSION_IDLE_MINUTES) || 15,
)

/** Seconds before idle when the “stay logged in?” warning appears. */
export const SESSION_WARN_SECONDS = Math.max(
  15,
  Number(import.meta.env.VITE_SESSION_WARN_SECONDS) || 60,
)

const IDLE_MS = SESSION_IDLE_MINUTES * 60 * 1000
/** Never warn longer than the idle window (leave at least 5s of idle after warn). */
const WARN_MS = Math.min(SESSION_WARN_SECONDS * 1000, Math.max(5_000, IDLE_MS - 5_000))
const IDLE_CHECK_MS = 30_000
const WARN_CHECK_MS = 1_000
const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click', 'wheel'] as const

export type IdleSessionOptions = {
  /** Fired once when the warning window opens; `secondsLeft` until forced sign-out. */
  onWarn?: (secondsLeft: number) => void
  /** Fired each second while the warning is open. */
  onWarnTick?: (secondsLeft: number) => void
  /** Fired when idle time is fully exhausted (or after the user declines to stay). */
  onIdle: () => void
}

/**
 * Tracks inactivity. Warns shortly before timeout; `stayLoggedIn()` resets the timer.
 * While a warning is open, background activity is ignored until the user chooses.
 */
export function useIdleSession(enabled: boolean, { onWarn, onWarnTick, onIdle }: IdleSessionOptions) {
  const onWarnRef = useRef(onWarn)
  const onWarnTickRef = useRef(onWarnTick)
  const onIdleRef = useRef(onIdle)
  onWarnRef.current = onWarn
  onWarnTickRef.current = onWarnTick
  onIdleRef.current = onIdle

  const lastActivityRef = useRef(Date.now())
  const warningActiveRef = useRef(false)
  const idleFiredRef = useRef(false)
  const timerRef = useRef<number | null>(null)

  const clearTimer = () => {
    if (timerRef.current != null) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const stayLoggedIn = useCallback(() => {
    warningActiveRef.current = false
    idleFiredRef.current = false
    lastActivityRef.current = Date.now()
  }, [])

  useEffect(() => {
    if (!enabled) {
      clearTimer()
      warningActiveRef.current = false
      idleFiredRef.current = false
      return
    }

    const secondsLeft = () =>
      Math.max(0, Math.ceil((lastActivityRef.current + IDLE_MS - Date.now()) / 1000))

    const schedule = (ms: number) => {
      clearTimer()
      timerRef.current = window.setInterval(check, ms)
    }

    const fireIdle = () => {
      if (idleFiredRef.current) return
      idleFiredRef.current = true
      warningActiveRef.current = false
      clearTimer()
      onIdleRef.current()
    }

    const check = () => {
      if (idleFiredRef.current) return
      const idleFor = Date.now() - lastActivityRef.current

      if (idleFor >= IDLE_MS) {
        fireIdle()
        return
      }

      if (idleFor >= IDLE_MS - WARN_MS) {
        const left = secondsLeft()
        if (!warningActiveRef.current) {
          warningActiveRef.current = true
          onWarnRef.current?.(left)
          schedule(WARN_CHECK_MS)
        }
        onWarnTickRef.current?.(left)
        return
      }

      if (warningActiveRef.current) {
        // Activity reset cleared the warn window.
        warningActiveRef.current = false
        schedule(IDLE_CHECK_MS)
      }
    }

    const markActive = () => {
      if (warningActiveRef.current || idleFiredRef.current) return
      lastActivityRef.current = Date.now()
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        if (!warningActiveRef.current) markActive()
        else check()
      } else {
        check()
      }
    }

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, markActive, { passive: true })
    }
    document.addEventListener('visibilitychange', onVisibility)

    lastActivityRef.current = Date.now()
    warningActiveRef.current = false
    idleFiredRef.current = false
    schedule(IDLE_CHECK_MS)

    return () => {
      clearTimer()
      document.removeEventListener('visibilitychange', onVisibility)
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, markActive)
      }
    }
  }, [enabled])

  return { stayLoggedIn }
}
