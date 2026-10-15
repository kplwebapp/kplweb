import { useState } from 'react'
import { Badge, Button, Card, Col, ListGroup, Row, Table } from 'react-bootstrap'
import TeamBadge from '@/components/tournament/TeamBadge'
import { auctionAdminApi, type AuctionLot, type AuctionReport } from '@/services/api/auctionApi'
import { LOT_STATUS_LABEL, LOT_STATUS_VARIANT, formatPoints } from '@/utils/auctionText'
import type { TabProps } from './shared'

const REPORTS: { report: AuctionReport; label: string }[] = [
  { report: 'results', label: 'Player results' },
  { report: 'teams', label: 'Team squads' },
  { report: 'bids', label: 'All bids' },
]

export default function ResultsTab({ detail, auctionId, run, ask }: TabProps) {
  const { auction, teams, lots, can } = detail
  const [downloading, setDownloading] = useState<AuctionReport | null>(null)
  const decided = lots.filter((l) => l.status === 'SOLD' || l.status === 'UNSOLD')
  const canReopen = can.manage && !auction.is_legacy && (auction.status === 'LIVE' || auction.status === 'PAUSED')

  const download = async (report: AuctionReport) => {
    setDownloading(report)
    await run(() => auctionAdminApi.exportCsv(auctionId, report), 'Report downloaded.')
    setDownloading(null)
  }

  const reopen = (lot: AuctionLot) =>
    ask({
      title: `Reopen ${lot.player_name}?`,
      body:
        lot.status === 'SOLD'
          ? `The sale to ${lot.team_name} for ${formatPoints(lot.sold_price ?? 0)} is undone and the points return to the team. The player waits to be auctioned again; the original sale stays in the history.`
          : 'The player waits to be auctioned again.',
      confirmLabel: 'Reopen',
      variant: 'warning',
      reason: 'required',
      onConfirm: (reason) => run(() => auctionAdminApi.reopen(auctionId, lot.lot_id, reason), `${lot.player_name} reopened.`),
    })

  return (
    <>
      <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
        <span className="small text-muted me-1">Download CSV:</span>
        {REPORTS.map((r) => (
          <Button key={r.report} size="sm" variant="outline-primary" disabled={downloading !== null} onClick={() => download(r.report)}>
            {downloading === r.report ? 'Preparing…' : r.label}
          </Button>
        ))}
      </div>

      <Row xs={1} md={2} xl={3} className="g-3 mb-4">
        {teams.map((t) => {
          const squad = lots.filter((l) => l.status === 'SOLD' && l.team_id === t.team_id)
          return (
            <Col key={t.team_id}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Header className="bg-white d-flex align-items-center gap-2">
                  <TeamBadge name={t.team_name} logo={t.team_logo} size={30} />
                  <div className="flex-grow-1 min-w-0">
                    <div className="fw-semibold text-truncate">{t.team_name}</div>
                    <small className="text-muted">
                      {t.players_bought} / {t.max_players} players · {formatPoints(t.spent)} spent · {formatPoints(t.remaining)} left
                    </small>
                  </div>
                </Card.Header>
                <ListGroup variant="flush" className="small">
                  {squad.length === 0 && <ListGroup.Item className="text-muted">No players yet.</ListGroup.Item>}
                  {squad.map((l) => (
                    <ListGroup.Item key={l.lot_id} className="d-flex justify-content-between">
                      <span>
                        {l.player_name}
                        {l.category_name && <span className="text-muted"> · {l.category_name}</span>}
                      </span>
                      <span className="fw-semibold">{formatPoints(l.sold_price ?? 0)}</span>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </Card>
            </Col>
          )
        })}
      </Row>

      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white fw-semibold">Sold and unsold players ({decided.length})</Card.Header>
        <Card.Body className="p-0">
          {decided.length === 0 ? (
            <p className="text-muted p-3 mb-0">No results yet.</p>
          ) : (
            <Table responsive hover className="mb-0 align-middle small">
              <thead className="table-light">
                <tr>
                  <th>#</th>
                  <th>Player</th>
                  <th>Category</th>
                  <th>Result</th>
                  <th>Team</th>
                  <th className="text-end">Points</th>
                  {canReopen && <th />}
                </tr>
              </thead>
              <tbody>
                {decided.map((l) => (
                  <tr key={l.lot_id}>
                    <td className="text-muted">{l.lot_number}</td>
                    <td>{l.player_name}</td>
                    <td>{l.category_name ?? l.player_role ?? '—'}</td>
                    <td><Badge bg={LOT_STATUS_VARIANT[l.status]}>{LOT_STATUS_LABEL[l.status]}</Badge></td>
                    <td>{l.team_name ?? '—'}</td>
                    <td className="text-end">{l.sold_price != null ? formatPoints(l.sold_price) : '—'}</td>
                    {canReopen && (
                      <td className="text-end">
                        <Button size="sm" variant="link" onClick={() => reopen(l)}>Reopen…</Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </>
  )
}
