import { useEffect, useState } from 'react'
import { Alert, Button, Form, Spinner, Table } from 'react-bootstrap'
import PageHeader, { AdminSection } from '@/admin/components/common/PageHeader'
import { statsApi } from '@/services/api/publicApi'
import { competitionApi, type PointsTableRow, type Season } from '@/services/api/competitionApi'
import { pickDefaultSeason } from '@/utils/season'

type EditableRow = PointsTableRow & { _key: string }

function sortByPointsDesc(rows: PointsTableRow[]) {
  return [...rows].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    return Number(b.net_run_rate) - Number(a.net_run_rate)
  })
}

function toEditable(rows: PointsTableRow[]): EditableRow[] {
  return rows.map((row) => ({ ...row, _key: String(row.points_table_id || row.team_id) }))
}

export default function PointsTablePage() {
  const [seasons, setSeasons] = useState<Season[]>([])
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null)
  const [standings, setStandings] = useState<EditableRow[]>([])
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
      .catch(() => setSeasons([]))
      .finally(() => setLoading(false))
  }, [])

  const loadStandings = (seasonId: number) => {
    setLoading(true)
    setError('')
    statsApi
      .getPointsTable(seasonId)
      .then((res) => setStandings(toEditable(sortByPointsDesc(res.data ?? []))))
      .catch(() => {
        setStandings([])
        setError('Failed to load standings.')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (selectedSeasonId == null) {
      setStandings([])
      return
    }
    loadStandings(selectedSeasonId)
  }, [selectedSeasonId])

  const updateRow = (key: string, field: keyof EditableRow, value: number) => {
    setStandings((prev) =>
      prev.map((row) => (row._key === key ? { ...row, [field]: value } : row))
    )
  }

  const handleSave = async () => {
    if (selectedSeasonId == null) return
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const res = await competitionApi.updatePointsTable(
        selectedSeasonId,
        standings.map((row) => ({
          points_table_id: row.points_table_id,
          team_id: row.team_id,
          matches_played: Number(row.matches_played),
          matches_won: Number(row.matches_won),
          matches_lost: Number(row.matches_lost),
          matches_tied: Number(row.matches_tied ?? 0),
          matches_nr: Number(row.matches_nr ?? 0),
          points: Number(row.points),
          net_run_rate: Number(row.net_run_rate),
        }))
      )
      setStandings(toEditable(sortByPointsDesc(res.data ?? [])))
      setSuccess('Points table saved successfully.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminSection>
      <PageHeader
        title="Points Table"
        description="Manage league standings shown on the public Points Table and Home page."
        actions={
          <Button variant="primary" size="sm" onClick={handleSave} disabled={saving || standings.length === 0}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        }
      />

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {seasons.length > 0 && (
        <div className="mb-3" style={{ maxWidth: 280 }}>
          <Form.Select
            aria-label="Select season"
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
      )}

      {loading ? (
        <div className="text-center py-4">
          <Spinner animation="border" size="sm" />
        </div>
      ) : standings.length === 0 ? (
        <p className="text-muted">No standings for this season yet.</p>
      ) : (
        <Table responsive striped bordered hover className="bg-white shadow-sm">
          <thead className="table-light">
            <tr>
              <th>Team</th>
              <th>P</th>
              <th>W</th>
              <th>L</th>
              <th>T</th>
              <th>NR</th>
              <th>Pts</th>
              <th>NRR</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((row) => (
              <tr key={row._key}>
                <td>{row.team_name}</td>
                <td>
                  <Form.Control
                    type="number"
                    size="sm"
                    min={0}
                    value={row.matches_played}
                    onChange={(e) => updateRow(row._key, 'matches_played', Number(e.target.value))}
                  />
                </td>
                <td>
                  <Form.Control
                    type="number"
                    size="sm"
                    min={0}
                    value={row.matches_won}
                    onChange={(e) => updateRow(row._key, 'matches_won', Number(e.target.value))}
                  />
                </td>
                <td>
                  <Form.Control
                    type="number"
                    size="sm"
                    min={0}
                    value={row.matches_lost}
                    onChange={(e) => updateRow(row._key, 'matches_lost', Number(e.target.value))}
                  />
                </td>
                <td>
                  <Form.Control
                    type="number"
                    size="sm"
                    min={0}
                    value={row.matches_tied ?? 0}
                    onChange={(e) => updateRow(row._key, 'matches_tied', Number(e.target.value))}
                  />
                </td>
                <td>
                  <Form.Control
                    type="number"
                    size="sm"
                    min={0}
                    value={row.matches_nr ?? 0}
                    onChange={(e) => updateRow(row._key, 'matches_nr', Number(e.target.value))}
                  />
                </td>
                <td>
                  <Form.Control
                    type="number"
                    size="sm"
                    min={0}
                    value={row.points}
                    onChange={(e) => updateRow(row._key, 'points', Number(e.target.value))}
                  />
                </td>
                <td>
                  <Form.Control
                    type="number"
                    size="sm"
                    step="0.001"
                    value={row.net_run_rate}
                    onChange={(e) => updateRow(row._key, 'net_run_rate', Number(e.target.value))}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </AdminSection>
  )
}
