export {
  AUCTION_PLAYER_CATEGORIES,
  DEFAULT_MAX_PLAYERS_PER_TEAM,
  DEFAULT_POINTS_PER_TEAM,
} from '@/constants/auctionOptions'

export function formatPoints(value: number) {
  return `${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value)} pts`
}
