import { useCallback, useState } from 'react'
import { Alert, Badge, Button, Spinner, Table } from 'react-bootstrap'
import { useReloadable } from '@/admin/hooks/useReloadable'
import { STAGE_LABELS, tournamentAdminApi, type TournamentMatch } from '@/services/api/tournamentApi'
import { formatEventDateRange } from '@/utils/eventDate'
import MatchFormModal from './MatchFormModal'
import { inningsText, matchResultText } from './matchText'

const STATUS_BADGE: Record<TournamentMatch['status'], string> = {
  SCHEDULED: 'primary',
  COMPLETED: 'success',
  NO_RESULT: 'secondary',
}

export default function MatchesTab({ tournamentId }: { tournamentId: number }) {
  const load = useCallback(
    () =>
      Promise.all([tournamentAdminApi.listMatches(tournamentId), tournamentAdminApi.listTeams(tournamentId)]).then(
        ([matches, teams]) => ({ matches: matches.data, teams: teams.data }),
      ),
    [tournamentId],
  )
  const { data, error, loading, reload } = useReloadable(load, String(tournamentId))
  const [modal, setModal] = useState<{ editing: TournamentMatch | null } | null>(null)
  const [actionError, setActionError] = useState('')

  if (loading) return <div className="text-center py-5"><Spinner animation="border" /></div>
  if (!data) return <Alert variant="danger">{error}</Alert>

  const handleDelete = async (m: TournamentMatch) => {
    if (!window.confirm(`Delete ${m.team1_name} vs ${m.team2_name}? The points table will be recalculated.`)) return
    setActionError('')
    try {
      await tournamentAdminApi.removeMatch(tournamentId, m.match_id)
      reload()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not delete the match.')
    }
  }

  const canAdd = data.teams.length >= 2

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3 gap-2 flex-wrap">
        <p className="text-muted mb-0">
          Record each match and its result. The points table is calculated from completed league matches.
        </p>
        <Button size="sm" disabled={!canAdd} onClick={() => setModal({ editing: null })}>Add Match</Button>
      </div>

      {!canAdd && <Alert variant="info">Add at least two teams on the Teams tab before recording matches.</Alert>}
      {actionError && <Alert variant="danger" dismissible onClose={() => setActionError('')}>{actionError}</Alert>}

      <Table responsive hover className="bg-white shadow-sm align-middle">
        <thead className="table-light">
          <tr>
            <th>Date</th>
            <th>Stage</th>
            <th>Match</th>
            <th>Result</th>
            <th className="text-end">Action</th>
          </tr>
        </thead>
        <tbody>
          {data.matches.length === 0 ? (
            <tr>
              <td colSpan={5} className="text-center text-muted py-4">No matches recorded yet.</td>
            </tr>
          ) : (
            data.matches.map((m) => {
              const score1 = inningsText(m.team1_runs, m.team1_wickets, m.team1_overs)
              const score2 = inningsText(m.team2_runs, m.team2_wickets, m.team2_overs)
              return (
                <tr key={m.match_id}>
                  <td className="text-nowrap">{formatEventDateRange(m.match_date, null) || 'TBA'}</td>
                  <td>{STAGE_LABELS[m.stage]}</td>
                  <td>
                    <div className="fw-semibold">{m.team1_name} vs {m.team2_name}</div>
                    {(score1 || score2) && (
                      <small className="text-muted">{score1 || '—'} · {score2 || '—'}</small>
                    )}
                  </td>
                  <td>
                    <Badge bg={STATUS_BADGE[m.status]} className="me-2">{matchResultText(m)}</Badge>
                    {m.summary && <small className="text-muted">{m.summary}</small>}
                  </td>
                  <td className="text-end">
                    <div className="d-inline-flex gap-2">
                      <Button size="sm" variant="outline-primary" onClick={() => setModal({ editing: m })}>Edit</Button>
                      <Button size="sm" variant="outline-danger" onClick={() => handleDelete(m)}>Delete</Button>
                    </div>
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </Table>

      {modal && (
        <MatchFormModal
          key={modal.editing?.match_id ?? 'new'}
          tournamentId={tournamentId}
          teams={data.teams}
          editing={modal.editing}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null)
            reload()
          }}
        />
      )}
    </>
  )
}
