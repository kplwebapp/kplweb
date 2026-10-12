import { apiClient } from './client';

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface Season {
  season_id: number;
  season_name: string;
  season_year: number;
  status: string;
  tournament_id: number;
  tournament_name: string;
  tournament_code: string;
}

export interface PointsTableRow {
  points_table_id: number;
  season_id: number;
  team_id: number;
  team_name: string;
  short_name: string | null;
  matches_played: number;
  matches_won: number;
  matches_lost: number;
  matches_tied: number;
  matches_nr: number;
  points: number;
  net_run_rate: number;
}

export const statsApi = {
  getSeasons: () =>
    apiClient.get<ApiEnvelope<Season[]>>('/stats/seasons'),

  getPointsTable: (seasonId?: number) =>
    apiClient.get<ApiEnvelope<PointsTableRow[]>>(
      `/stats/points-table${seasonId ? `?seasonId=${seasonId}` : ''}`
    ),

  getPlayerStats: () => apiClient.get('/stats/players'),
  getTeamStats: () => apiClient.get('/stats/teams'),
};

export const matchesApi = {
  list: () => apiClient.get('/matches'),
  getLiveScore: (matchId: number) => apiClient.get(`/scoring/live/${matchId}`),
};

export const teamsApi = {
  list: () => apiClient.get('/teams'),
};
