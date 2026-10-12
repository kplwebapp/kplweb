import { apiClient } from './client';
import type { ApiEnvelope } from './contentApi';

export type ActivityKind = 'TOURNAMENT' | 'EVENT';
export type ActivityStatus = 'UPCOMING' | 'ONGOING' | 'PAST';

export interface Category {
  category_id: number;
  kind: ActivityKind;
  name: string;
  slug: string;
  display_order: number;
  is_active: boolean;
}

/** A tournament or an event (both are stored in the same table, told apart by `kind`). */
export interface Activity {
  event_id: number;
  kind: ActivityKind;
  category_id: number | null;
  category_name: string | null;
  category_slug: string | null;
  title: string;
  slug: string;
  description: string | null;
  event_date: string | null;
  end_date: string | null;
  days: number | null;
  status: ActivityStatus;
  venue: string | null;
  image_url: string | null;
  is_archived: boolean;
}

export type ActivityInput = {
  category_id: number;
  title: string;
  description: string;
  event_date: string;
  end_date: string;
  venue: string;
};

export interface RegisteredPlayer {
  registration_id: number;
  status: string;
  registered_at: string;
  user_id: number;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  email: string;
  mobile: string | null;
  vibhaag: string | null;
  cricket_skills: Record<string, string | number> | null;
}

type ManageFilters = {
  kind: ActivityKind;
  categoryId?: number;
  status?: ActivityStatus;
  archived?: boolean;
};

const toQuery = (params: Record<string, string | number | boolean | undefined>) =>
  Object.entries(params)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
    .join('&');

export const activitiesApi = {
  listPublic: (kind: ActivityKind, includePast = false) =>
    apiClient.get<ApiEnvelope<Activity[]>>(`/events?kind=${kind}${includePast ? '&include_past=true' : ''}`),

  getBySlug: (slug: string) =>
    apiClient.get<ApiEnvelope<Activity>>(`/events/slug/${encodeURIComponent(slug)}`),
};

export const adminActivitiesApi = {
  listCategories: (kind: ActivityKind) =>
    apiClient.get<ApiEnvelope<Category[]>>(`/categories/manage?kind=${kind}`),

  createCategory: (kind: ActivityKind, name: string) =>
    apiClient.post<ApiEnvelope<Category>>('/categories', { kind, name }),

  updateCategory: (id: number, body: Partial<Pick<Category, 'name' | 'display_order' | 'is_active'>>) =>
    apiClient.put<ApiEnvelope<Category>>(`/categories/${id}`, body),

  list: ({ kind, categoryId, status, archived }: ManageFilters) =>
    apiClient.get<ApiEnvelope<Activity[]>>(
      `/events/manage?${toQuery({ kind, category_id: categoryId, status, archived })}`,
    ),

  get: (id: number) => apiClient.get<ApiEnvelope<Activity>>(`/events/${id}`),

  create: (kind: ActivityKind, body: ActivityInput) =>
    apiClient.post<ApiEnvelope<Activity>>('/events', { ...body, kind }),

  update: (id: number, body: Partial<ActivityInput>) =>
    apiClient.put<ApiEnvelope<Activity>>(`/events/${id}`, body),

  uploadImage: (id: number, file: File) =>
    apiClient.upload<ApiEnvelope<Activity>>(`/events/${id}/image`, file, 'image'),

  removeImage: (id: number) =>
    apiClient.delete<ApiEnvelope<Activity>>(`/events/${id}/image`),

  archive: (id: number) =>
    apiClient.patch<ApiEnvelope<Activity>>(`/events/${id}/archive`, {}),

  restore: (id: number) =>
    apiClient.patch<ApiEnvelope<Activity>>(`/events/${id}/restore`, {}),

  remove: (id: number) =>
    apiClient.delete<ApiEnvelope<null>>(`/events/${id}`),

  listRegistrations: (id: number) =>
    apiClient.get<ApiEnvelope<{ tournament: Activity; players: RegisteredPlayer[] }>>(
      `/events/${id}/registrations`,
    ),
};
