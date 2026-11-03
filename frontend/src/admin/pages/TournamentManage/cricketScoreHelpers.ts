import type {
  CricketBattingRow,
  CricketBowlingRow,
  CricketInningsScore,
  CricketScoreboardData,
  MatchInput,
  TournamentMatch,
} from '@/services/api/tournamentApi'

export const emptyBatsman = (): CricketBattingRow => ({
  name: '',
  runs: 0,
  balls: 0,
  fours: 0,
  sixes: 0,
  dismissal: 'not out',
})

export const emptyBowler = (): CricketBowlingRow => ({
  name: '',
  overs: 0,
  maidens: 0,
  runs: 0,
  wickets: 0,
})

export const emptyExtras = () => ({
  total: 0,
  wides: 0,
  noballs: 0,
  byes: 0,
  legbyes: 0,
})

export function emptyInnings(
  number: 1 | 2,
  battingTeamId: number,
  bowlingTeamId: number,
): CricketInningsScore {
  return {
    number,
    batting_team_id: battingTeamId,
    bowling_team_id: bowlingTeamId,
    runs: 0,
    wickets: 0,
    overs: 0,
    status: 'NOT_STARTED',
    extras: emptyExtras(),
    batting: [emptyBatsman(), emptyBatsman()],
    bowling: [emptyBowler(), emptyBowler()],
    fall_of_wickets: [],
  }
}

export function isCricketScoreboard(data: TournamentMatch['score_data']): data is CricketScoreboardData {
  return Boolean(data && data.sport === 'cricket' && Array.isArray((data as CricketScoreboardData).innings))
}

export function scoreboardFromMatch(match: TournamentMatch): CricketScoreboardData {
  if (isCricketScoreboard(match.score_data) && match.score_data.innings.length > 0) {
    return {
      sport: 'cricket',
      innings: match.score_data.innings.map((inn) => ({
        ...emptyInnings(inn.number, inn.batting_team_id, inn.bowling_team_id),
        ...inn,
        extras: { ...emptyExtras(), ...inn.extras },
        batting: inn.batting?.length ? inn.batting.map((b) => ({ ...emptyBatsman(), ...b })) : [emptyBatsman()],
        bowling: inn.bowling?.length ? inn.bowling.map((b) => ({ ...emptyBowler(), ...b })) : [emptyBowler()],
        fall_of_wickets: inn.fall_of_wickets ?? [],
      })),
      live: match.score_data.live ?? null,
    }
  }

  const inn1 = emptyInnings(1, match.team1_id, match.team2_id)
  const inn2 = emptyInnings(2, match.team2_id, match.team1_id)

  if (match.team1_runs != null) {
    inn1.runs = match.team1_runs
    inn1.wickets = match.team1_wickets ?? 0
    inn1.overs = match.team1_overs ?? 0
    inn1.status = match.status === 'SCHEDULED' ? 'NOT_STARTED' : 'COMPLETED'
  }
  if (match.team2_runs != null) {
    inn2.runs = match.team2_runs
    inn2.wickets = match.team2_wickets ?? 0
    inn2.overs = match.team2_overs ?? 0
    inn2.status = match.status === 'COMPLETED' ? 'COMPLETED' : match.status === 'LIVE' ? 'IN_PROGRESS' : 'NOT_STARTED'
  }

  return {
    sport: 'cricket',
    innings: [inn1, inn2],
    live:
      match.status === 'LIVE'
        ? {
            batting_team_id: match.team2_runs != null ? match.team2_id : match.team1_id,
            current_innings: match.team2_runs != null ? 2 : 1,
          }
        : null,
  }
}

/** Map scoreboard totals onto flat match columns used by points/public views. */
export function matchPayloadFromScoreboard(
  match: TournamentMatch,
  board: CricketScoreboardData,
  status: TournamentMatch['status'],
  result: TournamentMatch['result'],
  summary: string | null,
): MatchInput {
  const byTeam = (teamId: number) => board.innings.find((i) => i.batting_team_id === teamId)

  const t1 = byTeam(match.team1_id)
  const t2 = byTeam(match.team2_id)

  return {
    team1_id: match.team1_id,
    team2_id: match.team2_id,
    match_date: match.match_date,
    match_time: match.match_time,
    venue: match.venue,
    stage: match.stage,
    status,
    result,
    team1_runs: t1 && (t1.status !== 'NOT_STARTED' || status !== 'SCHEDULED') ? t1.runs : null,
    team1_wickets: t1 && (t1.status !== 'NOT_STARTED' || status !== 'SCHEDULED') ? t1.wickets : null,
    team1_overs: t1 && (t1.status !== 'NOT_STARTED' || status !== 'SCHEDULED') ? t1.overs : null,
    team2_runs: t2 && (t2.status !== 'NOT_STARTED' || status !== 'SCHEDULED') ? t2.runs : null,
    team2_wickets: t2 && (t2.status !== 'NOT_STARTED' || status !== 'SCHEDULED') ? t2.wickets : null,
    team2_overs: t2 && (t2.status !== 'NOT_STARTED' || status !== 'SCHEDULED') ? t2.overs : null,
    team1_points: null,
    team2_points: null,
    score_data: board,
    summary,
  }
}

export function formatInningsScore(inn: CricketInningsScore): string {
  if (inn.status === 'NOT_STARTED' && inn.runs === 0 && inn.wickets === 0) return '—'
  return `${inn.runs}/${inn.wickets} (${inn.overs} ov)`
}
