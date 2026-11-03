import { useMemo, useState, type FormEvent } from 'react'
import { Alert, Badge, Button, Col, Form, Nav, Row, Table } from 'react-bootstrap'
import type {
  CricketInningsScore,
  CricketScoreboardData,
  MatchResult,
  MatchStatus,
  TournamentMatch,
} from '@/services/api/tournamentApi'
import { tournamentAdminApi } from '@/services/api/tournamentApi'
import {
  emptyBatsman,
  emptyBowler,
  formatInningsScore,
  matchPayloadFromScoreboard,
  scoreboardFromMatch,
} from './cricketScoreHelpers'
import './scoresTab.css'

type Props = {
  tournamentId: number
  match: TournamentMatch
  onBack: () => void
  onSaved: () => void
}

type BoardTab = 'live' | 'full'

function updateInnings(
  board: CricketScoreboardData,
  inningsNumber: number,
  patch: Partial<CricketInningsScore>,
): CricketScoreboardData {
  return {
    ...board,
    innings: board.innings.map((inn) =>
      inn.number === inningsNumber ? { ...inn, ...patch } : inn,
    ),
  }
}

export default function CricketScoreboard({ tournamentId, match, onBack, onSaved }: Props) {
  const [board, setBoard] = useState(() => scoreboardFromMatch(match))
  const [status, setStatus] = useState<MatchStatus>(match.status)
  const [result, setResult] = useState<MatchResult | ''>(match.result ?? '')
  const [summary, setSummary] = useState(match.summary ?? '')
  const [tab, setTab] = useState<BoardTab>('live')
  const [activeInnings, setActiveInnings] = useState(
    () => board.live?.current_innings ?? (match.team2_runs != null ? 2 : 1),
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  const inn = board.innings.find((i) => i.number === activeInnings) ?? board.innings[0]
  const battingName = inn.batting_team_id === match.team1_id ? match.team1_name : match.team2_name
  const bowlingName = inn.bowling_team_id === match.team1_id ? match.team1_name : match.team2_name

  const headerScores = useMemo(() => {
    const t1 = board.innings.find((i) => i.batting_team_id === match.team1_id)
    const t2 = board.innings.find((i) => i.batting_team_id === match.team2_id)
    return {
      team1: t1 ? formatInningsScore(t1) : '—',
      team2: t2 ? formatInningsScore(t2) : '—',
    }
  }, [board, match.team1_id, match.team2_id])

  const setInn = (patch: Partial<CricketInningsScore>) => {
    setBoard((prev) => updateInnings(prev, inn.number, patch))
  }

  const startLive = () => {
    setStatus('LIVE')
    setBoard((prev) => {
      const first = prev.innings[0]
      const next = updateInnings(prev, 1, { status: 'IN_PROGRESS' })
      return {
        ...next,
        live: { batting_team_id: first.batting_team_id, current_innings: 1 },
      }
    })
    setActiveInnings(1)
    setTab('live')
  }

  const swapInnings = () => {
    const nextNum = (activeInnings === 1 ? 2 : 1) as 1 | 2
    setBoard((prev) => {
      const next = prev.innings.find((i) => i.number === nextNum)!
      let updated = updateInnings(prev, activeInnings, { status: 'COMPLETED' })
      updated = updateInnings(updated, nextNum, { status: 'IN_PROGRESS' })
      return {
        ...updated,
        live: { batting_team_id: next.batting_team_id, current_innings: nextNum },
      }
    })
    setActiveInnings(nextNum)
    setStatus('LIVE')
  }

  const handleSave = async (e?: FormEvent) => {
    e?.preventDefault()
    if (status === 'COMPLETED' && !result) {
      setError('Choose who won (or draw/tie) before marking completed.')
      return
    }
    setSaving(true)
    setError('')
    setOk('')
    const live =
      status === 'LIVE'
        ? {
            batting_team_id: inn.batting_team_id,
            current_innings: inn.number,
          }
        : null
    const payloadBoard: CricketScoreboardData = { ...board, live }
    try {
      await tournamentAdminApi.updateMatch(
        tournamentId,
        match.match_id,
        matchPayloadFromScoreboard(
          match,
          payloadBoard,
          status,
          status === 'COMPLETED' ? (result as MatchResult) : null,
          summary.trim() || null,
        ),
      )
      setOk('Scoreboard saved.')
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save scoreboard.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="kpl-scoreboard">
      <div className="d-flex justify-content-between align-items-start gap-2 flex-wrap mb-3">
        <div>
          <Button variant="link" className="px-0 mb-1" onClick={onBack}>
            ← Back to schedule
          </Button>
          <h5 className="mb-1">
            {match.team1_name} vs {match.team2_name}
            {status === 'LIVE' && (
              <Badge bg="danger" className="ms-2 kpl-live-pulse">
                LIVE
              </Badge>
            )}
          </h5>
          <div className="text-muted small">
            {[match.match_date, match.match_time, match.venue].filter(Boolean).join(' · ') || 'Schedule TBA'}
          </div>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          {status === 'SCHEDULED' && (
            <Button size="sm" variant="danger" onClick={startLive}>
              Start live
            </Button>
          )}
          {status === 'LIVE' && (
            <Button size="sm" variant="outline-secondary" onClick={swapInnings}>
              Start {activeInnings === 1 ? '2nd' : '1st'} innings
            </Button>
          )}
          <Button size="sm" variant="primary" disabled={saving} onClick={() => void handleSave()}>
            {saving ? 'Saving…' : 'Save scoreboard'}
          </Button>
        </div>
      </div>

      <div className="kpl-scoreboard-hero mb-3">
        <div className="kpl-score-team">
          <div className="kpl-score-name">{match.team1_name}</div>
          <div className="kpl-score-value">{headerScores.team1}</div>
        </div>
        <div className="kpl-score-vs">vs</div>
        <div className="kpl-score-team text-end">
          <div className="kpl-score-name">{match.team2_name}</div>
          <div className="kpl-score-value">{headerScores.team2}</div>
        </div>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {ok && (
        <Alert variant="success" dismissible onClose={() => setOk('')}>
          {ok}
        </Alert>
      )}

      <Row className="g-3 mb-3">
        <Form.Group as={Col} md={3} controlId="sb-status">
          <Form.Label>Match status</Form.Label>
          <Form.Select value={status} onChange={(e) => setStatus(e.target.value as MatchStatus)}>
            <option value="SCHEDULED">Scheduled</option>
            <option value="LIVE">Live</option>
            <option value="COMPLETED">Completed</option>
            <option value="NO_RESULT">No result</option>
          </Form.Select>
        </Form.Group>
        <Form.Group as={Col} md={3} controlId="sb-result">
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
        <Form.Group as={Col} md={6} controlId="sb-summary">
          <Form.Label>Summary</Form.Label>
          <Form.Control
            value={summary}
            maxLength={300}
            placeholder="e.g. Won by 24 runs"
            onChange={(e) => setSummary(e.target.value)}
          />
        </Form.Group>
      </Row>

      <Nav variant="pills" activeKey={tab} onSelect={(k) => k && setTab(k as BoardTab)} className="mb-3 gap-2">
        <Nav.Item>
          <Nav.Link eventKey="live">Live</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="full">Full scorecard</Nav.Link>
        </Nav.Item>
      </Nav>

      <div className="mb-2 d-flex gap-2 flex-wrap">
        {board.innings.map((i) => (
          <Button
            key={i.number}
            size="sm"
            variant={activeInnings === i.number ? 'dark' : 'outline-dark'}
            onClick={() => setActiveInnings(i.number)}
          >
            Innings {i.number}
            {i.status === 'IN_PROGRESS' ? ' · batting' : ''}
          </Button>
        ))}
      </div>

      {tab === 'live' && (
        <div className="kpl-live-panel">
          <div className="mb-3">
            <strong>{battingName}</strong> batting · <span className="text-muted">{bowlingName} bowling</span>
          </div>
          <Row className="g-3 mb-3">
            <Form.Group as={Col} xs={4} controlId="live-runs">
              <Form.Label>Runs</Form.Label>
              <Form.Control
                type="number"
                min={0}
                value={inn.runs}
                onChange={(e) => setInn({ runs: Number(e.target.value) || 0, status: 'IN_PROGRESS' })}
              />
            </Form.Group>
            <Form.Group as={Col} xs={4} controlId="live-wkts">
              <Form.Label>Wickets</Form.Label>
              <Form.Control
                type="number"
                min={0}
                max={10}
                value={inn.wickets}
                onChange={(e) => setInn({ wickets: Number(e.target.value) || 0 })}
              />
            </Form.Group>
            <Form.Group as={Col} xs={4} controlId="live-overs">
              <Form.Label>Overs</Form.Label>
              <Form.Control
                type="number"
                min={0}
                step={0.1}
                value={inn.overs}
                onChange={(e) => setInn({ overs: Number(e.target.value) || 0 })}
              />
            </Form.Group>
          </Row>
          <Row className="g-2">
            {(['wides', 'noballs', 'byes', 'legbyes'] as const).map((key) => (
              <Form.Group as={Col} xs={6} md={3} key={key} controlId={`ex-${key}`}>
                <Form.Label className="text-capitalize">{key}</Form.Label>
                <Form.Control
                  type="number"
                  min={0}
                  value={inn.extras[key]}
                  onChange={(e) => {
                    const next = { ...inn.extras, [key]: Number(e.target.value) || 0 }
                    next.total = next.wides + next.noballs + next.byes + next.legbyes
                    setInn({ extras: next })
                  }}
                />
              </Form.Group>
            ))}
          </Row>
          <p className="text-muted small mt-3 mb-0">
            Extras total: <strong>{inn.extras.total}</strong>. Use Full scorecard for batsman and bowler details.
          </p>
        </div>
      )}

      {tab === 'full' && (
        <div className="kpl-full-card">
          <h6 className="mb-2">
            {battingName} — batting ({formatInningsScore(inn)})
          </h6>
          <Table responsive size="sm" bordered className="bg-white align-middle mb-2">
            <thead className="table-light">
              <tr>
                <th>Batter</th>
                <th>Dismissal</th>
                <th className="text-end">R</th>
                <th className="text-end">B</th>
                <th className="text-end">4s</th>
                <th className="text-end">6s</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {inn.batting.map((row, idx) => (
                <tr key={idx}>
                  <td>
                    <Form.Control
                      size="sm"
                      value={row.name}
                      placeholder="Name"
                      onChange={(e) => {
                        const batting = inn.batting.map((r, i) =>
                          i === idx ? { ...r, name: e.target.value } : r,
                        )
                        setInn({ batting })
                      }}
                    />
                  </td>
                  <td>
                    <Form.Control
                      size="sm"
                      value={row.dismissal}
                      onChange={(e) => {
                        const batting = inn.batting.map((r, i) =>
                          i === idx ? { ...r, dismissal: e.target.value } : r,
                        )
                        setInn({ batting })
                      }}
                    />
                  </td>
                  {(['runs', 'balls', 'fours', 'sixes'] as const).map((field) => (
                    <td key={field}>
                      <Form.Control
                        size="sm"
                        type="number"
                        min={0}
                        className="text-end"
                        value={row[field]}
                        onChange={(e) => {
                          const batting = inn.batting.map((r, i) =>
                            i === idx ? { ...r, [field]: Number(e.target.value) || 0 } : r,
                          )
                          setInn({ batting })
                        }}
                      />
                    </td>
                  ))}
                  <td className="text-end">
                    <Button
                      size="sm"
                      variant="link"
                      className="text-danger px-1"
                      onClick={() => setInn({ batting: inn.batting.filter((_, i) => i !== idx) })}
                    >
                      ×
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          <Button size="sm" variant="outline-primary" className="mb-4" onClick={() => setInn({ batting: [...inn.batting, emptyBatsman()] })}>
            Add batsman
          </Button>

          <h6 className="mb-2">{bowlingName} — bowling</h6>
          <Table responsive size="sm" bordered className="bg-white align-middle mb-2">
            <thead className="table-light">
              <tr>
                <th>Bowler</th>
                <th className="text-end">O</th>
                <th className="text-end">M</th>
                <th className="text-end">R</th>
                <th className="text-end">W</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {inn.bowling.map((row, idx) => (
                <tr key={idx}>
                  <td>
                    <Form.Control
                      size="sm"
                      value={row.name}
                      placeholder="Name"
                      onChange={(e) => {
                        const bowling = inn.bowling.map((r, i) =>
                          i === idx ? { ...r, name: e.target.value } : r,
                        )
                        setInn({ bowling })
                      }}
                    />
                  </td>
                  {(['overs', 'maidens', 'runs', 'wickets'] as const).map((field) => (
                    <td key={field}>
                      <Form.Control
                        size="sm"
                        type="number"
                        min={0}
                        step={field === 'overs' ? 0.1 : 1}
                        className="text-end"
                        value={row[field]}
                        onChange={(e) => {
                          const bowling = inn.bowling.map((r, i) =>
                            i === idx ? { ...r, [field]: Number(e.target.value) || 0 } : r,
                          )
                          setInn({ bowling })
                        }}
                      />
                    </td>
                  ))}
                  <td className="text-end">
                    <Button
                      size="sm"
                      variant="link"
                      className="text-danger px-1"
                      onClick={() => setInn({ bowling: inn.bowling.filter((_, i) => i !== idx) })}
                    >
                      ×
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          <Button size="sm" variant="outline-primary" className="mb-3" onClick={() => setInn({ bowling: [...inn.bowling, emptyBowler()] })}>
            Add bowler
          </Button>

          <Form.Group controlId="fow">
            <Form.Label>Fall of wickets (comma-separated)</Form.Label>
            <Form.Control
              value={inn.fall_of_wickets.join(', ')}
              placeholder="e.g. 12/1, 45/2, 88/3"
              onChange={(e) =>
                setInn({
                  fall_of_wickets: e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
            />
          </Form.Group>
        </div>
      )}
    </div>
  )
}
