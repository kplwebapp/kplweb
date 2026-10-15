import type { AuctionStatus, LotStatus } from '@/services/api/auctionApi'

export { formatPoints } from '@/utils/auctionPoints'

export const AUCTION_STATUS_LABEL: Record<AuctionStatus, string> = {
  DRAFT: 'Draft',
  READY: 'Ready',
  LIVE: 'Live',
  PAUSED: 'Paused',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  UPCOMING: 'Upcoming',
}

export const AUCTION_STATUS_VARIANT: Record<AuctionStatus, string> = {
  DRAFT: 'secondary',
  READY: 'info',
  LIVE: 'success',
  PAUSED: 'warning',
  COMPLETED: 'dark',
  CANCELLED: 'danger',
  UPCOMING: 'secondary',
}

export const LOT_STATUS_LABEL: Record<LotStatus, string> = {
  PENDING: 'Waiting',
  ON_BLOCK: 'Bidding now',
  SOLD: 'Sold',
  UNSOLD: 'Unsold',
  WITHDRAWN: 'Removed',
}

export const LOT_STATUS_VARIANT: Record<LotStatus, string> = {
  PENDING: 'light',
  ON_BLOCK: 'primary',
  SOLD: 'success',
  UNSOLD: 'secondary',
  WITHDRAWN: 'danger',
}

export const auctionStatusLabel = (status: string) => AUCTION_STATUS_LABEL[status as AuctionStatus] ?? status
export const auctionStatusVariant = (status: string) => AUCTION_STATUS_VARIANT[status as AuctionStatus] ?? 'secondary'

export function formatAuctionDate(value: string | null) {
  if (!value) return ''
  return new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

/** Cricketer profile answers shown under a player's name. */
export function playerStyle(p: { batting_style: string | null; bowling_style: string | null; is_wicketkeeper: string | null }) {
  return [
    p.batting_style && `Bat: ${p.batting_style}`,
    p.bowling_style && `Bowl: ${p.bowling_style}`,
    p.is_wicketkeeper === 'true' || p.is_wicketkeeper === 'Yes' ? 'Wicketkeeper' : null,
  ]
    .filter(Boolean)
    .join(' · ')
}
