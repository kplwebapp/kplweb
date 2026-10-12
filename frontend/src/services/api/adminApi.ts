import { apiClient } from './client';

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface AdminUser {
  user_id: number;
  first_name: string;
  last_name: string;
  full_name: string | null;
  email: string;
  is_active: boolean;
  created_at: string;
}

export interface ProfileChangeRequest {
  request_id: number;
  user_id: number;
  field_name: string;
  old_value: string | null;
  new_value: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  otp_verified_at: string | null;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: number | null;
  user?: {
    first_name: string;
    last_name: string;
    full_name: string | null;
    email: string;
    mobile: string | null;
  };
}

export const adminApi = {
  listUsers: () =>
    apiClient.get<ApiEnvelope<AdminUser[]>>('/users'),

  approveUser: (userId: number) =>
    apiClient.patch<ApiEnvelope<AdminUser>>(`/users/${userId}/approve`, {}),

  rejectUser: (userId: number) =>
    apiClient.patch<ApiEnvelope<AdminUser>>(`/users/${userId}/reject`, {}),

  listProfileChangeRequests: (status: 'PENDING' | 'APPROVED' | 'REJECTED' = 'PENDING') =>
    apiClient.get<ApiEnvelope<ProfileChangeRequest[]>>(`/profile/change-requests?status=${status}`),

  approveProfileChangeRequest: (requestId: number) =>
    apiClient.patch<ApiEnvelope<ProfileChangeRequest>>(`/profile/change-requests/${requestId}/approve`, {}),

  rejectProfileChangeRequest: (requestId: number) =>
    apiClient.patch<ApiEnvelope<ProfileChangeRequest>>(`/profile/change-requests/${requestId}/reject`, {}),
};
