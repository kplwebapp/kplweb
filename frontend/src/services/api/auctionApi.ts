import { API_BASE_URL, apiClient } from './client';
import type { ApiEnvelope } from './publicApi';

export type AuctionStatus = 'DRAFT' | 'READY' | 'LIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED' | 'UPCOMING';
export type LotStatus = 'PENDING' | 'ON_BLOCK' | 'SOLD' | 'UNSOLD' | 'WITHDRAWN';

// ---------- Public (read-only) ----------

export interface PublicAuctionSummary {
  auction_id: number;
  title: string;
  status: AuctionStatus;
  is_legacy: boolean;
  auction_date: string | null;
  season_name: string;
  season_year: number;
  event_title: string | null;
}

export interface PublicLot {
  lot_id: number;
  lot_number: number;
  player_name: string;
  vibhaag: string | null;
  category: string | null;
  base_price: number;
  status: LotStatus;
  team_id: number | null;
  team_name: string | null;
  sold_price: number | null;
  profile_photo: string | null;
}

export interface LiveBid {
  amount: number;
  team_id: number;
  team_name: string;
  placed_at: string;
}

export interface PublicTeam {
  team_id: number;
  team_name: string;
  short_name: string | null;
  team_logo: string | null;
  budget: number;
  spent: number;
  remaining: number;
  players_bought: number;
  max_players: number;
  slots_left: number;
  players: { lot_id: number; player_name: string; category: string | null; sold_price: number }[];
}

export interface AuctionSnapshot {
  auction: {
    auction_id: number;
    title: string;
    description: string | null;
    rules: string | null;
    status: AuctionStatus;
    is_legacy: boolean;
    auction_date: string | null;
    venue: string | null;
    season_name: string;
    season_year: number;
    tournament: { title: string; slug: string } | null;
    min_bid_increment: number;
    max_players_per_team: number;
    started_at: string | null;
    completed_at: string | null;
    version: number;
  };
  categories: { auction_category_id: number; name: string }[];
  teams: PublicTeam[];
  current:
    | (PublicLot & {
        batting_style: string | null;
        bowling_style: string | null;
        is_wicketkeeper: string | null;
        bid_round: number;
        highest: { amount: number; team_id: number; team_name: string } | null;
        next_min_bid: number;
        bids: LiveBid[];
      })
    | null;
  lots: PublicLot[];
  counts: { total: number; sold: number; unsold: number; remaining: number; on_block: number };
  total_spent: number;
  last_event: {
    seq: number;
    type: string;
    lot_id: number | null;
    team_name: string | null;
    amount: number | null;
    at: string;
  } | null;
  generated_at: string;
}

export const auctionPublicApi = {
  list: () => apiClient.get<ApiEnvelope<PublicAuctionSummary[]>>('/auctions/public'),
  snapshot: (auctionId: number) => apiClient.get<ApiEnvelope<AuctionSnapshot>>(`/auctions/${auctionId}/public`),
  streamUrl: (auctionId: number) => `${API_BASE_URL}/auctions/${auctionId}/stream`,
};

// ---------- Administration ----------

export interface AuctionAbilities {
  manage: boolean;
  operate: boolean;
}

export interface AuctionListItem {
  auction_id: number;
  title: string;
  status: AuctionStatus;
  is_legacy: boolean;
  auction_date: string | null;
  venue: string | null;
  season_id: number;
  season_name: string;
  season_year: number;
  event_id: number | null;
  event_title: string | null;
  pool_size: number;
  sold: number;
  teams: number;
}

export interface AuctionDetailRecord {
  auction_id: number;
  title: string;
  description: string | null;
  rules: string | null;
  status: AuctionStatus;
  is_legacy: boolean;
  auction_date: string | null;
  venue: string | null;
  season_id: number;
  season_name: string;
  season_year: number;
  event_id: number | null;
  event_title: string | null;
  event_slug: string | null;
  budget_per_team: number | string;
  max_players_per_team: number;
  min_players_per_team: number;
  min_bid_increment: number;
  default_base_price: number;
  current_lot_id: number | null;
  version: number;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
}

export interface AuctionCategory {
  auction_category_id: number;
  name: string;
  display_order: number;
  base_price: number | null;
  min_per_team: number;
  max_per_team: number | null;
}

export interface AuctionTeam {
  team_id: number;
  team_name: string;
  short_name: string | null;
  team_code: string | null;
  team_logo: string | null;
  budget: number;
  max_players: number;
  players_bought: number;
  spent: number;
  remaining: number;
  slots_left: number;
}

export interface AuctionLot {
  lot_id: number;
  lot_number: number;
  player_name: string;
  player_role: string | null;
  vibhaag: string | null;
  base_price: number;
  sold_price: number | null;
  team_id: number | null;
  status: LotStatus;
  sold_at: string | null;
  user_id: number | null;
  auction_category_id: number | null;
  category_name: string | null;
  is_eligible: boolean;
  eligibility_note: string | null;
  bid_round: number;
  current_bid_id: number | null;
  team_name: string | null;
  team_short_name: string | null;
  profile_photo: string | null;
  current_bid_amount: number | null;
  current_bid_team_id: number | null;
  current_bid_team_name: string | null;
  batting_style: string | null;
  bowling_style: string | null;
  is_wicketkeeper: string | null;
}

export interface RoundBid {
  bid_id: number;
  team_id: number;
  team_name: string;
  short_name: string | null;
  amount: number;
  placed_at: string;
}

export interface AuctionDetail {
  auction: AuctionDetailRecord;
  categories: AuctionCategory[];
  teams: AuctionTeam[];
  lots: AuctionLot[];
  current: (AuctionLot & { bids: RoundBid[]; next_min_bid: number }) | null;
  stats: {
    registered: number;
    pool: number;
    eligible: number;
    available: number;
    sold: number;
    unsold: number;
    withdrawn: number;
    total_spent: number;
    progress: number;
  };
  can: AuctionAbilities;
}

export interface Candidate {
  registration_id: number;
  registered_at: string;
  user_id: number;
  full_name: string;
  vibhaag: string | null;
  profile_photo: string | null;
  batting_style: string | null;
  bowling_style: string | null;
  is_wicketkeeper: string | null;
}

export interface BidRecord {
  bid_id: number;
  lot_id: number;
  lot_number: number;
  player_name: string;
  bid_round: number;
  team_id: number;
  team_name: string;
  amount: number;
  placed_at: string;
  placed_by: string | null;
  is_winning: boolean;
  is_current_round: boolean;
}

export interface AuctionEventRecord {
  auction_event_id: number;
  seq: number | string;
  event_type: string;
  lot_id: number | null;
  lot_number: number | null;
  player_name: string | null;
  team_id: number | null;
  team_name: string | null;
  amount: number | null;
  details: Record<string, unknown>;
  created_at: string;
  actor: string | null;
}

export interface TeamOption {
  team_id: number;
  team_name: string;
  short_name: string | null;
  team_logo: string | null;
  in_tournament: boolean;
}

export interface SeasonOption {
  season_id: number;
  season_name: string;
  season_year: number;
}

export interface TournamentOption {
  event_id: number;
  title: string;
  event_date: string | null;
  is_archived: boolean;
  auction_id: number | null;
}

export interface CategoryInput {
  auction_category_id?: number;
  name: string;
  base_price: number | null;
  min_per_team: number;
  max_per_team: number | null;
}

export interface AuctionSettingsInput {
  title: string;
  description: string | null;
  rules: string | null;
  auction_date: string | null;
  venue: string | null;
  season_id: number;
  event_id: number | null;
  budget_per_team: number;
  max_players_per_team: number;
  min_players_per_team: number;
  min_bid_increment: number;
  default_base_price: number;
}

export type LifecycleAction = 'ready' | 'draft' | 'start' | 'pause' | 'resume' | 'complete' | 'cancel';
export type AuctionReport = 'results' | 'teams' | 'bids';

const base = (id: number) => `/auctions/manage/${id}`;

export const auctionAdminApi = {
  list: () => apiClient.get<ApiEnvelope<{ auctions: AuctionListItem[]; can: AuctionAbilities }>>('/auctions/manage'),
  seasons: () => apiClient.get<ApiEnvelope<SeasonOption[]>>('/auctions/manage/options/seasons'),
  tournaments: () => apiClient.get<ApiEnvelope<TournamentOption[]>>('/auctions/manage/options/tournaments'),
  create: (body: AuctionSettingsInput & { categories: CategoryInput[] }) =>
    apiClient.post<ApiEnvelope<AuctionDetailRecord>>('/auctions/manage', body),

  detail: (id: number) => apiClient.get<ApiEnvelope<AuctionDetail>>(base(id)),
  update: (id: number, body: Partial<AuctionSettingsInput>) => apiClient.patch<ApiEnvelope<AuctionDetailRecord>>(base(id), body),
  setCategories: (id: number, categories: CategoryInput[]) =>
    apiClient.put<ApiEnvelope<AuctionCategory[]>>(`${base(id)}/categories`, { categories }),
  teamOptions: (id: number) => apiClient.get<ApiEnvelope<TeamOption[]>>(`${base(id)}/team-options`),
  setTeams: (id: number, teams: { team_id: number; budget: number; max_players: number }[]) =>
    apiClient.put<ApiEnvelope<AuctionTeam[]>>(`${base(id)}/teams`, { teams }),

  candidates: (id: number) => apiClient.get<ApiEnvelope<Candidate[]>>(`${base(id)}/candidates`),
  addPlayers: (id: number, userIds: number[], categoryId: number | null) =>
    apiClient.post<ApiEnvelope<{ added: number; skipped: number }>>(`${base(id)}/players`, {
      user_ids: userIds,
      auction_category_id: categoryId,
    }),
  updateLot: (
    id: number,
    lotId: number,
    body: Partial<{ auction_category_id: number | null; base_price: number; is_eligible: boolean; eligibility_note: string | null }>
  ) => apiClient.patch<ApiEnvelope<AuctionLot>>(`${base(id)}/players/${lotId}`, body),
  withdrawLot: (id: number, lotId: number) => apiClient.post<ApiEnvelope<AuctionLot>>(`${base(id)}/players/${lotId}/withdraw`, {}),
  restoreLot: (id: number, lotId: number) => apiClient.post<ApiEnvelope<AuctionLot>>(`${base(id)}/players/${lotId}/restore`, {}),
  reorder: (id: number, lotIds: number[]) => apiClient.put<ApiEnvelope<{ ok: true }>>(`${base(id)}/order`, { lot_ids: lotIds }),

  transition: (id: number, action: LifecycleAction, reason?: string) =>
    apiClient.post<ApiEnvelope<{ status: AuctionStatus }>>(`${base(id)}/status/${action}`, reason ? { reason } : {}),

  nextPlayer: (id: number, lotId: number | null = null) =>
    apiClient.post<ApiEnvelope<AuctionLot>>(`${base(id)}/live/next`, { lot_id: lotId }),
  bid: (id: number, lotId: number, teamId: number, amount: number) =>
    apiClient.post<ApiEnvelope<RoundBid>>(`${base(id)}/live/bid`, { lot_id: lotId, team_id: teamId, amount }),
  sell: (id: number, lotId: number) => apiClient.post<ApiEnvelope<AuctionLot>>(`${base(id)}/live/sold`, { lot_id: lotId }),
  unsold: (id: number, lotId: number) => apiClient.post<ApiEnvelope<AuctionLot>>(`${base(id)}/live/unsold`, { lot_id: lotId }),
  restartBidding: (id: number, lotId: number, reason: string) =>
    apiClient.post<ApiEnvelope<AuctionLot>>(`${base(id)}/live/restart-bidding`, { lot_id: lotId, reason }),
  reopen: (id: number, lotId: number, reason: string) =>
    apiClient.post<ApiEnvelope<AuctionLot>>(`${base(id)}/reopen`, { lot_id: lotId, reason }),

  bids: (id: number) => apiClient.get<ApiEnvelope<BidRecord[]>>(`${base(id)}/bids`),
  events: (id: number) => apiClient.get<ApiEnvelope<AuctionEventRecord[]>>(`${base(id)}/events`),
  exportCsv: (id: number, report: AuctionReport) => apiClient.download(`${base(id)}/export/${report}`, `auction-${report}.csv`),
};
