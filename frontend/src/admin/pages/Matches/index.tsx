import { useEffect, useState, type FormEvent } from 'react'
import { Alert, Badge, Button, Form, Modal, Spinner, Table } from 'react-bootstrap'
import PageHeader, { AdminSection } from '@/admin/components/common/PageHeader'
import { statsApi } from '@/services/api/publicApi'
import {
  competitionApi,
  type CreateMatchPayload,
  type Match,
  type Season,
  type Team,
} from '@/services/api/competitionApi'
import { pickDefaultSeason } from '@/utils/season'

const MATCH_STATUSES = ['SCHEDULED', 'LIVE', 'COMPLETED', 'ABANDONED', 'CANCELLED'] as const

const emptyForm = {
  season_id: 0,
  team1_id: 0,
  team2_id: 0,
  venue: '',
  match_date: '',
  status: 'SCHEDULED',
  result_summary: '',
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    SCHEDULED: 'secondary',
    LIVE: 'danger',
    COMPLETED: 'success',
    ABANDONED: 'warning',
    CANCELLED: 'dark',
  }
  return <Badge bg={map[status] || 'secondary'}>{status}</Badge>
}

function formatDate(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

export default function MatchesPage() {
  const [seasons, setSeasons] = useState<Season[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Match | null>(null)
  const [form, setForm] = useState(emptyForm)

  const loadMatches = (seasonId: number | null) => {
    setLoading(true)
    competitionApi
      .listMatches(seasonId ?? undefined)
      .then((res) => setMatches(res.data ?? []))
      .catch(() => {
        setMatches([])
        setError('Failed to load matches.')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    Promise.all([statsApi.getSeasons(), competitionApi.listTeams()])
      .then(([seasonRes, teamRes]) => {
        const list = seasonRes.data ?? []
        setSeasons(list)
        setTeams((teamRes.data ?? []).filter((t) => t.is_active !== false))
        const defaultSeason = pickDefaultSeason(list)
        if (defaultSeason) setSelectedSeasonId(defaultSeason.season_id)
      })
      .catch(() => setError('Failed to load seasons or teams.'))
  }, [])

  useEffect(() => {
    loadMatches(selectedSeasonId)
  }, [selectedSeasonId])

  const openCreate = () => {
    setEditing(null)
    setForm({
      ...emptyForm,
      season_id: selectedSeasonId ?? seasons[0]?.season_id ?? 0,
    })
    setShowModal(true)
  }

  const openEdit = (match: Match) => {
    setEditing(match)
    setForm({
      season_id: match.season_id,
      team1_id: match.team1_id,
      team2_id: match.team2_id,
      venue: match.venue || '',
      match_date: match.match_date ? match.match_date.slice(0, 16) : '',
      status: match.status,
      result_summary: match.result_summary || '',
    })
    setShowModal(true)
  }

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    if (form.team1_id === form.team2_id) {
      setError('Teams must be different.')
      return
    }

    setSaving(true)
    setError('')
    try {
      const payload: CreateMatchPayload = {
        season_id: form.season_id,
        team1_id: form.team1_id,
        team2_id: form.team2_id,
        venue: form.venue || undefined,
        match_date: form.match_date ? new Date(form.match_date).toISOString() : undefined,
        status: form.status,
        result_summary: form.result_summary || undefined,
      }

      if (editing) {
        await competitionApi.updateMatch(editing.match_id, payload)
      } else {
        await competitionApi.createMatch(payload)
      }

      setShowModal(false)
      loadMatches(selectedSeasonId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  const fixtures = matches.filter((m) => m.status === 'SCHEDULED' || m.status === 'LIVE')
  const results = matches.filter((m) => m.status === 'COMPLETED')

  return (
    <AdminSection>
      <PageHeader
        title="Matches"
        description="Manage fixtures and results for the public Fixtures and Results pages."
        actions={<Button variant="primary" size="sm" onClick={openCreate}>Schedule Match</Button>}
      />

      {error && <Alert variant="danger">{error}</Alert>}

      <div className="d-flex flex-wrap gap-3 mb-3">
        <Form.Select
          style={{ maxWidth: 280 }}
          aria-label="Filter by season"
          value={selectedSeasonId ?? ''}
          onChange={(e) => setSelectedSeasonId(Number(e.target.value))}
        >
          {seasons.map((season) => (
            <option key={season.season_id} value={season.season_id}>
              {season.season_name} ({season.season_year})
            </option>
          ))}
        </Form.Select>
      </div>

      {loading ? (
        <div className="text-center py-4"><Spinner animation="border" size="sm" /></div>
      ) : (
        <>
          <h6 className="mb-2">Fixtures & Live</h6>
          <Table responsive striped bordered hover className="bg-white shadow-sm mb-4">
            <thead className="table-light">
              <tr>
                <th>Match</th>
                <th>Date</th>
                <th>Venue</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {fixtures.length === 0 ? (
                <tr><td colSpan={5} className="text-muted">No upcoming or live matches.</td></tr>
              ) : fixtures.map((m) => (
                <tr key={m.match_id}>
                  <td>{m.team1_name} vs {m.team2_name}</td>
                  <td>{formatDate(m.match_date)}</td>
                  <td>{m.venue || '—'}</td>
                  <td>{statusBadge(m.status)}</td>
                  <td><Button size="sm" variant="outline-primary" onClick={() => openEdit(m)}>Edit</Button></td>
                </tr>
              ))}
            </tbody>
          </Table>

          <h6 className="mb-2">Results</h6>
          <Table responsive striped bordered hover className="bg-white shadow-sm">
            <thead className="table-light">
              <tr>
                <th>Match</th>
                <th>Result</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {results.length === 0 ? (
                <tr><td colSpan={4} className="text-muted">No completed matches yet.</td></tr>
              ) : results.map((m) => (
                <tr key={m.match_id}>
                  <td>{m.team1_name} vs {m.team2_name}</td>
                  <td>{m.result_summary || '—'}</td>
                  <td>{formatDate(m.match_date)}</td>
                  <td><Button size="sm" variant="outline-primary" onClick={() => openEdit(m)}>Edit</Button></td>
                </tr>
              ))}
            </tbody>
          </Table>
        </>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editing ? 'Edit Match' : 'Schedule Match'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSave}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Season</Form.Label>
              <Form.Select
                value={form.season_id}
                onChange={(e) => setForm({ ...form, season_id: Number(e.target.value) })}
                required
              >
                {seasons.map((s) => (
                  <option key={s.season_id} value={s.season_id}>{s.season_name}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <div className="row g-3">
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Team 1</Form.Label>
                  <Form.Select
                    value={form.team1_id}
                    onChange={(e) => setForm({ ...form, team1_id: Number(e.target.value) })}
                    required
                  >
                    <option value={0}>Select team</option>
                    {teams.map((t) => (
                      <option key={t.team_id} value={t.team_id}>{t.team_name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Team 2</Form.Label>
                  <Form.Select
                    value={form.team2_id}
                    onChange={(e) => setForm({ ...form, team2_id: Number(e.target.value) })}
                    required
                  >
                    <option value={0}>Select team</option>
                    {teams.map((t) => (
                      <option key={t.team_id} value={t.team_id}>{t.team_name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
            </div>
            <Form.Group className="mb-3 mt-3">
              <Form.Label>Date & Time</Form.Label>
              <Form.Control
                type="datetime-local"
                value={form.match_date}
                onChange={(e) => setForm({ ...form, match_date: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Venue</Form.Label>
              <Form.Control
                value={form.venue}
                onChange={(e) => setForm({ ...form, venue: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {MATCH_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group>
              <Form.Label>Result Summary</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={form.result_summary}
                onChange={(e) => setForm({ ...form, result_summary: e.target.value })}
                placeholder="e.g. Warriors won by 24 runs"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </AdminSection>
  )
}
