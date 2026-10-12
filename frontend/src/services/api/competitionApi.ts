import { apiClient } from './client';
import type { ApiEnvelope, PointsTableRow, Season } from './publicApi';

export interface PaginatedEnvelope<T> extends ApiEnvelope<T> {
  pagination?: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface Team {
  team_id: number;
  team_name: string;
  team_code: string | null;
  short_name: string | null;
  is_active: boolean;
}

export interface Match {
  match_id: number;
  season_id: number;
  team1_id: number;
  team2_id: number;
  team1_name: string;
  team2_name: string;
  team1_short: string | null;
  team2_short: string | null;
  venue: string | null;
  match_date: string | null;
  match_type: string;
  overs_limit: number;
  status: string;
  result_summary: string | null;
  season_name: string;
  season_year: number;
}

export interface InningsScore {
  innings_id?: number;
  innings_number: number;
  batting_team_id: number;
  bowling_team_id: number;
  total_runs: number;
  total_wickets: number;
  total_overs: number;
  status?: string;
}

export interface LiveMatchScore {
  match_id: number;
  team1_id: number;
  team2_id: number;
  status: string;
  innings: InningsScore[];
}

export interface PointsTableUpdateRow {
  points_table_id?: number;
  team_id: number;
  matches_played: number;
  matches_won: number;
  matches_lost: number;
  matches_tied: number;
  matches_nr: number;
  points: number;
  net_run_rate: number;
}

export interface CreateMatchPayload {
  season_id: number;
  team1_id: number;
  team2_id: number;
  venue?: string;
  match_date?: string;
  status?: string;
  result_summary?: string;
}

export interface UpdateMatchPayload extends Partial<CreateMatchPayload> {
  winner_team_id?: number | null;
}

export const competitionApi = {
  listTeams: () =>
    apiClient.get<PaginatedEnvelope<Team[]>>('/teams'),

  listMatches: (seasonId?: number, status?: string) => {
    const params = new URLSearchParams();
    if (seasonId) params.set('seasonId', String(seasonId));
    if (status) params.set('status', status);
    const qs = params.toString();
    return apiClient.get<PaginatedEnvelope<Match[]>>(`/matches${qs ? `?${qs}` : ''}`);
  },

  createMatch: (payload: CreateMatchPayload) =>
    apiClient.post<ApiEnvelope<Match>>('/matches', payload),

  updateMatch: (matchId: number, payload: UpdateMatchPayload) =>
    apiClient.patch<ApiEnvelope<Match>>(`/matches/${matchId}`, payload),

  updatePointsTable: (seasonId: number, rows: PointsTableUpdateRow[]) =>
    apiClient.put<ApiEnvelope<PointsTableRow[]>>('/stats/points-table', { seasonId, rows }),

  getLiveScore: (matchId: number) =>
    apiClient.get<ApiEnvelope<LiveMatchScore>>(`/scoring/live/${matchId}`),

  updateScores: (matchId: number, payload: { innings: InningsScore[]; matchStatus?: string }) =>
    apiClient.patch<ApiEnvelope<LiveMatchScore>>(`/scoring/${matchId}/scores`, payload),
};

export type { Season, PointsTableRow };
