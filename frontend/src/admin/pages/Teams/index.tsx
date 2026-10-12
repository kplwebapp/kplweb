import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Alert, Badge, Button, Nav, Spinner, Table } from 'react-bootstrap'
import PageHeader, { AdminSection } from '@/admin/components/common/PageHeader'
import { useAdminContext } from '@/admin/context'
import { categoryIcon } from '@/admin/config/sidebar'
import TeamBadge from '@/components/tournament/TeamBadge'
import { adminTeamsApi, type Team } from '@/services/api/tournamentApi'
import type { Category } from '@/services/api/activitiesApi'
import TeamFormModal from './TeamFormModal'

type Result = { token: number; teams: Team[]; error: string }

/** /admin/teams?game=cricket — the master list of teams, one tab per game (tournament category). */
export default function TeamsPage() {
  const { categories, categoriesLoaded } = useAdminContext()
  const [searchParams, setSearchParams] = useSearchParams()
  const [reloadToken, setReloadToken] = useState(0)
  const [result, setResult] = useState<Result | null>(null)
  const [actionError, setActionError] = useState('')
  const [modal, setModal] = useState<{ editing: Team | null } | null>(null)

  useEffect(() => {
    let cancelled = false
    adminTeamsApi
      .list()
      .then((res) => { if (!cancelled) setResult({ token: reloadToken, teams: res.data, error: '' }) })
      .catch((err) => {
        if (!cancelled) setResult({ token: reloadToken, teams: [], error: err instanceof Error ? err.message : 'Failed to load teams.' })
      })
    return () => { cancelled = true }
  }, [reloadToken])

  const reload = () => setReloadToken((t) => t + 1)

  const toggleActive = async (team: Team) => {
    setActionError('')
    try {
      await adminTeamsApi.update(team.team_id, { is_active: !team.is_active })
      reload()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action failed.')
    }
  }

  const loading = !categoriesLoaded || result?.token !== reloadToken
  const teams = result?.teams ?? []

  // Visible games, plus hidden ones that still have teams so those teams stay reachable.
  const games: Category[] = categories.TOURNAMENT.filter(
    (c) => c.is_active || teams.some((t) => t.category_id === c.category_id),
  )
  const countFor = (game: Category) => teams.filter((t) => t.category_id === game.category_id).length
  const current = games.find((g) => g.slug === searchParams.get('game')) ?? games[0]
  const shown = current ? teams.filter((t) => t.category_id === current.category_id) : []

  const selectGame = (slug: string | null) => {
    if (slug) setSearchParams({ game: slug }, { replace: true })
  }

  return (
    <AdminSection>
      <PageHeader
        title="Teams"
        description="The master list of teams for each game. Add teams here, then pick them as participants on each tournament's Manage page."
        actions={
          <Button size="sm" onClick={() => setModal({ editing: null })} disabled={!current}>
            Add {current ? `${current.name} ` : ''}Team
          </Button>
        }
      />

      {(actionError || (!loading && result?.error)) && (
        <Alert variant="danger" dismissible={Boolean(actionError)} onClose={() => setActionError('')}>
          {actionError || result?.error}
        </Alert>
      )}

      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" /></div>
      ) : !current ? (
        <Alert variant="warning">Add a tournament category (for example Cricket) before adding teams.</Alert>
      ) : (
        <>
          <Nav variant="tabs" activeKey={current.slug} onSelect={selectGame} className="mb-3">
            {games.map((game) => (
              <Nav.Item key={game.category_id}>
                <Nav.Link eventKey={game.slug}>
                  <span className="me-1">{categoryIcon('TOURNAMENT', game.slug)}</span>
                  {game.name}
                  <Badge bg="light" text="dark" className="ms-2">{countFor(game)}</Badge>
                </Nav.Link>
              </Nav.Item>
            ))}
          </Nav>

          <Table responsive hover className="bg-white shadow-sm align-middle">
            <thead className="table-light">
              <tr>
                <th>Team</th>
                <th>Code</th>
                <th>Short name</th>
                <th>Status</th>
                <th className="text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-muted py-4">
                    No {current.name.toLowerCase()} teams yet. Add the first one.
                  </td>
                </tr>
              ) : (
                shown.map((team) => (
                  <tr key={team.team_id} className={team.is_active ? undefined : 'text-muted'}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <TeamBadge name={team.team_name} logo={team.team_logo} size={36} />
                        <span className="fw-semibold">{team.team_name}</span>
                      </div>
                    </td>
                    <td>{team.team_code || '—'}</td>
                    <td>{team.short_name || '—'}</td>
                    <td>
                      <Badge bg={team.is_active ? 'success' : 'secondary'}>{team.is_active ? 'Active' : 'Hidden'}</Badge>
                    </td>
                    <td className="text-end">
                      <div className="d-inline-flex gap-2">
                        <Button size="sm" variant="outline-primary" onClick={() => setModal({ editing: team })}>Edit</Button>
                        <Button size="sm" variant="outline-secondary" onClick={() => toggleActive(team)}>
                          {team.is_active ? 'Hide' : 'Show'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </>
      )}

      {modal && current && (
        <TeamFormModal
          key={modal.editing?.team_id ?? 'new'}
          editing={modal.editing}
          games={games}
          defaultGameId={current.category_id}
          onClose={() => setModal(null)}
          onSaved={(team) => {
            setModal(null)
            if (team && team.category_slug !== current.slug) selectGame(team.category_slug)
            reload()
          }}
        />
      )}
    </AdminSection>
  )
}
