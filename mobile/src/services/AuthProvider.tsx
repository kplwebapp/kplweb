import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { authApi, type AuthUser } from '@/services/api/authApi'
import { authStorage } from '@/services/authStorage'
import { ApiClientError } from '@/services/api/client'

type AuthStatus = 'loading' | 'anonymous' | 'authenticated'

type AuthContextValue = {
  status: AuthStatus
  user: AuthUser | null
  accessToken: string | null
  welcomeSeen: boolean
  markWelcomeSeen: () => Promise<void>
  signInWithTokens: (accessToken: string, refreshToken: string, user?: AuthUser | null) => Promise<void>
  signOut: () => Promise<void>
  refreshSession: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<AuthUser | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [welcomeSeen, setWelcomeSeen] = useState(false)

  const bootstrap = useCallback(async () => {
    // In Expo Go / local builds, always land on welcome so the animation is easy to review.
    if (__DEV__) {
      await authStorage.clearWelcomeSeen()
      setWelcomeSeen(false)
    } else {
      const seen = await authStorage.getWelcomeSeen()
      setWelcomeSeen(seen)
    }
    const tokens = await authStorage.getTokens()
    if (!tokens.accessToken) {
      setStatus('anonymous')
      return
    }
    try {
      const me = await authApi.me(tokens.accessToken)
      setAccessToken(tokens.accessToken)
      setUser(me.data)
      setStatus('authenticated')
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 401 && tokens.refreshToken) {
        try {
          const refreshed = await authApi.refresh(tokens.refreshToken)
          await authStorage.setTokens(refreshed.data.accessToken, refreshed.data.refreshToken)
          const me = await authApi.me(refreshed.data.accessToken)
          setAccessToken(refreshed.data.accessToken)
          setUser(me.data)
          setStatus('authenticated')
          return
        } catch {
          /* fall through */
        }
      }
      await authStorage.clearTokens()
      setAccessToken(null)
      setUser(null)
      setStatus('anonymous')
    }
  }, [])

  useEffect(() => {
    bootstrap()
  }, [bootstrap])

  const markWelcomeSeen = useCallback(async () => {
    await authStorage.setWelcomeSeen()
    setWelcomeSeen(true)
  }, [])

  const signInWithTokens = useCallback(
    async (nextAccess: string, nextRefresh: string, nextUser?: AuthUser | null) => {
      await authStorage.setTokens(nextAccess, nextRefresh)
      setAccessToken(nextAccess)
      if (nextUser) {
        setUser(nextUser)
      } else {
        const me = await authApi.me(nextAccess)
        setUser(me.data)
      }
      setStatus('authenticated')
    },
    [],
  )

  const signOut = useCallback(async () => {
    await authStorage.clearTokens()
    await authStorage.clearWelcomeSeen()
    setAccessToken(null)
    setUser(null)
    setWelcomeSeen(false)
    setStatus('anonymous')
  }, [])

  const refreshSession = useCallback(async () => {
    const tokens = await authStorage.getTokens()
    if (!tokens.refreshToken) return false
    try {
      const refreshed = await authApi.refresh(tokens.refreshToken)
      await authStorage.setTokens(refreshed.data.accessToken, refreshed.data.refreshToken)
      setAccessToken(refreshed.data.accessToken)
      return true
    } catch {
      await signOut()
      return false
    }
  }, [signOut])

  const value = useMemo(
    () => ({
      status,
      user,
      accessToken,
      welcomeSeen,
      markWelcomeSeen,
      signInWithTokens,
      signOut,
      refreshSession,
    }),
    [status, user, accessToken, welcomeSeen, markWelcomeSeen, signInWithTokens, signOut, refreshSession],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
