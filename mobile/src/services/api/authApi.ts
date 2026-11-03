import { apiRequest } from './client'

export type AuthUser = {
  user_id: number
  email: string
  full_name?: string | null
  first_name?: string | null
  last_name?: string | null
  mobile?: string | null
  is_active?: boolean
  roles?: string[]
}

export type AuthTokens = {
  accessToken: string
  refreshToken: string
}

export type RegisterInput = {
  firstName: string
  middleName: string
  lastName: string
  email: string
  mobile: string
  dateOfBirth: string
  vibhaag: string
  bloodGroup: string
  password: string
}

export const authApi = {
  requestOtp: (mobile: string) =>
    apiRequest<{ mobile: string; expiresInMinutes: number; message: string; devOtp?: string }>(
      '/auth/otp/request',
      { method: 'POST', body: { mobile } },
    ),

  verifyOtp: (mobile: string, otp: string) =>
    apiRequest<AuthTokens & { user: AuthUser }>('/auth/otp/verify', {
      method: 'POST',
      body: { mobile, otp },
    }),

  register: (body: RegisterInput) =>
    apiRequest<{ user: AuthUser; pendingApproval: boolean }>('/auth/register', {
      method: 'POST',
      body,
    }),

  me: (token: string) => apiRequest<AuthUser>('/auth/me', { token }),

  refresh: (refreshToken: string) =>
    apiRequest<AuthTokens>('/auth/refresh', { method: 'POST', body: { refreshToken } }),
}
