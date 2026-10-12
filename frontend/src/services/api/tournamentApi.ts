import { apiClient } from './client';
import type { ApiEnvelope } from './contentApi';

export interface Team {
  team_id: number;
  team_name: string;
  team_code: string | null;
  short_name: string | null;
  team_logo: string | null;
  is_active: boolean;
  category_id: number;
  category_name: string;
  category_slug: string;
}

export type TournamentTeam = Omit<Team, 'is_active' | 'category_id' | 'category_name' | 'category_slug'>;

export type TeamInput = Pick<Team, 'team_name' | 'team_code' | 'short_name' | 'category_id'>;

export type MatchStage = 'LEAGUE' | 'QUARTER_FINAL' | 'SEMI_FINAL' | 'FINAL';
export type MatchStatus = 'SCHEDULED' | 'COMPLETED' | 'NO_RESULT';
export type MatchResult = 'TEAM1' | 'TEAM2' | 'TIE';

export interface MatchInput {
  team1_id: number;
  team2_id: number;
  match_date: string | null;
  stage: MatchStage;
  status: MatchStatus;
  result: MatchResult | null;
  team1_runs: number | null;
  team1_wickets: number | null;
  team1_overs: number | null;
  team2_runs: number | null;
  team2_wickets: number | null;
  team2_overs: number | null;
  summary: string | null;
}

export interface TournamentMatch extends MatchInput {
  match_id: number;
  event_id: number;
  team1_name: string;
  team2_name: string;
}

export interface PointsRow {
  position: number;
  team_id: number;
  team_name: string;
  short_name: string | null;
  team_logo: string | null;
  played: number;
  won: number;
  lost: number;
  tied: number;
  no_result: number;
  points: number;
  net_run_rate: number | null;
}

export interface MediaItem {
  media_id: number;
  media_type: 'PHOTO' | 'VIDEO';
  url: string;
  youtube_id: string | null;
  caption: string | null;
  created_at: string;
}

export interface TournamentMedia {
  photos: MediaItem[];
  videos: MediaItem[];
}

export interface TournamentDetails extends TournamentMedia {
  teams: TournamentTeam[];
  points_table: PointsRow[];
}

export const tournamentPublicApi = {
  getDetails: (slug: string) =>
    apiClient.get<ApiEnvelope<TournamentDetails>>(`/events/slug/${encodeURIComponent(slug)}/details`),
};

export const adminTeamsApi = {
  list: (categoryId?: number | null) =>
    apiClient.get<ApiEnvelope<Team[]>>(categoryId ? `/teams?category_id=${categoryId}` : '/teams'),

  create: (body: TeamInput) => apiClient.post<ApiEnvelope<Team>>('/teams', body),

  update: (id: number, body: Partial<TeamInput & Pick<Team, 'is_active'>>) =>
    apiClient.put<ApiEnvelope<Team>>(`/teams/${id}`, body),

  uploadLogo: (id: number, file: File) =>
    apiClient.upload<ApiEnvelope<Team>>(`/teams/${id}/logo`, file, 'image'),

  removeLogo: (id: number) => apiClient.delete<ApiEnvelope<Team>>(`/teams/${id}/logo`),
};

export const tournamentAdminApi = {
  listTeams: (id: number) => apiClient.get<ApiEnvelope<TournamentTeam[]>>(`/events/${id}/teams`),

  addTeams: (id: number, teamIds: number[]) =>
    apiClient.post<ApiEnvelope<TournamentTeam[]>>(`/events/${id}/teams`, { team_ids: teamIds }),

  removeTeam: (id: number, teamId: number) =>
    apiClient.delete<ApiEnvelope<null>>(`/events/${id}/teams/${teamId}`),

  listMatches: (id: number) => apiClient.get<ApiEnvelope<TournamentMatch[]>>(`/events/${id}/matches`),

  createMatch: (id: number, body: MatchInput) =>
    apiClient.post<ApiEnvelope<TournamentMatch>>(`/events/${id}/matches`, body),

  updateMatch: (id: number, matchId: number, body: MatchInput) =>
    apiClient.put<ApiEnvelope<TournamentMatch>>(`/events/${id}/matches/${matchId}`, body),

  removeMatch: (id: number, matchId: number) =>
    apiClient.delete<ApiEnvelope<null>>(`/events/${id}/matches/${matchId}`),

  getPointsTable: (id: number) => apiClient.get<ApiEnvelope<PointsRow[]>>(`/events/${id}/points`),

  listMedia: (id: number) => apiClient.get<ApiEnvelope<TournamentMedia>>(`/events/${id}/media`),

  uploadPhotos: (id: number, files: File[], caption: string) => {
    const form = new FormData();
    files.forEach((file) => form.append('images', file));
    if (caption.trim()) form.append('caption', caption.trim());
    return apiClient.request<ApiEnvelope<MediaItem[]>>(`/events/${id}/media/photos`, { method: 'POST', body: form });
  },

  addVideos: (id: number, videos: { url: string; caption: string }[]) =>
    apiClient.post<ApiEnvelope<MediaItem[]>>(`/events/${id}/media/videos`, { videos }),

  updateCaption: (id: number, mediaId: number, caption: string) =>
    apiClient.patch<ApiEnvelope<MediaItem>>(`/events/${id}/media/${mediaId}`, { caption }),

  removeMedia: (id: number, mediaId: number) =>
    apiClient.delete<ApiEnvelope<null>>(`/events/${id}/media/${mediaId}`),
};

export const STAGE_LABELS: Record<MatchStage, string> = {
  LEAGUE: 'League',
  QUARTER_FINAL: 'Quarter-final',
  SEMI_FINAL: 'Semi-final',
  FINAL: 'Final',
};
