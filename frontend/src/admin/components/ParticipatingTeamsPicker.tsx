import { Button, Form } from 'react-bootstrap'
import { teamsPath } from '@/admin/config/sidebar'
import TeamBadge from '@/components/tournament/TeamBadge'
import type { Team } from '@/services/api/tournamentApi'

type Props = {
  gameName: string
  gameSlug: string
  teams: Team[] | null
  error: string
  selected: Set<number>
  onChange: (next: Set<number>) => void
}

/** Checkbox list of a game's teams, used when adding or editing a tournament. */
export default function ParticipatingTeamsPicker({ gameName, gameSlug, teams, error, selected, onChange }: Props) {
  const game = gameName.toLowerCase()

  const toggle = (teamId: number) => {
    const next = new Set(selected)
    if (next.has(teamId)) next.delete(teamId)
    else next.add(teamId)
    onChange(next)
  }

  const manageLink = (
    <a href={teamsPath(gameSlug)} target="_blank" rel="noreferrer">
      {teams?.length ? `Add or edit ${game} teams ↗` : `Add ${game} teams ↗`}
    </a>
  )

  return (
    <Form.Group className="mb-3">
      <div className="d-flex flex-wrap justify-content-between align-items-baseline gap-2 mb-2">
        <Form.Label className="mb-0">
          Participating teams{' '}
          <small className="text-muted">({selected.size} selected · optional, can be changed later)</small>
        </Form.Label>
        {teams && teams.length > 1 && (
          <div className="d-flex gap-2">
            <Button variant="link" size="sm" className="p-0" onClick={() => onChange(new Set(teams.map((t) => t.team_id)))}>
              Select all
            </Button>
            <Button variant="link" size="sm" className="p-0" onClick={() => onChange(new Set())} disabled={selected.size === 0}>
              Clear
            </Button>
          </div>
        )}
      </div>

      {error ? (
        <div className="text-danger small">{error}</div>
      ) : teams === null ? (
        <div className="text-muted small">Loading {game} teams…</div>
      ) : teams.length === 0 ? (
        <div className="participating-teams participating-teams--empty text-muted small">
          There are no {game} teams yet. {manageLink}, then reopen this form to pick them.
        </div>
      ) : (
        <>
          <div className="participating-teams">
            {teams.map((team) => (
              <Form.Check
                key={team.team_id}
                id={`participating-team-${team.team_id}`}
                className="participating-teams__item"
              >
                <Form.Check.Input checked={selected.has(team.team_id)} onChange={() => toggle(team.team_id)} />
                <Form.Check.Label className="d-flex align-items-center gap-2">
                  <TeamBadge name={team.team_name} logo={team.team_logo} size={24} />
                  <span>{team.team_name}</span>
                  {!team.is_active && <small className="text-muted">(hidden)</small>}
                </Form.Check.Label>
              </Form.Check>
            ))}
          </div>
          <Form.Text muted className="d-block mt-1">Only {game} teams are listed. {manageLink}</Form.Text>
        </>
      )}
    </Form.Group>
  )
}
