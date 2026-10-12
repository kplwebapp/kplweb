import { apiClient } from './client';
import type { ApiEnvelope } from './publicApi';
import type { AuctionPlayerCategory } from '@/constants/auctionOptions';

export interface Auction {
  auction_id: number;
  season_id: number;
  title: string;
  description: string | null;
  auction_date: string | null;
  venue: string | null;
  status: 'UPCOMING' | 'LIVE' | 'COMPLETED' | string;
  budget_per_team: number;
  points_per_team?: number;
  max_players_per_team?: number;
  season_name: string;
  season_year: number;
  season_status: string;
}

export interface AuctionLot {
  lot_id: number;
  auction_id: number;
  lot_number: number;
  player_name: string;
  player_role: AuctionPlayerCategory | string | null;
  vibhaag: string | null;
  base_price: number;
  sold_price: number | null;
  team_id: number | null;
  team_name: string | null;
  team_short_name: string | null;
  status: 'PENDING' | 'SOLD' | 'UNSOLD' | string;
  sold_at: string | null;
}

export interface TeamAuctionSpend {
  team_id: number;
  team_name: string;
  short_name: string | null;
  players_bought: number;
  points_spent: number;
  points_remaining: number;
  max_players_per_team: number;
  batsmen: number;
  bowlers: number;
  all_rounders: number;
  /** @deprecated use points_spent */
  total_spent?: number;
}

export interface AuctionSeasonData {
  auction: Auction;
  lots: AuctionLot[];
  teamSpend: TeamAuctionSpend[];
}

export const auctionApi = {
  getBySeason: (seasonId: number) =>
    apiClient.get<ApiEnvelope<AuctionSeasonData | null>>(`/auctions?seasonId=${seasonId}`),

  upsertAuction: (body: {
    season_id: number;
    title: string;
    description?: string;
    auction_date?: string | null;
    venue?: string;
    status?: string;
    budget_per_team?: number;
    max_players_per_team?: number;
  }) => apiClient.put<ApiEnvelope<Auction>>('/auctions', body),

  createLot: (body: {
    season_id: number;
    lot_number: number;
    player_name: string;
    player_role: AuctionPlayerCategory;
    vibhaag?: string;
    base_price?: number;
    status?: string;
  }) => apiClient.post<ApiEnvelope<AuctionLot>>('/auctions/lots', body),

  updateLot: (
    lotId: number,
    body: Partial<{
      lot_number: number;
      player_name: string;
      player_role: AuctionPlayerCategory;
      vibhaag: string;
      base_price: number;
      sold_price: number | null;
      team_id: number | null;
      status: string;
    }>
  ) => apiClient.patch<ApiEnvelope<AuctionLot>>(`/auctions/lots/${lotId}`, body),

  deleteLot: (lotId: number) =>
    apiClient.delete<ApiEnvelope<null>>(`/auctions/lots/${lotId}`),
};
