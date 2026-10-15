import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert, Button, Card, Form, Spinner, Table } from 'react-bootstrap'
import { teamsPath } from '@/admin/config/sidebar'
import { useReloadable } from '@/admin/hooks/useReloadable'
import TeamBadge from '@/components/tournament/TeamBadge'
import { auctionAdminApi } from '@/services/api/auctionApi'
import { formatPoints } from '@/utils/auctionText'
import type { TabProps } from './shared'

type Row = { selected: boolean; budget: string; max_players: string }

const OPEN = ['DRAFT', 'READY', 'LIVE', 'PAUSED']

export default function TeamsTab({ detail, auctionId, run }: TabProps) {
  const { auction, teams, can } = detail
  const load = useCallback(() => auctionAdminApi.teamOptions(auctionId).then((res) => res.data), [auctionId])
  const { data: options, error: loadError } = useReloadable(load, String(auctionId))

  const defaults = { budget: String(Number(auction.budget_per_team)), max_players: String(auction.max_players_per_team) }
  const [rows, setRows] = useState<Record<number, Row>>(() =>
    Object.fromEntries(teams.map((t) => [t.team_id, { selected: true, budget: String(t.budget), max_players: String(t.max_players) }])),
  )
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const editable = can.manage && !auction.is_legacy && OPEN.includes(auction.status)
  const started = !['DRAFT', 'READY'].includes(auction.status)
  const joined = new Map(teams.map((t) => [t.team_id, t]))
  const row = (teamId: number): Row => rows[teamId] ?? { selected: false, ...defaults }
  const set = (teamId: number, patch: Partial<Row>) => setRows((prev) => ({ ...prev, [teamId]: { ...row(teamId), ...patch } }))

  if (!options) return loadError ? <Alert variant="danger">{loadError}</Alert> : <div className="text-center py-5"><Spinner animation="border" /></div>

  // Teams from the tournament first, then any other active cricket team.
  const list = [...options].sort((a, b) => Number(b.in_tournament) - Number(a.in_tournament) || a.team_name.localeCompare(b.team_name))
  const selected = list.filter((t) => row(t.team_id).selected)

  const save = async () => {
    const payload = selected.map((t) => ({
      team_id: t.team_id,
      budget: Number(row(t.team_id).budget),
      max_players: Number(row(t.team_id).max_players),
    }))
    const bad = payload.find((t) => !Number.isInteger(t.budget) || t.budget < 0 || !Number.isInteger(t.max_players) || t.max_players < 1)
    if (bad) {
      setError('Budgets must be whole numbers of points, and every squad needs at least one place.')
      return
    }
    setError('')
    setBusy(true)
    await run(() => auctionAdminApi.setTeams(auctionId, payload), 'Teams saved.')
    setBusy(false)
  }

  return (
    <Card className="border-0 shadow-sm">
      <Card.Header className="bg-white fw-semibold d-flex justify-content-between align-items-center">
        <span>Participating teams ({selected.length})</span>
        <Link to={teamsPath('cricket')} className="small fw-normal">Add or edit teams in the master list</Link>
      </Card.Header>
      <Card.Body className="p-0">
        {(error || loadError) && <Alert variant="danger" className="m-3">{error || loadError}</Alert>}
        {started && editable && (
          <Alert variant="info" className="m-3 py-2 small">
            Bidding has started: teams can join and budgets or squad sizes can change, but no team can be removed and no
            budget can drop below what the team has already spent.
          </Alert>
        )}
        {list.length === 0 ? (
          <p className="text-muted p-3 mb-0">There are no active cricket teams yet.</p>
        ) : (
          <Table responsive className="mb-0 align-middle">
            <thead className="table-light">
              <tr>
                <th style={{ width: 40 }} />
                <th>Team</th>
                <th style={{ width: 170 }}>Budget (points)</th>
                <th style={{ width: 120 }}>Squad size</th>
                <th className="text-end">Spent</th>
                <th className="text-end">Players</th>
              </tr>
            </thead>
            <tbody>
              {list.map((t) => {
                const r = row(t.team_id)
                const current = joined.get(t.team_id)
                const lockedIn = started && Boolean(current)
                return (
                  <tr key={t.team_id} className={r.selected ? '' : 'text-muted'}>
                    <td>
                      <Form.Check
                        id={`auction-team-${t.team_id}`}
                        aria-label={`Include ${t.team_name}`}
                        checked={r.selected}
                        disabled={!editable || lockedIn}
                        onChange={(e) => set(t.team_id, { selected: e.target.checked })}
                      />
                    </td>
                    <td>
                      <label htmlFor={`auction-team-${t.team_id}`} className="d-flex align-items-center gap-2 mb-0">
                        <TeamBadge name={t.team_name} logo={t.team_logo} size={28} />
                        <span>
                          {t.team_name}
                          {!t.in_tournament && <span className="small text-muted d-block">Not in the tournament</span>}
                        </span>
                      </label>
                    </td>
                    <td>
                      <Form.Control size="sm" type="number" min={current?.spent ?? 0} step={1} value={r.budget}
                        aria-label={`${t.team_name} budget`} disabled={!editable || !r.selected}
                        onChange={(e) => set(t.team_id, { budget: e.target.value })} />
                    </td>
                    <td>
                      <Form.Control size="sm" type="number" min={Math.max(1, current?.players_bought ?? 0)} step={1}
                        value={r.max_players} aria-label={`${t.team_name} squad size`} disabled={!editable || !r.selected}
                        onChange={(e) => set(t.team_id, { max_players: e.target.value })} />
                    </td>
                    <td className="text-end">{current ? formatPoints(current.spent) : '—'}</td>
                    <td className="text-end">{current ? current.players_bought : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        )}
      </Card.Body>
      {editable && (
        <Card.Footer className="bg-white d-flex justify-content-end">
          <Button disabled={busy} onClick={save}>Save teams</Button>
        </Card.Footer>
      )}
    </Card>
  )
}
