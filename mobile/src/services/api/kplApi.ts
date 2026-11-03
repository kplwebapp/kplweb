import { apiRequest, type ApiEnvelope } from './client'

export type SeasonRow = {
  season_id: number
  season_name: string
  season_year: number
  status: string
  tournament_id: number
  tournament_name: string
  tournament_code: string
}

export type PointsTableApiRow = {
  points_table_id: number
  season_id: number
  team_id: number
  team_name: string
  short_name: string | null
  matches_played: number
  matches_won: number
  matches_lost: number
  matches_tied: number
  matches_nr: number
  points: number
  net_run_rate: number
}

export type MatchApiRow = {
  match_id: number
  season_id: number
  team1_id: number
  team2_id: number
  team1_name: string
  team1_short: string | null
  team2_name: string
  team2_short: string | null
  venue: string | null
  match_date: string | null
  status: string
  result_summary: string | null
  season_name?: string
  season_year?: number
}

export type TeamApiRow = {
  team_id: number
  team_name: string
  team_code: string | null
  short_name: string | null
  team_logo: string | null
  is_active: boolean
}

export type PublicAuctionCard = {
  auction_id: number
  title: string
  description: string | null
  status_label: string
  phase: 'live' | 'completed' | 'upcoming'
  auction_date: string | null
  venue: string | null
}

export type SponsorRow = {
  sponsor_id: number
  sponsor_name: string
  logo_url: string | null
  website_url: string | null
  tier?: string
}

type TokenOpts = { token?: string | null }

async function getData<T>(path: string, token?: string | null): Promise<T> {
  const res = await apiRequest<T>(path, { token })
  return res.data
}

export const kplApi = {
  getSeasons: (opts: TokenOpts = {}) => getData<SeasonRow[]>('/stats/seasons', opts.token),

  getPointsTable: (seasonId?: number | null, opts: TokenOpts = {}) =>
    getData<PointsTableApiRow[]>(
      `/stats/points-table${seasonId ? `?seasonId=${seasonId}` : ''}`,
      opts.token,
    ),

  listMatches: async (params: { seasonId?: number | null; status?: string } = {}, opts: TokenOpts = {}) => {
    const qs = new URLSearchParams()
    if (params.seasonId) qs.set('seasonId', String(params.seasonId))
    if (params.status) qs.set('status', params.status)
    const query = qs.toString()
    // Paginated envelope: data is the rows array
    const res = (await apiRequest<MatchApiRow[]>(`/matches${query ? `?${query}` : ''}`, {
      token: opts.token,
    })) as ApiEnvelope<MatchApiRow[]>
    return Array.isArray(res.data) ? res.data : []
  },

  getMatch: (id: number | string, opts: TokenOpts = {}) =>
    getData<MatchApiRow>(`/matches/${id}`, opts.token),

  listTeams: (opts: TokenOpts = {}) => getData<TeamApiRow[]>('/teams', opts.token),

  listAuctions: () => getData<PublicAuctionCard[]>('/auctions/public'),

  listSponsors: () => getData<SponsorRow[]>('/sponsors'),
}
