export const AUCTION_PLAYER_CATEGORIES = [
  'Icon Player',
  'All Rounder',
  'Batsman',
  'Bowlers',
  'Other Players',
] as const

export type AuctionPlayerCategory = (typeof AUCTION_PLAYER_CATEGORIES)[number]

export const DEFAULT_POINTS_PER_TEAM = 100000
export const DEFAULT_MAX_PLAYERS_PER_TEAM = 15
