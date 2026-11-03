/**
 * Non-secret client config. Browse data uses the same backend as the website.
 * Set EXPO_PUBLIC_API_BASE_URL to a LAN IP when testing on a physical phone.
 */
export const APP_NAME = 'Kansara Premier League'
export const APP_SHORT_NAME = 'KPL'
export const TIMEZONE = 'Asia/Kolkata'
export const CURRENCY = 'INR'

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:3001/api'

/** Keep false so Home / Matches / Teams / Auction / Standings match website API data. */
export const USE_PREVIEW_FIXTURES = false

/**
 * Temporary mobile-app allowlist for OTP login.
 * Empty array = any registered mobile (remove this gate when opening to the full community).
 */
export const ALLOWED_LOGIN_MOBILES = ['9726101600'] as const

export function normalizeMobileDigits(value: string) {
  return String(value || '').replace(/\D/g, '')
}

export function isMobileAllowedToLogin(mobile: string) {
  if (ALLOWED_LOGIN_MOBILES.length === 0) return true
  const digits = normalizeMobileDigits(mobile)
  return ALLOWED_LOGIN_MOBILES.some((allowed) => digits === allowed || digits.endsWith(allowed))
}
