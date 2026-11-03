import type { PreviewAuction, PreviewMatch, PreviewStanding, PreviewTeam } from '@/fixtures/previewData'
import type { MatchApiRow, PointsTableApiRow, PublicAuctionCard, TeamApiRow } from './api/kplApi'
import { resolveTeamBrandColor } from '@/constants/teamLogos'

const TEAM_COLORS = ['#03015e', '#7c0061', '#c11f56', '#ec6948', '#feb148', '#f9f871', '#7c0061', '#c11f56']

export function teamColor(id: number, name?: string | null) {
  if (name) return resolveTeamBrandColor(name, TEAM_COLORS[Math.abs(id) % TEAM_COLORS.length])
  return TEAM_COLORS[Math.abs(id) % TEAM_COLORS.length]
}

function toTeam(id: number, name: string, shortName?: string | null, codeHint?: string | null): PreviewTeam {
  const fullName = name || shortName || 'Team'
  const code = (codeHint || shortName || fullName).slice(0, 3).toUpperCase()
  return {
    id: String(id),
    name: fullName,
    // Prefer full official name in mobile UI
    shortName: fullName,
    code,
    color: teamColor(id, fullName),
  }
}

export function mapTeam(row: TeamApiRow): PreviewTeam {
  return toTeam(row.team_id, row.team_name, row.short_name, row.team_code)
}

function mapMatchStatus(status: string): PreviewMatch['status'] {
  const s = status.toUpperCase()
  if (s === 'LIVE' || s === 'IN_PROGRESS' || s === 'ONGOING') return 'live'
  if (s === 'COMPLETED' || s === 'FINISHED' || s === 'RESULT') return 'completed'
  return 'upcoming'
}

export function mapMatch(row: MatchApiRow): PreviewMatch {
  return {
    id: String(row.match_id),
    status: mapMatchStatus(row.status),
    team1: toTeam(row.team1_id, row.team1_name, row.team1_short),
    team2: toTeam(row.team2_id, row.team2_name, row.team2_short),
    venue: row.venue || 'TBA',
    startsAt: row.match_date || new Date().toISOString(),
    resultSummary: row.result_summary || undefined,
  }
}

export function mapStanding(row: PointsTableApiRow, rank: number): PreviewStanding {
  return {
    rank,
    team: toTeam(row.team_id, row.team_name, row.short_name),
    played: row.matches_played,
    won: row.matches_won,
    lost: row.matches_lost,
    tied: row.matches_tied,
    points: row.points,
    nrr: Number(row.net_run_rate).toFixed(3),
  }
}

export function mapAuction(row: PublicAuctionCard): PreviewAuction {
  const status =
    row.phase === 'live' ? 'Live' : row.phase === 'completed' ? 'Completed' : 'Upcoming'
  return {
    id: String(row.auction_id),
    title: row.title,
    status,
    venue: row.venue || 'TBA',
    dateLabel: row.auction_date
      ? new Date(row.auction_date).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : 'Date TBA',
    description: row.description || row.status_label,
  }
}
