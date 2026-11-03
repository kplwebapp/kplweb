import type { ActivityKind } from '@/services/api/activitiesApi'

export const ADMIN_BASE = '/admin'

export const KIND_SEGMENT: Record<ActivityKind, 'tournaments' | 'events'> = {
  TOURNAMENT: 'tournaments',
  EVENT: 'events',
}

export const KIND_LABELS: Record<ActivityKind, { singular: string; plural: string }> = {
  TOURNAMENT: { singular: 'Tournament', plural: 'Tournaments' },
  EVENT: { singular: 'Event', plural: 'Events' },
}

export const dashboardItem = { label: 'Dashboard', path: ADMIN_BASE, icon: '📊' }

export type SidebarItem = {
  label: string
  path: string
  icon: string
  permission?: string
}

export const contentGroup: { title: string; items: SidebarItem[] } = {
  title: 'Content & Members',
  items: [
    { label: 'Sponsors', path: `${ADMIN_BASE}/sponsors`, icon: '🤝', permission: 'sponsors:read' },
    { label: 'Gallery', path: `${ADMIN_BASE}/gallery`, icon: '🖼️', permission: 'gallery:read' },
    { label: 'Registered Members', path: `${ADMIN_BASE}/members`, icon: '✅', permission: 'users:read' },
  ],
}

export const rolesNavItem = {
  label: 'Roles & access',
  path: `${ADMIN_BASE}/roles`,
  icon: '🔐',
}

const CATEGORY_ICONS: Record<string, string> = {
  cricket: '🏏',
  carrom: '🎯',
  chess: '♟️',
  singing: '🎤',
  drawing: '🎨',
  seminars: '🎓',
  funfair: '🎡',
  picnic: '🧺',
}

export function categoryIcon(kind: ActivityKind, slug: string): string {
  return CATEGORY_ICONS[slug] ?? (kind === 'TOURNAMENT' ? '🏆' : '🎉')
}

export const teamsItem = { label: 'Teams', path: `${ADMIN_BASE}/teams`, icon: '👥' }
export const auctionsItem = { label: 'Auctions', path: `${ADMIN_BASE}/auctions`, icon: '🔨' }
export const liveAuctionItem = { label: 'Live Auctions', path: `${ADMIN_BASE}/auctions/live`, icon: '🔴' }
export const auctionNavGroup = {
  title: 'Auctions',
  items: [auctionsItem, liveAuctionItem],
}
export const auctionPath = (id: number) => `${ADMIN_BASE}/auctions/${id}`
export const liveAuctionPath = `${ADMIN_BASE}/auctions/live`
/** Roles that hold the auction permissions by default; the API still checks each action. */
export const AUCTION_ROLES = ['SUPER_ADMIN', 'ADMIN']

export const categoryPath = (kind: ActivityKind, slug: string) => `${ADMIN_BASE}/${KIND_SEGMENT[kind]}/${slug}`
export const tournamentManagePath = (slug: string, id: number) => `${categoryPath('TOURNAMENT', slug)}/${id}`
export const teamsPath = (slug?: string | null) => `${ADMIN_BASE}/teams${slug ? `?game=${encodeURIComponent(slug)}` : ''}`
export const playersPath = (slug: string) => `${ADMIN_BASE}/players/${slug}`
export const manageCategoriesPath = (kind: ActivityKind) => `${ADMIN_BASE}/categories/${KIND_SEGMENT[kind]}`
