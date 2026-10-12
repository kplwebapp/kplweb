import type { TournamentMatch } from '@/services/api/tournamentApi'

export function matchResultText(m: TournamentMatch): string {
  if (m.status === 'SCHEDULED') return 'Scheduled'
  if (m.status === 'NO_RESULT') return 'No result'
  if (m.result === 'TIE') return 'Match tied'
  return `${m.result === 'TEAM1' ? m.team1_name : m.team2_name} won`
}

export function inningsText(runs: number | null, wickets: number | null, overs: number | null): string {
  if (runs === null) return ''
  const score = wickets === null ? `${runs}` : `${runs}/${wickets}`
  return overs === null ? score : `${score} (${overs} ov)`
}
