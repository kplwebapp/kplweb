import { useEffect, useState } from 'react'
import { Alert, Badge, Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap'
import PageHeader, { AdminSection } from '@/admin/components/common/PageHeader'
import { statsApi } from '@/services/api/publicApi'
import {
  competitionApi,
  type InningsScore,
  type LiveMatchScore,
  type Match,
  type Season,
} from '@/services/api/competitionApi'
import { pickDefaultSeason } from '@/utils/season'

type InningsForm = {
  innings_number: number
  batting_team_id: number
  bowling_team_id: number
  total_runs: number
  total_wickets: number
  total_overs: number
  status: string
}

function emptyInnings(team1: number, team2: number, number: 1 | 2): InningsForm {
  return {
    innings_number: number,
    batting_team_id: number === 1 ? team1 : team2,
    bowling_team_id: number === 1 ? team2 : team1,
    total_runs: 0,
    total_wickets: 0,
    total_overs: 0,
    status: 'NOT_STARTED',
  }
}

function mapInningsFromApi(innings: InningsScore[] | null | undefined, team1: number, team2: number): InningsForm[] {
  const inn1 = innings?.find((i) => i.innings_number === 1)
  const inn2 = innings?.find((i) => i.innings_number === 2)
  return [
    inn1
      ? {
          innings_number: 1,
          batting_team_id: inn1.batting_team_id,
          bowling_team_id: inn1.bowling_team_id,
          total_runs: inn1.total_runs,
          total_wickets: inn1.total_wickets,
          total_overs: Number(inn1.total_overs),
          status: inn1.status || 'IN_PROGRESS',
        }
      : emptyInnings(team1, team2, 1),
    inn2
      ? {
          innings_number: 2,
          batting_team_id: inn2.batting_team_id,
          bowling_team_id: inn2.bowling_team_id,
          total_runs: inn2.total_runs,
          total_wickets: inn2.total_wickets,
          total_overs: Number(inn2.total_overs),
          status: inn2.status || 'NOT_STARTED',
        }
      : emptyInnings(team1, team2, 2),
  ]
}

export default function LiveScoringPage() {
  const [seasons, setSeasons] = useState<Season[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null)
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null)
  const [liveScore, setLiveScore] = useState<LiveMatchScore | null>(null)
  const [innings, setInnings] = useState<InningsForm[]>([])
  const [matchStatus, setMatchStatus] = useState('LIVE')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    statsApi
      .getSeasons()
      .then((res) => {
        const list = res.data ?? []
        setSeasons(list)
        const defaultSeason = pickDefaultSeason(list)
        if (defaultSeason) setSelectedSeasonId(defaultSeason.season_id)
      })
      .catch(() => setError('Failed to load seasons.'))
  }, [])

  useEffect(() => {
    if (!selectedSeasonId) return
    setLoading(true)
    competitionApi
      .listMatches(selectedSeasonId)
      .then((res) => {
        const list = res.data ?? []
        setMatches(list)
        const live = list.find((m) => m.status === 'LIVE') ?? list[0]
        setSelectedMatchId(live?.match_id ?? null)
      })
      .catch(() => setError('Failed to load matches.'))
      .finally(() => setLoading(false))
  }, [selectedSeasonId])

  useEffect(() => {
    if (!selectedMatchId) {
      setLiveScore(null)
      setInnings([])
      return
    }

    const match = matches.find((m) => m.match_id === selectedMatchId)
    setLoading(true)
    competitionApi
      .getLiveScore(selectedMatchId)
      .then((res) => {
        const data = res.data
        setLiveScore(data)
        setMatchStatus(data.status || match?.status || 'LIVE')
        setInnings(
          mapInningsFromApi(
            data.innings,
            match?.team1_id ?? data.team1_id,
            match?.team2_id ?? data.team2_id
          )
        )
      })
      .catch(() => {
        if (match) {
          setInnings(mapInningsFromApi([], match.team1_id, match.team2_id))
          setMatchStatus(match.status)
        }
      })
      .finally(() => setLoading(false))
  }, [selectedMatchId, matches])

  const selectedMatch = matches.find((m) => m.match_id === selectedMatchId)

  const updateInnings = (index: number, field: keyof InningsForm, value: number | string) => {
    setInnings((prev) =>
      prev.map((inn, i) => (i === index ? { ...inn, [field]: value } : inn))
    )
  }

  const handleSave = async () => {
    if (!selectedMatchId) return
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const res = await competitionApi.updateScores(selectedMatchId, {
        matchStatus,
        innings: innings.map((inn) => ({
          innings_number: inn.innings_number,
          batting_team_id: inn.batting_team_id,
          bowling_team_id: inn.bowling_team_id,
          total_runs: Number(inn.total_runs),
          total_wickets: Number(inn.total_wickets),
          total_overs: Number(inn.total_overs),
          status: inn.status,
        })),
      })
      setLiveScore(res.data)
      setSuccess('Scores saved.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminSection>
      <PageHeader
        title="Live Scoring"
        description="Enter and update match scores — reflected on the public Live Scores page."
        actions={
          <Button variant="success" size="sm" onClick={handleSave} disabled={!selectedMatchId || saving}>
            {saving ? 'Saving...' : 'Save Scores'}
          </Button>
        }
      />

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Row className="g-3 mb-3">
        <Col md={4}>
          <Form.Select
            value={selectedSeasonId ?? ''}
            onChange={(e) => setSelectedSeasonId(Number(e.target.value))}
          >
            {seasons.map((s) => (
              <option key={s.season_id} value={s.season_id}>
                {s.season_name} ({s.season_year})
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col md={8}>
          <Form.Select
            value={selectedMatchId ?? ''}
            onChange={(e) => setSelectedMatchId(Number(e.target.value))}
          >
            {matches.map((m) => (
              <option key={m.match_id} value={m.match_id}>
                {m.team1_name} vs {m.team2_name} — {m.status}
              </option>
            ))}
          </Form.Select>
        </Col>
      </Row>

      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" /></div>
      ) : !selectedMatch ? (
        <p className="text-muted">Select a match to enter scores.</p>
      ) : (
        <Row className="g-3">
          <Col lg={8}>
            <Card className="border-0 shadow-sm">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <span>{selectedMatch.team1_name} vs {selectedMatch.team2_name}</span>
                <Badge bg={matchStatus === 'LIVE' ? 'danger' : 'secondary'}>{matchStatus}</Badge>
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-4">
                  <Form.Label>Match Status</Form.Label>
                  <Form.Select value={matchStatus} onChange={(e) => setMatchStatus(e.target.value)}>
                    <option value="SCHEDULED">SCHEDULED</option>
                    <option value="LIVE">LIVE</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </Form.Select>
                </Form.Group>

                {innings.map((inn, index) => {
                  const battingTeam =
                    inn.batting_team_id === selectedMatch.team1_id
                      ? selectedMatch.team1_name
                      : selectedMatch.team2_name
                  return (
                    <div key={inn.innings_number} className="mb-4 p-3 border rounded">
                      <h6 className="mb-3">Innings {inn.innings_number} — {battingTeam}</h6>
                      <Row className="g-2">
                        <Col md={3}>
                          <Form.Label>Runs</Form.Label>
                          <Form.Control
                            type="number"
                            min={0}
                            value={inn.total_runs}
                            onChange={(e) => updateInnings(index, 'total_runs', Number(e.target.value))}
                          />
                        </Col>
                        <Col md={3}>
                          <Form.Label>Wickets</Form.Label>
                          <Form.Control
                            type="number"
                            min={0}
                            max={10}
                            value={inn.total_wickets}
                            onChange={(e) => updateInnings(index, 'total_wickets', Number(e.target.value))}
                          />
                        </Col>
                        <Col md={3}>
                          <Form.Label>Overs</Form.Label>
                          <Form.Control
                            type="number"
                            min={0}
                            step={0.1}
                            value={inn.total_overs}
                            onChange={(e) => updateInnings(index, 'total_overs', Number(e.target.value))}
                          />
                        </Col>
                        <Col md={3}>
                          <Form.Label>Status</Form.Label>
                          <Form.Select
                            value={inn.status}
                            onChange={(e) => updateInnings(index, 'status', e.target.value)}
                          >
                            <option value="NOT_STARTED">Not started</option>
                            <option value="IN_PROGRESS">In progress</option>
                            <option value="COMPLETED">Completed</option>
                          </Form.Select>
                        </Col>
                      </Row>
                      <div className="mt-2 text-muted small">
                        Score: {inn.total_runs}/{inn.total_wickets} ({inn.total_overs} overs)
                      </div>
                    </div>
                  )
                })}
              </Card.Body>
            </Card>
          </Col>
          <Col lg={4}>
            <Card className="border-0 shadow-sm">
              <Card.Header>Live Summary</Card.Header>
              <Card.Body>
                {liveScore?.innings?.length ? (
                  liveScore.innings.map((inn) => (
                    <div key={inn.innings_number} className="mb-2">
                      <strong>Innings {inn.innings_number}</strong>
                      <div>{inn.total_runs}/{inn.total_wickets} ({inn.total_overs} ov)</div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted small mb-0">No innings recorded yet. Enter scores and save.</p>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </AdminSection>
  )
}
