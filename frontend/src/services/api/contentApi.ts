import { apiClient } from './client';
import type { AboutPageContent } from '@/content/types';

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export type AboutContent = AboutPageContent;

export interface Sponsor {
  sponsor_id: number;
  sponsor_name: string;
  logo_url: string | null;
  website_url: string | null;
  tier: string;
  is_active?: boolean;
  display_order: number;
}

export interface GalleryItem {
  gallery_id: number;
  title: string | null;
  image_url: string;
  caption: string | null;
  category: string;
  uploaded_at?: string;
}

export interface SiteSettings {
  league_name?: string;
  contact_email?: string;
  current_season?: string;
  public_website_url?: string;
  contact_location?: string;
}

export interface ContactMessage {
  contact_message_id: number;
  name: string;
  email: string;
  mobile?: string | null;
  subject: string;
  message?: string;
  status: string;
  submitted_at: string;
}

export const contentApi = {
  getSponsors: () =>
    apiClient.get<ApiEnvelope<Sponsor[]>>('/sponsors'),

  getGallery: () =>
    apiClient.get<ApiEnvelope<GalleryItem[]>>('/gallery'),

  getPublicSettings: () =>
    apiClient.get<ApiEnvelope<SiteSettings>>('/settings/public'),

  submitContact: (body: { name: string; email: string; subject: string; message: string; mobile?: string }) =>
    apiClient.post<ApiEnvelope<ContactMessage>>('/contact', body),
};

export const adminContentApi = {
  listSponsors: () =>
    apiClient.get<ApiEnvelope<Sponsor[]>>('/sponsors/manage'),

  createSponsor: (body: Partial<Sponsor> & { sponsor_name: string }) =>
    apiClient.post<ApiEnvelope<Sponsor>>('/sponsors', body),

  updateSponsor: (id: number, body: Partial<Sponsor>) =>
    apiClient.put<ApiEnvelope<Sponsor>>(`/sponsors/${id}`, body),

  deleteSponsor: (id: number) =>
    apiClient.delete<ApiEnvelope<null>>(`/sponsors/${id}`),

  listGallery: () =>
    apiClient.get<ApiEnvelope<GalleryItem[]>>('/gallery/manage'),

  createGalleryItem: (body: { title?: string; image_url: string; caption?: string; category?: string }) =>
    apiClient.post<ApiEnvelope<GalleryItem>>('/gallery', body),

  deleteGalleryItem: (id: number) =>
    apiClient.delete<ApiEnvelope<null>>(`/gallery/${id}`),

  getSettings: () =>
    apiClient.get<ApiEnvelope<SiteSettings>>('/settings'),

  saveSettings: (body: SiteSettings) =>
    apiClient.put<ApiEnvelope<SiteSettings>>('/settings', body),

  listContactMessages: () =>
    apiClient.get<ApiEnvelope<ContactMessage[]>>('/contact/messages'),

  markContactRead: (id: number) =>
    apiClient.patch<ApiEnvelope<ContactMessage>>(`/contact/messages/${id}`, { status: 'READ' }),
};
