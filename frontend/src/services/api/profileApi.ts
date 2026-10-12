import { apiClient } from './client';

export { getProfilePhotoUrl, getUploadBaseUrl, handleProfilePhotoError, resolvePhotoUrl } from '@/utils/profilePhoto';

export type MemberProfile = {
  user_id: number;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  full_name: string;
  email: string;
  mobile: string | null;
  date_of_birth: string | null;
  vibhaag: string | null;
  blood_group: string | null;
  profile_photo_url: string | null;
  roles: string[];
};

export type ProfileChangeRequest = {
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
};

export type VibhaagChangeInitResponse = {
  message: string;
  expires_at: string;
  pending_vibhaag: string;
  old_vibhaag: string | null;
};

export type PersonaProfile = {
  persona_profile_id: number;
  persona_type: string;
  persona_label: string;
  answers: Record<string, string | number>;
  created_at: string;
  updated_at: string;
};

export type PersonaFieldDef = {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select';
  options?: string[];
};

export type PersonaTypeDef = {
  type: string;
  label: string;
  fields: PersonaFieldDef[];
};

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  message?: string;
};

export const profileApi = {
  get: () => apiClient.get<ApiEnvelope<MemberProfile>>('/profile'),

  uploadPhoto: (file: File) =>
    apiClient.upload<ApiEnvelope<{ profile_photo_url: string }>>('/profile/photo', file, 'photo'),

  initiateVibhaagChange: (vibhaag: string) =>
    apiClient.post<ApiEnvelope<VibhaagChangeInitResponse>>('/profile/change-request/vibhaag', { vibhaag }),

  verifyOtp: (payload: { vibhaag: string; otp?: string; emailOtp?: string; mobileOtp?: string }) =>
    apiClient.post<ApiEnvelope<ProfileChangeRequest>>('/profile/verify-otp', payload),

  getPendingChanges: () =>
    apiClient.get<ApiEnvelope<ProfileChangeRequest[]>>('/profile/pending-changes'),

  getPersonaDefinitions: () =>
    apiClient.get<ApiEnvelope<{ types: PersonaTypeDef[] }>>('/profile/personas/definitions'),

  listPersonaProfiles: () =>
    apiClient.get<ApiEnvelope<PersonaProfile[]>>('/profile/personas'),

  createPersonaProfile: (body: { persona_type: string; answers: Record<string, string | number> }) =>
    apiClient.post<ApiEnvelope<PersonaProfile>>('/profile/personas', body),

  updatePersonaProfile: (id: number, body: { answers: Record<string, string | number> }) =>
    apiClient.patch<ApiEnvelope<PersonaProfile>>(`/profile/personas/${id}`, body),

  deletePersonaProfile: (id: number) =>
    apiClient.delete<ApiEnvelope<null>>(`/profile/personas/${id}`),
};
