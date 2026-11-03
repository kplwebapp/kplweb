import { Badge, Card, Col, Nav, Row } from 'react-bootstrap'
import EmptyState from '@/components/tournament/EmptyState'
import TeamBadge from '@/components/tournament/TeamBadge'
import { STAGE_LABELS, type TournamentMatch } from '@/services/api/tournamentApi'
import { formatEventDateRange } from '@/utils/eventDate'
import { useMemo, useState } from 'react'

type MatchFilter = 'all' | 'fixtures' | 'live' | 'results'

const STATUS_BADGE: Record<TournamentMatch['status'], string> = {
  SCHEDULED: 'primary',
  LIVE: 'danger',
  COMPLETED: 'success',
  NO_RESULT: 'secondary',
}

function statusLabel(match: TournamentMatch) {
  if (match.status === 'SCHEDULED') return 'Scheduled'
  if (match.status === 'LIVE') return 'Live'
  if (match.status === 'NO_RESULT') return 'No result'
  if (match.result === 'TIE') return 'Draw / tie'
  return match.result === 'TEAM1' ? `${match.team1_name} won` : `${match.team2_name} won`
}

function whenText(match: TournamentMatch) {
  const date = formatEventDateRange(match.match_date, null)
  if (date && match.match_time) return `${date} · ${match.match_time}`
  return date || match.match_time || 'To be announced'
}

function scoreText(match: TournamentMatch) {
  if (match.score) return { team1: match.score.team1, team2: match.score.team2 }
  return null
}

function MatchCard({ match }: { match: TournamentMatch }) {
  const scores = scoreText(match)
  return (
    <Card className="border-0 shadow-sm h-100">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
          <div className="small text-muted">
            {STAGE_LABELS[match.stage]} · {whenText(match)}
            {match.venue ? ` · ${match.venue}` : ''}
          </div>
          <Badge bg={STATUS_BADGE[match.status]}>{statusLabel(match)}</Badge>
        </div>
        <div className="d-flex flex-column gap-2">
          <div className="d-flex align-items-center justify-content-between gap-2">
            <div className="d-flex align-items-center gap-2 min-w-0">
              <TeamBadge name={match.team1_name} size={28} />
              <span className="fw-semibold text-truncate">{match.team1_name}</span>
            </div>
            {scores && <strong className="text-nowrap">{scores.team1}</strong>}
          </div>
          <div className="d-flex align-items-center justify-content-between gap-2">
            <div className="d-flex align-items-center gap-2 min-w-0">
              <TeamBadge name={match.team2_name} size={28} />
              <span className="fw-semibold text-truncate">{match.team2_name}</span>
            </div>
            {scores && <strong className="text-nowrap">{scores.team2}</strong>}
          </div>
        </div>
        {match.summary && <p className="small text-muted mb-0 mt-3">{match.summary}</p>}
      </Card.Body>
    </Card>
  )
}

type Props = {
  matches: TournamentMatch[]
  upcoming: boolean
  finished: boolean
}

export default function TournamentMatches({ matches, upcoming, finished }: Props) {
  const [filter, setFilter] = useState<MatchFilter>('all')

  const counts = useMemo(() => ({
    all: matches.length,
    fixtures: matches.filter((m) => m.status === 'SCHEDULED').length,
    live: matches.filter((m) => m.status === 'LIVE').length,
    results: matches.filter((m) => m.status === 'COMPLETED' || m.status === 'NO_RESULT').length,
  }), [matches])

  const visible = useMemo(() => {
    if (filter === 'fixtures') return matches.filter((m) => m.status === 'SCHEDULED')
    if (filter === 'live') return matches.filter((m) => m.status === 'LIVE')
    if (filter === 'results') return matches.filter((m) => m.status === 'COMPLETED' || m.status === 'NO_RESULT')
    return matches
  }, [filter, matches])

  return (
    <section className="mb-4">
      <h2 className="activity-detail__section-title">Matches & scores</h2>
      {matches.length === 0 ? (
        <EmptyState art="standings" title="No matches scheduled yet" compact>
          {upcoming
            ? 'Fixtures and scores for this tournament will appear here once matches are scheduled.'
            : finished
              ? 'No matches were recorded for this tournament.'
              : 'Fixtures will show here as soon as the schedule is published.'}
        </EmptyState>
      ) : (
        <>
          <Nav
            variant="pills"
            activeKey={filter}
            onSelect={(key) => key && setFilter(key as MatchFilter)}
            className="mb-3 flex-wrap gap-1"
          >
            <Nav.Item><Nav.Link eventKey="all">All ({counts.all})</Nav.Link></Nav.Item>
            <Nav.Item><Nav.Link eventKey="fixtures">Fixtures ({counts.fixtures})</Nav.Link></Nav.Item>
            <Nav.Item><Nav.Link eventKey="live">Live ({counts.live})</Nav.Link></Nav.Item>
            <Nav.Item><Nav.Link eventKey="results">Results ({counts.results})</Nav.Link></Nav.Item>
          </Nav>
          {visible.length === 0 ? (
            <EmptyState art="standings" title="Nothing in this list yet" compact>
              Try another filter to see scheduled, live or completed matches.
            </EmptyState>
          ) : (
            <Row className="g-3">
              {visible.map((match) => (
                <Col key={match.match_id} md={6} lg={4}>
                  <MatchCard match={match} />
                </Col>
              ))}
            </Row>
          )}
        </>
      )}
    </section>
  )
}
