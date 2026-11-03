import type { TournamentMatch } from '@/services/api/tournamentApi'

export function matchResultText(m: TournamentMatch): string {
  if (m.status === 'SCHEDULED') return 'Scheduled'
  if (m.status === 'LIVE') return 'Live'
  if (m.status === 'NO_RESULT') return 'No result'
  if (m.result === 'TIE') return 'Draw / tie'
  return `${m.result === 'TEAM1' ? m.team1_name : m.team2_name} won`
}

export function inningsText(runs: number | null, wickets: number | null, overs: number | null): string {
  if (runs === null) return ''
  const score = wickets === null ? `${runs}` : `${runs}/${wickets}`
  return overs === null ? score : `${score} (${overs} ov)`
}

export function matchScoreLine(m: TournamentMatch): string {
  if (m.score) return `${m.score.team1} · ${m.score.team2}`
  const score1 = inningsText(m.team1_runs, m.team1_wickets, m.team1_overs)
  const score2 = inningsText(m.team2_runs, m.team2_wickets, m.team2_overs)
  if (!score1 && !score2) return ''
  return `${score1 || '—'} · ${score2 || '—'}`
}

export function matchWhen(m: TournamentMatch): string {
  const date = m.match_date || ''
  const time = m.match_time || ''
  if (date && time) return `${date} · ${time}`
  return date || time || 'TBA'
}
