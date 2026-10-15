import { Card, Col, ProgressBar, Row, Table } from 'react-bootstrap'
import TeamBadge from '@/components/tournament/TeamBadge'
import { formatPoints } from '@/utils/auctionText'
import type { TabProps } from './shared'

function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <Card className="border-0 shadow-sm h-100">
      <Card.Body>
        <div className="text-muted small">{label}</div>
        <div className="fs-4 fw-semibold">{value}</div>
        {hint && <div className="small text-muted">{hint}</div>}
      </Card.Body>
    </Card>
  )
}

export default function OverviewTab({ detail }: TabProps) {
  const { auction, stats, teams, categories, lots } = detail
  const setup = auction.status === 'DRAFT' || auction.status === 'READY'
  const uncategorised = lots.filter((l) => l.is_eligible && l.status === 'PENDING' && !l.auction_category_id).length
  const squadPlaces = teams.reduce((sum, t) => sum + t.max_players, 0)

  const checklist = [
    { done: Boolean(auction.event_id), text: 'Linked to a cricket tournament (Settings)' },
    { done: teams.length >= 2, text: `At least two teams with budgets (${teams.length} now, Teams & budgets)` },
    { done: stats.available > 0, text: `Eligible players in the pool (${stats.available} now, Player pool)` },
    ...(categories.length ? [{ done: uncategorised === 0, text: `Every eligible player has a category (${uncategorised} missing)` }] : []),
  ]

  return (
    <>
      <Row className="g-3 mb-4">
        <Col xs={6} md={3}><Stat label="Registered for the tournament" value={stats.registered} /></Col>
        <Col xs={6} md={3}><Stat label="In the player pool" value={stats.pool} hint={`${stats.eligible} eligible`} /></Col>
        <Col xs={6} md={3}><Stat label="Sold / unsold" value={`${stats.sold} / ${stats.unsold}`} hint={`${stats.available} still waiting`} /></Col>
        <Col xs={6} md={3}><Stat label="Points spent" value={formatPoints(stats.total_spent)} /></Col>
      </Row>

      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between small mb-1">
            <span>Auction progress</span>
            <strong>{stats.progress}%</strong>
          </div>
          <ProgressBar now={stats.progress} variant="success" />
        </Card.Body>
      </Card>

      <Row className="g-4">
        {setup && (
          <Col lg={5}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Header className="bg-white fw-semibold">Before the auction</Card.Header>
              <Card.Body>
                <ul className="list-unstyled mb-3">
                  {checklist.map((item) => (
                    <li key={item.text} className="py-1">
                      <span className={item.done ? 'text-success' : 'text-danger'} aria-hidden="true">{item.done ? '✔' : '✖'}</span>{' '}
                      <span className="visually-hidden">{item.done ? 'Done:' : 'To do:'}</span>
                      {item.text}
                    </li>
                  ))}
                </ul>
                <p className="small text-muted mb-0">
                  {squadPlaces} squad places across {teams.length} teams for {stats.available} eligible players.
                </p>
              </Card.Body>
            </Card>
          </Col>
        )}
        <Col lg={setup ? 7 : 12}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-white fw-semibold">Teams</Card.Header>
            <Card.Body className="p-0">
              {teams.length === 0 ? (
                <p className="text-muted p-3 mb-0">No teams yet.</p>
              ) : (
                <Table responsive className="mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Team</th>
                      <th className="text-end">Budget</th>
                      <th className="text-end">Spent</th>
                      <th className="text-end">Remaining</th>
                      <th className="text-end">Squad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teams.map((t) => (
                      <tr key={t.team_id}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <TeamBadge name={t.team_name} logo={t.team_logo} size={28} />
                            {t.team_name}
                          </div>
                        </td>
                        <td className="text-end">{formatPoints(t.budget)}</td>
                        <td className="text-end">{formatPoints(t.spent)}</td>
                        <td className="text-end fw-semibold">{formatPoints(t.remaining)}</td>
                        <td className="text-end">{t.players_bought} / {t.max_players}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  )
}
