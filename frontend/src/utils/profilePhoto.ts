import type { SyntheticEvent } from 'react';
import defaultAvatar from '@/assets/default-avatar.svg';

export const getUploadBaseUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  return apiUrl.replace(/\/api\/?$/, '');
};

const normalizeUploadPath = (path: string) => (path.startsWith('/') ? path : `/${path}`);

/**
 * Resolves a stored profile photo path to a displayable URL.
 * Returns the default avatar when path is null/empty.
 * Uses same-origin /uploads paths in dev (Vite proxy) to avoid cross-origin embedding issues.
 */
export const getProfilePhotoUrl = (
  path: string | null | undefined,
  cacheBust?: string | number,
): string => {
  if (!path || !path.trim()) {
    return defaultAvatar;
  }

  let url: string;
  if (path.startsWith('http://') || path.startsWith('https://')) {
    url = path;
  } else if (path.startsWith('/uploads/') && import.meta.env.DEV) {
    url = normalizeUploadPath(path);
  } else {
    url = `${getUploadBaseUrl()}${normalizeUploadPath(path)}`;
  }

  if (cacheBust != null && cacheBust !== '') {
    const separator = url.includes('?') ? '&' : '?';
    url = `${url}${separator}v=${encodeURIComponent(String(cacheBust))}`;
  }

  return url;
};

export const handleProfilePhotoError = (event: SyntheticEvent<HTMLImageElement>) => {
  event.currentTarget.onerror = null;
  event.currentTarget.src = defaultAvatar;
};

/** @deprecated Use getProfilePhotoUrl instead */
export const resolvePhotoUrl = (path: string | null | undefined) => {
  if (!path) return null;
  return getProfilePhotoUrl(path);
};
