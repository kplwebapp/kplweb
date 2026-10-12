import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert, Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap'
import { teamsPath } from '@/admin/config/sidebar'
import { useReloadable } from '@/admin/hooks/useReloadable'
import TeamBadge from '@/components/tournament/TeamBadge'
import { adminTeamsApi, tournamentAdminApi } from '@/services/api/tournamentApi'

type Props = {
  tournamentId: number
  categoryId: number | null
  categoryName: string | null
  categorySlug: string | null
}

export default function TeamsTab({ tournamentId, categoryId, categoryName, categorySlug }: Props) {
  const load = useCallback(
    () =>
      Promise.all([tournamentAdminApi.listTeams(tournamentId), adminTeamsApi.list(categoryId)]).then(([joined, all]) => ({
        joined: joined.data,
        all: all.data,
      })),
    [tournamentId, categoryId],
  )
  const game = categoryName?.toLowerCase() ?? ''
  const { data, error, loading, reload } = useReloadable(load, String(tournamentId))
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')

  if (loading) return <div className="text-center py-5"><Spinner animation="border" /></div>
  if (!data) return <Alert variant="danger">{error}</Alert>

  const joinedIds = new Set(data.joined.map((t) => t.team_id))
  const available = data.all.filter((t) => t.is_active && !joinedIds.has(t.team_id))

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true)
    setActionError('')
    try {
      await action()
      reload()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action failed.')
    } finally {
      setBusy(false)
    }
  }

  const toggle = (teamId: number) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(teamId)) next.delete(teamId)
      else next.add(teamId)
      return next
    })

  const addSelected = () =>
    run(async () => {
      await tournamentAdminApi.addTeams(tournamentId, [...selected])
      setSelected(new Set())
    })

  const remove = (teamId: number, name: string) => {
    if (!window.confirm(`Remove ${name} from this tournament?`)) return
    run(() => tournamentAdminApi.removeTeam(tournamentId, teamId))
  }

  return (
    <Row className="g-4">
      <Col lg={7}>
        <Card className="border-0 shadow-sm">
          <Card.Header className="bg-white fw-semibold">Participating teams ({data.joined.length})</Card.Header>
          <Card.Body>
            {actionError && <Alert variant="danger" dismissible onClose={() => setActionError('')}>{actionError}</Alert>}
            {data.joined.length === 0 ? (
              <p className="text-muted mb-0">No teams yet. Pick teams from the list to add them.</p>
            ) : (
              <ul className="list-unstyled mb-0">
                {data.joined.map((team) => (
                  <li key={team.team_id} className="d-flex align-items-center gap-3 py-2 border-bottom">
                    <TeamBadge name={team.team_name} logo={team.team_logo} size={36} />
                    <div className="flex-grow-1">
                      <div className="fw-semibold">{team.team_name}</div>
                      {team.short_name && <small className="text-muted">{team.short_name}</small>}
                    </div>
                    <Button
                      size="sm"
                      variant="outline-danger"
                      disabled={busy}
                      onClick={() => remove(team.team_id, team.team_name)}
                    >
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </Card.Body>
        </Card>
      </Col>

      <Col lg={5}>
        <Card className="border-0 shadow-sm">
          <Card.Header className="bg-white fw-semibold">Add {game} teams</Card.Header>
          <Card.Body>
            {available.length === 0 ? (
              <p className="text-muted">
                {data.all.some((t) => t.is_active)
                  ? `All active ${game} teams are already in this tournament.`
                  : `There are no ${game} teams yet. Add them in the master list first.`}
              </p>
            ) : (
              <div className="mb-3" style={{ maxHeight: 320, overflowY: 'auto' }}>
                {available.map((team) => (
                  <Form.Check
                    key={team.team_id}
                    id={`add-team-${team.team_id}`}
                    className="py-1"
                    label={team.team_name}
                    checked={selected.has(team.team_id)}
                    onChange={() => toggle(team.team_id)}
                  />
                ))}
              </div>
            )}
            <div className="d-flex justify-content-between align-items-center gap-2">
              <Link to={teamsPath(categorySlug)} className="small">
                Add or edit teams in the master list
              </Link>
              <Button size="sm" disabled={busy || selected.size === 0} onClick={addSelected}>
                Add selected{selected.size > 0 ? ` (${selected.size})` : ''}
              </Button>
            </div>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  )
}
