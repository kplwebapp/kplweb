import { apiClient } from './client';

export type AuthUser = {
  user_id: number;
  email: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  profile_photo_url?: string | null;
  roles: string[];
};

export type AuthResponse = {
  success: boolean;
  data: {
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
  };
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
};
