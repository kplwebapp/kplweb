import { useEffect, useState } from 'react'
import { Card, Spinner, Alert, Row, Col } from 'react-bootstrap'
import PageShell from '@/components/common/PageShell'
import EmptyState from '@/components/tournament/EmptyState'
import TeamBadge from '@/components/tournament/TeamBadge'
import { teamsApi, type PublicTeam } from '@/services/api/publicApi'

export default function Teams() {
  const [teams, setTeams] = useState<PublicTeam[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    teamsApi
      .list()
      .then((res) => {
        if (!cancelled) {
          setTeams((res.data ?? []).filter((t) => t.is_active !== false))
          setError('')
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setTeams([])
          setError(err instanceof Error ? err.message : 'Could not load teams.')
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <PageShell title="Teams" description="Browse all KPL teams and squads.">
      {error ? <Alert variant="danger">{error}</Alert> : null}
      {teams == null ? (
        <div className="text-center py-5">
          <Spinner animation="border" size="sm" className="me-2" />
          Loading teams…
        </div>
      ) : teams.length === 0 ? (
        <EmptyState art="teams" title="No teams available yet" compact>
          Teams will appear here once they are added for the season.
        </EmptyState>
      ) : (
        <Row xs={1} sm={2} lg={3} className="g-3">
          {teams.map((team) => (
            <Col key={team.team_id}>
              <Card className="h-100 shadow-sm border-0">
                <Card.Body className="d-flex align-items-center gap-3">
                  <TeamBadge name={team.team_name} logo={team.team_logo} size={72} />
                  <div>
                    <div className="fw-semibold fs-5">{team.team_name}</div>
                    {team.team_code ? <div className="text-muted small">{team.team_code}</div> : null}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </PageShell>
  )
}
