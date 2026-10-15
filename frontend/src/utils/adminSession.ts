import type { AuthUser } from '@/services/api/authApi'

/**
 * The admin panel keeps its own login, separate from the public website's member login
 * (which uses the `accessToken` / `refreshToken` / `user` keys). Signing in or out on one
 * never affects the other.
 */
export const ADMIN_SESSION_KEYS = {
  accessToken: 'kplAdminAccessToken',
  refreshToken: 'kplAdminRefreshToken',
  user: 'kplAdminUser',
} as const

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  TEAM_MANAGER: 'Team Manager',
  SCORER: 'Scorer',
  PLAYER: 'Player',
  VIEWER: 'Viewer',
}

const STAFF_ROLES = new Set(['SUPER_ADMIN', 'ADMIN', 'TEAM_MANAGER', 'SCORER'])

/** Roles allowed into the admin panel (the backend enforces the same list at sign-in). */
export const isStaff = (roles: string[] | undefined) => Boolean(roles?.some((role) => STAFF_ROLES.has(role)))

export const roleLabel = (code: string) =>
  ROLE_LABELS[code] ?? code.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

/** True on /admin pages, whose API calls must carry the admin token instead of the member token. */
export const isAdminArea = () => window.location.pathname === '/admin' || window.location.pathname.startsWith('/admin/')

export const adminSession = {
  getToken: () => localStorage.getItem(ADMIN_SESSION_KEYS.accessToken),

  getUser: (): AuthUser | null => {
    try {
      return JSON.parse(localStorage.getItem(ADMIN_SESSION_KEYS.user) || 'null') as AuthUser | null
    } catch {
      return null
    }
  },

  save: (accessToken: string, refreshToken: string | undefined, user: AuthUser) => {
    localStorage.setItem(ADMIN_SESSION_KEYS.accessToken, accessToken)
    if (refreshToken) localStorage.setItem(ADMIN_SESSION_KEYS.refreshToken, refreshToken)
    else localStorage.removeItem(ADMIN_SESSION_KEYS.refreshToken)
    localStorage.setItem(ADMIN_SESSION_KEYS.user, JSON.stringify(user))
  },

  saveUser: (user: AuthUser) => localStorage.setItem(ADMIN_SESSION_KEYS.user, JSON.stringify(user)),

  clear: () => Object.values(ADMIN_SESSION_KEYS).forEach((key) => localStorage.removeItem(key)),
}
