import type { SyntheticEvent } from 'react'
import defaultTournamentImage from '@/assets/default-tournament.svg'
import defaultEventImage from '@/assets/default-event.svg'
import type { ActivityKind } from '@/services/api/activitiesApi'
import { getUploadBaseUrl } from '@/utils/profilePhoto'

export const ACTIVITY_IMAGE_MAX_BYTES = 2 * 1024 * 1024
export const ACTIVITY_IMAGE_ACCEPT = '.jpg,.jpeg,.png,.gif,image/jpeg,image/png,image/gif'
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif'])
const ALLOWED_EXTENSIONS = /\.(jpe?g|png|gif)$/i

export const defaultActivityImage = (kind: ActivityKind) =>
  kind === 'TOURNAMENT' ? defaultTournamentImage : defaultEventImage

/** Displayable URL for a stored /uploads path (same-origin in dev via the Vite proxy). */
export function getUploadUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path
  if (path.startsWith('/uploads/') && import.meta.env.DEV) return path
  return `${getUploadBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`
}

/** Uploaded image URL, or the default tournament/event image when none was uploaded. */
export function getActivityImageUrl(path: string | null | undefined, kind: ActivityKind): string {
  return path?.trim() ? getUploadUrl(path) : defaultActivityImage(kind)
}

export const activityImageFallback = (kind: ActivityKind) => (event: SyntheticEvent<HTMLImageElement>) => {
  event.currentTarget.onerror = null
  event.currentTarget.src = defaultActivityImage(kind)
}

/** Returns an error message, or null when the file is acceptable. */
export function validateActivityImage(file: File): string | null {
  if (!ALLOWED_TYPES.has(file.type) || !ALLOWED_EXTENSIONS.test(file.name)) {
    return 'Only JPG, PNG and GIF images are allowed.'
  }
  if (file.size > ACTIVITY_IMAGE_MAX_BYTES) {
    return `Image must be 2 MB or smaller (this one is ${(file.size / 1024 / 1024).toFixed(1)} MB).`
  }
  return null
}
