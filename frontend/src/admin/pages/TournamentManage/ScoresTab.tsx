import { useCallback, useState, type FormEvent } from 'react'
import { Alert, Badge, Button, Col, Form, Row, Spinner, Table } from 'react-bootstrap'
import { useReloadable } from '@/admin/hooks/useReloadable'
import {
  STAGE_LABELS,
  tournamentAdminApi,
  type MatchResult,
  type MatchStatus,
  type TournamentMatch,
} from '@/services/api/tournamentApi'
import CricketScoreboard from './CricketMatchScoreboard'
import { matchResultText, matchScoreLine, matchWhen } from './matchText'
import './scoresTab.css'

const STATUS_BADGE: Record<TournamentMatch['status'], string> = {
  SCHEDULED: 'primary',
  LIVE: 'danger',
  COMPLETED: 'success',
  NO_RESULT: 'secondary',
}

type Props = {
  tournamentId: number
  categorySlug?: string | null
}

function SimpleScoreForm({
  tournamentId,
  match,
  sport,
  onBack,
  onSaved,
}: {
  tournamentId: number
  match: TournamentMatch
  sport: 'carrom' | 'chess'
  onBack: () => void
  onSaved: () => void
}) {
  const existing =
    match.score_data && match.score_data.sport !== 'cricket' ? match.score_data : null
  const [status, setStatus] = useState<MatchStatus>(match.status)
  const [result, setResult] = useState<MatchResult | ''>(match.result ?? '')
  const [points1, setPoints1] = useState(String(existing?.team1_points ?? match.team1_points ?? ''))
  const [points2, setPoints2] = useState(String(existing?.team2_points ?? match.team2_points ?? ''))
  const [summary, setSummary] = useState(match.summary ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const toNumber = (v: string) => (v.trim() === '' ? null : Number(v))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (status === 'COMPLETED' && !result) {
      setError('Choose who won (or draw/tie) for a completed match.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await tournamentAdminApi.updateMatch(tournamentId, match.match_id, {
        team1_id: match.team1_id,
        team2_id: match.team2_id,
        match_date: match.match_date,
        match_time: match.match_time,
        venue: match.venue,
        stage: match.stage,
        status,
        result: status === 'COMPLETED' ? (result as MatchResult) : null,
        team1_runs: null,
        team1_wickets: null,
        team1_overs: null,
        team2_runs: null,
        team2_wickets: null,
        team2_overs: null,
        team1_points: toNumber(points1),
        team2_points: toNumber(points2),
        score_data: {
          sport,
          team1_points: toNumber(points1),
          team2_points: toNumber(points2),
        },
        summary: summary.trim() || null,
      })
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save score.')
      setSaving(false)
    }
  }

  return (
    <div>
      <Button variant="link" className="px-0 mb-2" onClick={onBack}>
        ← Back to schedule
      </Button>
      <h5 className="mb-3">
        {match.team1_name} vs {match.team2_name}
        {status === 'LIVE' && (
          <Badge bg="danger" className="ms-2">
            LIVE
          </Badge>
        )}
      </h5>
      {error && <Alert variant="danger">{error}</Alert>}
      <Form onSubmit={(e) => void handleSubmit(e)} className="bg-white border rounded p-3">
        <Row className="g-3 mb-3">
          <Form.Group as={Col} md={4}>
            <Form.Label>Status</Form.Label>
            <Form.Select value={status} onChange={(e) => setStatus(e.target.value as MatchStatus)}>
              <option value="SCHEDULED">Scheduled</option>
              <option value="LIVE">Live</option>
              <option value="COMPLETED">Completed</option>
              <option value="NO_RESULT">No result</option>
            </Form.Select>
          </Form.Group>
          <Form.Group as={Col} md={4}>
            <Form.Label>{match.team1_name}</Form.Label>
            <Form.Control type="number" min={0} value={points1} onChange={(e) => setPoints1(e.target.value)} />
          </Form.Group>
          <Form.Group as={Col} md={4}>
            <Form.Label>{match.team2_name}</Form.Label>
            <Form.Control type="number" min={0} value={points2} onChange={(e) => setPoints2(e.target.value)} />
          </Form.Group>
          <Form.Group as={Col} md={6}>
            <Form.Label>Result</Form.Label>
            <Form.Select
              value={result}
              disabled={status !== 'COMPLETED'}
              onChange={(e) => setResult(e.target.value as MatchResult | '')}
            >
              <option value="">—</option>
              <option value="TEAM1">{match.team1_name} won</option>
              <option value="TEAM2">{match.team2_name} won</option>
              <option value="TIE">Draw / tie</option>
            </Form.Select>
          </Form.Group>
          <Form.Group as={Col} md={6}>
            <Form.Label>Summary</Form.Label>
            <Form.Control value={summary} maxLength={300} onChange={(e) => setSummary(e.target.value)} />
          </Form.Group>
        </Row>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save score'}
        </Button>
      </Form>
    </div>
  )
}

export default function ScoresTab({ tournamentId, categorySlug }: Props) {
  const sport = (categorySlug || 'cricket').toLowerCase()
  const load = useCallback(
    () => tournamentAdminApi.listMatches(tournamentId).then((res) => res.data),
    [tournamentId],
  )
  const { data: matches, error, loading, reload } = useReloadable(load, String(tournamentId))
  const [selectedId, setSelectedId] = useState<number | null>(null)

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" />
      </div>
    )
  }
  if (!matches) return <Alert variant="danger">{error}</Alert>

  const selected = selectedId != null ? matches.find((m) => m.match_id === selectedId) : null

  if (selected) {
    const back = () => setSelectedId(null)
    const saved = () => {
      reload()
    }
    if (sport === 'carrom' || sport === 'chess') {
      return (
        <SimpleScoreForm
          tournamentId={tournamentId}
          match={selected}
          sport={sport}
          onBack={back}
          onSaved={saved}
        />
      )
    }
    return (
      <CricketScoreboard tournamentId={tournamentId} match={selected} onBack={back} onSaved={saved} />
    )
  }

  return (
    <>
      <p className="text-muted mb-3">
        Match schedule — open a fixture to enter live scores and the full scorecard. Only scorers can use this tab.
      </p>
      {error && <Alert variant="danger">{error}</Alert>}
      <Table responsive hover className="bg-white shadow-sm align-middle kpl-scores-schedule">
        <thead className="table-light">
          <tr>
            <th>When</th>
            <th>Stage</th>
            <th>Match</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {matches.length === 0 ? (
            <tr>
              <td colSpan={4} className="text-center text-muted py-4">
                No matches scheduled yet. Add fixtures on the Matches tab first.
              </td>
            </tr>
          ) : (
            matches.map((m) => {
              const scoreLine = matchScoreLine(m)
              return (
                <tr key={m.match_id} onClick={() => setSelectedId(m.match_id)}>
                  <td className="text-nowrap">
                    <div>{matchWhen(m)}</div>
                    {m.venue && <small className="text-muted">{m.venue}</small>}
                  </td>
                  <td>{STAGE_LABELS[m.stage]}</td>
                  <td>
                    <div className="fw-semibold">
                      {m.team1_name} vs {m.team2_name}
                    </div>
                    {scoreLine && <small className="text-muted">{scoreLine}</small>}
                  </td>
                  <td>
                    <Badge bg={STATUS_BADGE[m.status]}>{matchResultText(m)}</Badge>
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </Table>
    </>
  )
}
