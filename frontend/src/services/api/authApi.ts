import { apiClient } from './client';

export type AuthUser = {
  user_id: number;
  email: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  profile_photo_url?: string | null;
  roles: string[];
  permissions?: string[];
};

export type AuthResponse = {
  success: boolean;
  data: {
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
  };
};

export type LoginSession = {
  session_id: string;
  client_type: 'web' | 'admin' | 'mobile' | string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  last_seen_at: string;
  expires_at: string;
  is_current: boolean;
};

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<AuthResponse>('/auth/login', { email, password }),

  /** Admin panel sign-in; rejects accounts without a staff role. */
  adminLogin: (email: string, password: string) =>
    apiClient.post<AuthResponse>('/auth/admin/login', { email, password }),

  register: (payload: {
    firstName: string;
    middleName?: string;
    lastName: string;
    email: string;
    password: string;
    mobile?: string;
    dateOfBirth?: string;
    vibhaag?: string;
    bloodGroup?: string;
  }) => apiClient.post<AuthResponse>('/auth/register', payload),

  me: () => apiClient.get<{ data: AuthUser }>('/auth/me'),

  refresh: (refreshToken: string) =>
    apiClient.post<{ data: { accessToken: string; refreshToken: string } }>('/auth/refresh', {
      refreshToken,
    }),

  listSessions: () => apiClient.get<{ data: LoginSession[] }>('/auth/sessions'),

  logout: () => apiClient.post<{ data: { revoked: boolean } }>('/auth/logout', {}),

  logoutAll: (keepCurrent = true) =>
    apiClient.post<{ data: { revoked: number } }>('/auth/logout-all', { keepCurrent }),

  revokeSession: (sessionId: string) =>
    apiClient.delete<{ data: { revoked: boolean } }>(`/auth/sessions/${sessionId}`),
};
