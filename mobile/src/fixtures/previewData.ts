/**
 * PHASE 1 PREVIEW FIXTURES ONLY.
 * Not live scores, auction totals, or production statistics.
 * Replace in Phase 2+ with secured API responses.
 */

export type PreviewTeam = {
  id: string
  name: string
  shortName: string
  code: string
  color: string
}

export type PreviewMatch = {
  id: string
  status: 'live' | 'upcoming' | 'completed'
  team1: PreviewTeam
  team2: PreviewTeam
  venue: string
  startsAt: string
  scoreSummary?: string
  resultSummary?: string
  oversDisplay?: string
}

export type PreviewStanding = {
  rank: number
  team: PreviewTeam
  played: number
  won: number
  lost: number
  tied: number
  points: number
  nrr: string
}

export type PreviewAuction = {
  id: string
  title: string
  status: 'Live' | 'Upcoming' | 'Completed'
  venue: string
  dateLabel: string
  description: string
}

export const PREVIEW_SEASON = {
  id: 's4',
  label: 'Season 4 (Preview)',
}

export const previewTeams: PreviewTeam[] = [
  { id: 't1', name: 'Valsad Warriors', shortName: 'Valsad Warriors', code: 'VWA', color: '#03015e' },
  { id: 't2', name: 'Omisol Champions', shortName: 'Omisol Champions', code: 'OCH', color: '#0B3D91' },
  { id: 't3', name: 'Super Strikers', shortName: 'Super Strikers', code: 'SST', color: '#c11f56' },
  { id: 't4', name: 'Friends Cricketers', shortName: 'Friends Cricketers', code: 'FRC', color: '#feb148' },
  { id: 't5', name: 'Mahakali Tigers', shortName: 'Mahakali Tigers', code: 'MTK', color: '#ec6948' },
  { id: 't6', name: 'Fearless Falcons', shortName: 'Fearless Falcons', code: 'FFC', color: '#1E90FF' },
]

const [vwa, och, sst, frc, mtk, ffc] = previewTeams

export const previewMatches: PreviewMatch[] = [
  {
    id: 'm1',
    status: 'live',
    team1: vwa,
    team2: och,
    venue: 'KPL Ground, Valsad',
    startsAt: '2026-10-29T14:30:00+05:30',
    scoreSummary: 'VWA 142/4',
    oversDisplay: '16.2',
  },
  {
    id: 'm2',
    status: 'upcoming',
    team1: sst,
    team2: frc,
    venue: 'Municipal Stadium',
    startsAt: '2026-10-30T18:00:00+05:30',
  },
  {
    id: 'm3',
    status: 'upcoming',
    team1: mtk,
    team2: ffc,
    venue: 'KPL Ground, Valsad',
    startsAt: '2026-10-31T18:00:00+05:30',
  },
  {
    id: 'm4',
    status: 'completed',
    team1: vwa,
    team2: sst,
    venue: 'KPL Ground, Valsad',
    startsAt: '2026-10-26T18:00:00+05:30',
    resultSummary: 'Valsad Warriors won by 18 runs',
    scoreSummary: 'VWA 168/6 · SST 150/8',
  },
  {
    id: 'm5',
    status: 'completed',
    team1: och,
    team2: ffc,
    venue: 'Municipal Stadium',
    startsAt: '2026-10-25T18:00:00+05:30',
    resultSummary: 'Omisol Champions won by 5 wickets',
    scoreSummary: 'FFC 131/9 · OCH 132/5',
  },
]

export const previewStandings: PreviewStanding[] = [
  { rank: 1, team: vwa, played: 4, won: 3, lost: 1, tied: 0, points: 6, nrr: '+1.214' },
  { rank: 2, team: och, played: 4, won: 3, lost: 1, tied: 0, points: 6, nrr: '+0.842' },
  { rank: 3, team: sst, played: 4, won: 2, lost: 2, tied: 0, points: 4, nrr: '+0.110' },
  { rank: 4, team: mtk, played: 4, won: 2, lost: 2, tied: 0, points: 4, nrr: '-0.205' },
  { rank: 5, team: frc, played: 4, won: 1, lost: 3, tied: 0, points: 2, nrr: '-0.688' },
  { rank: 6, team: ffc, played: 4, won: 1, lost: 3, tied: 0, points: 2, nrr: '-1.102' },
]

export const previewAuctions: PreviewAuction[] = [
  {
    id: 'a1',
    title: 'KPL Season 4 Player Auction',
    status: 'Live',
    venue: 'KPL Arena',
    dateLabel: '28 Oct 2026',
    description: 'Preview layout for the live auction board experience.',
  },
  {
    id: 'a2',
    title: 'KPL Season 3 Auction',
    status: 'Completed',
    venue: 'Community Hall',
    dateLabel: '12 Apr 2025',
    description: 'Historical auction summary (sample layout data).',
  },
]

export const previewHighlights = [
  { id: 'h1', title: 'Season 4 fixtures released', body: 'Sample announcement for the home feed.' },
  { id: 'h2', title: 'Auction night approach', body: 'Sample update — not a live push notification.' },
]

export const previewSponsors = [
  { id: 'sp1', name: 'Title Sponsor (Preview)' },
  { id: 'sp2', name: 'Associate Partner (Preview)' },
  { id: 'sp3', name: 'Kit Partner (Preview)' },
]
