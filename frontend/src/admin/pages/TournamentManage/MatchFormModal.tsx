import { useState, type FormEvent } from 'react'
import { Alert, Button, Col, Form, Modal, Row } from 'react-bootstrap'
import {
  STAGE_LABELS,
  tournamentAdminApi,
  type MatchInput,
  type MatchResult,
  type MatchStage,
  type MatchStatus,
  type TournamentMatch,
  type TournamentTeam,
} from '@/services/api/tournamentApi'

type Props = {
  tournamentId: number
  teams: TournamentTeam[]
  editing: TournamentMatch | null
  onClose: () => void
  onSaved: () => void
}

type Innings = { runs: string; wickets: string; overs: string }

const toText = (value: number | null) => (value === null ? '' : String(value))
const toNumber = (value: string) => (value.trim() === '' ? null : Number(value))

const inningsOf = (m: TournamentMatch | null, side: 1 | 2): Innings => ({
  runs: toText(m ? (side === 1 ? m.team1_runs : m.team2_runs) : null),
  wickets: toText(m ? (side === 1 ? m.team1_wickets : m.team2_wickets) : null),
  overs: toText(m ? (side === 1 ? m.team1_overs : m.team2_overs) : null),
})

export default function MatchFormModal({ tournamentId, teams, editing, onClose, onSaved }: Props) {
  const [team1, setTeam1] = useState(String(editing?.team1_id ?? teams[0]?.team_id ?? ''))
  const [team2, setTeam2] = useState(String(editing?.team2_id ?? teams[1]?.team_id ?? ''))
  const [date, setDate] = useState(editing?.match_date ?? '')
  const [stage, setStage] = useState<MatchStage>(editing?.stage ?? 'LEAGUE')
  const [status, setStatus] = useState<MatchStatus>(editing?.status ?? 'SCHEDULED')
  const [result, setResult] = useState<MatchResult | ''>(editing?.result ?? '')
  const [innings1, setInnings1] = useState(inningsOf(editing, 1))
  const [innings2, setInnings2] = useState(inningsOf(editing, 2))
  const [summary, setSummary] = useState(editing?.summary ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const teamName = (id: string) => teams.find((t) => String(t.team_id) === id)?.team_name ?? 'Team'
  const sameTeams = team1 !== '' && team1 === team2
  const completed = status === 'COMPLETED'

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (sameTeams) return setError('Choose two different teams.')
    if (completed && !result) return setError('Choose who won (or tie) for a completed match.')
    setSaving(true)
    setError('')
    const body: MatchInput = {
      team1_id: Number(team1),
      team2_id: Number(team2),
      match_date: date || null,
      stage,
      status,
      result: completed ? (result as MatchResult) : null,
      team1_runs: toNumber(innings1.runs),
      team1_wickets: toNumber(innings1.wickets),
      team1_overs: toNumber(innings1.overs),
      team2_runs: toNumber(innings2.runs),
      team2_wickets: toNumber(innings2.wickets),
      team2_overs: toNumber(innings2.overs),
      summary: summary.trim() || null,
    }
    try {
      if (editing) await tournamentAdminApi.updateMatch(tournamentId, editing.match_id, body)
      else await tournamentAdminApi.createMatch(tournamentId, body)
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the match.')
      setSaving(false)
    }
  }

  const inningsFields = (label: string, value: Innings, onChange: (v: Innings) => void) => (
    <Row className="g-2 align-items-end mb-2">
      <Col xs={12} sm={4} className="fw-semibold small text-truncate">{label}</Col>
      <Col xs={4} sm={3}>
        <Form.Control
          type="number" min={0} placeholder="Runs" aria-label={`${label} runs`}
          value={value.runs} onChange={(e) => onChange({ ...value, runs: e.target.value })}
        />
      </Col>
      <Col xs={4} sm={2}>
        <Form.Control
          type="number" min={0} max={10} placeholder="Wkts" aria-label={`${label} wickets`}
          value={value.wickets} onChange={(e) => onChange({ ...value, wickets: e.target.value })}
        />
      </Col>
      <Col xs={4} sm={3}>
        <Form.Control
          type="number" min={0} step={0.1} placeholder="Overs" aria-label={`${label} overs`}
          value={value.overs} onChange={(e) => onChange({ ...value, overs: e.target.value })}
        />
      </Col>
    </Row>
  )

  return (
    <Modal show onHide={onClose} centered size="lg">
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>{editing ? 'Edit match' : 'Add match'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Row className="g-3 mb-3">
            <Form.Group as={Col} md={6} controlId="match-team1">
              <Form.Label>Team 1</Form.Label>
              <Form.Select value={team1} onChange={(e) => setTeam1(e.target.value)} required>
                {teams.map((t) => <option key={t.team_id} value={t.team_id}>{t.team_name}</option>)}
              </Form.Select>
            </Form.Group>
            <Form.Group as={Col} md={6} controlId="match-team2">
              <Form.Label>Team 2</Form.Label>
              <Form.Select value={team2} onChange={(e) => setTeam2(e.target.value)} isInvalid={sameTeams} required>
                {teams.map((t) => <option key={t.team_id} value={t.team_id}>{t.team_name}</option>)}
              </Form.Select>
              <Form.Control.Feedback type="invalid">Choose a different team.</Form.Control.Feedback>
            </Form.Group>
            <Form.Group as={Col} md={4} controlId="match-date">
              <Form.Label>Match date</Form.Label>
              <Form.Control type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Form.Group>
            <Form.Group as={Col} md={4} controlId="match-stage">
              <Form.Label>Stage</Form.Label>
              <Form.Select value={stage} onChange={(e) => setStage(e.target.value as MatchStage)}>
                {(Object.keys(STAGE_LABELS) as MatchStage[]).map((s) => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
              </Form.Select>
              <Form.Text muted>Only league matches count in the points table.</Form.Text>
            </Form.Group>
            <Form.Group as={Col} md={4} controlId="match-status">
              <Form.Label>Status</Form.Label>
              <Form.Select value={status} onChange={(e) => setStatus(e.target.value as MatchStatus)}>
                <option value="SCHEDULED">Scheduled</option>
                <option value="COMPLETED">Completed</option>
                <option value="NO_RESULT">No result / abandoned</option>
              </Form.Select>
            </Form.Group>
          </Row>

          {completed && (
            <Form.Group className="mb-3" controlId="match-result">
              <Form.Label>Result</Form.Label>
              <Form.Select value={result} onChange={(e) => setResult(e.target.value as MatchResult | '')} required>
                <option value="">Choose…</option>
                <option value="TEAM1">{teamName(team1)} won</option>
                <option value="TEAM2">{teamName(team2)} won</option>
                <option value="TIE">Tie</option>
              </Form.Select>
            </Form.Group>
          )}

          {completed && (
            <fieldset className="mb-3">
              <legend className="fs-6 mb-1">Scores <small className="text-muted fw-normal">(optional, used for net run rate)</small></legend>
              {inningsFields(teamName(team1), innings1, setInnings1)}
              {inningsFields(teamName(team2), innings2, setInnings2)}
              <Form.Text muted>
                Overs as overs.balls, e.g. 19.3. If a team was all out, enter the full quota of overs.
              </Form.Text>
            </fieldset>
          )}

          <Form.Group controlId="match-summary">
            <Form.Label>Summary <small className="text-muted">(optional)</small></Form.Label>
            <Form.Control
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              maxLength={300}
              placeholder="e.g. Warriors won by 5 wickets"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" disabled={saving || sameTeams}>{saving ? 'Saving…' : 'Save'}</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}
