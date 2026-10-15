import { useCallback, useState } from 'react'
import { Alert, Badge, ButtonGroup, Button, Card, Spinner, Table } from 'react-bootstrap'
import { useReloadable } from '@/admin/hooks/useReloadable'
import { auctionAdminApi, type AuctionEventRecord } from '@/services/api/auctionApi'
import { auctionStatusLabel, formatPoints } from '@/utils/auctionText'
import type { TabProps } from './shared'

const str = (v: unknown) => (typeof v === 'string' ? v : '')

function describe(e: AuctionEventRecord): string {
  const d = e.details ?? {}
  const player = e.player_name ?? 'Player'
  const team = e.team_name ?? 'Team'
  const points = e.amount != null ? formatPoints(e.amount) : ''
  const reason = str(d.reason) ? ` Reason: ${str(d.reason)}` : ''
  switch (e.event_type) {
    case 'AUCTION_CREATED': return 'Auction created.'
    case 'AUCTION_UPDATED': {
      const after = (d.after ?? {}) as Record<string, unknown>
      return `Settings changed: ${Object.keys(after).join(', ').replace(/_/g, ' ')}.`
    }
    case 'CATEGORIES_UPDATED': return 'Player categories updated.'
    case 'TEAM_ADDED': return `${team} joined with ${points}.`
    case 'TEAM_BUDGET_CHANGED': return `${team}: budget or squad size changed (budget ${points}).`
    case 'TEAM_REMOVED': return `${team} removed.`
    case 'PLAYERS_ADDED': return `${Array.isArray(d.lot_ids) ? d.lot_ids.length : ''} player(s) added to the pool.`
    case 'PLAYER_UPDATED': return `${player} updated.`
    case 'PLAYER_WITHDRAWN': return `${player} removed from the pool.`
    case 'PLAYER_RESTORED': return `${player} restored to the pool.`
    case 'PLAYERS_REORDERED': return 'Auction order changed.'
    case 'STATUS_CHANGED': return `Status: ${auctionStatusLabel(str(d.from))} → ${auctionStatusLabel(str(d.to))}.${reason}`
    case 'PLAYER_UP': return `${player} is up for bidding (base ${points}).`
    case 'BID_PLACED': return `${team} bid ${points} for ${player}.`
    case 'PLAYER_SOLD': return `${player} sold to ${team} for ${points}.`
    case 'PLAYER_UNSOLD': return `${player} unsold.`
    case 'BIDDING_RESTARTED': return `Bidding for ${player} restarted.${reason}`
    case 'PLAYER_REOPENED': return `${player} reopened${e.team_name ? ` (was sold to ${team} for ${points})` : ''}.${reason}`
    default: return e.event_type
  }
}

const CORRECTIONS = new Set(['BIDDING_RESTARTED', 'PLAYER_REOPENED', 'PLAYER_WITHDRAWN', 'TEAM_REMOVED'])

export default function HistoryTab({ detail, auctionId }: TabProps) {
  const [view, setView] = useState<'events' | 'bids'>('events')
  const load = useCallback(
    () => Promise.all([auctionAdminApi.events(auctionId), auctionAdminApi.bids(auctionId)]).then(([events, bids]) => ({
      events: events.data,
      bids: bids.data,
    })),
    [auctionId],
  )
  const { data, error, loading } = useReloadable(load, `${auctionId}:${detail.auction.version}`, true)

  if (loading && !data) return <div className="text-center py-5"><Spinner animation="border" /></div>
  if (!data) return <Alert variant="danger">{error}</Alert>

  return (
    <Card className="border-0 shadow-sm">
      <Card.Header className="bg-white d-flex justify-content-between align-items-center">
        <span className="fw-semibold">Every change is recorded and cannot be edited</span>
        <ButtonGroup size="sm">
          <Button variant={view === 'events' ? 'primary' : 'outline-primary'} onClick={() => setView('events')}>
            Activity ({data.events.length})
          </Button>
          <Button variant={view === 'bids' ? 'primary' : 'outline-primary'} onClick={() => setView('bids')}>
            Bids ({data.bids.length})
          </Button>
        </ButtonGroup>
      </Card.Header>
      <Card.Body className="p-0">
        {view === 'events' ? (
          <Table responsive className="mb-0 small align-middle">
            <thead className="table-light">
              <tr>
                <th>#</th>
                <th>When</th>
                <th>What happened</th>
                <th>By</th>
              </tr>
            </thead>
            <tbody>
              {data.events.map((e) => (
                <tr key={e.auction_event_id} className={CORRECTIONS.has(e.event_type) ? 'table-warning' : undefined}>
                  <td className="text-muted">{e.seq}</td>
                  <td className="text-nowrap">{new Date(e.created_at).toLocaleString('en-IN')}</td>
                  <td>{describe(e)}</td>
                  <td>{e.actor ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <Table responsive className="mb-0 small align-middle">
            <thead className="table-light">
              <tr>
                <th>When</th>
                <th>Player</th>
                <th>Round</th>
                <th>Team</th>
                <th className="text-end">Points</th>
                <th>Recorded by</th>
              </tr>
            </thead>
            <tbody>
              {data.bids.length === 0 && (
                <tr><td colSpan={6} className="text-muted">No bids yet.</td></tr>
              )}
              {data.bids.map((b) => (
                <tr key={b.bid_id} className={b.is_current_round ? undefined : 'text-muted'}>
                  <td className="text-nowrap">{new Date(b.placed_at).toLocaleString('en-IN')}</td>
                  <td>{b.lot_number}. {b.player_name}</td>
                  <td>
                    {b.bid_round}
                    {!b.is_current_round && <Badge bg="light" text="dark" className="ms-1">set aside</Badge>}
                  </td>
                  <td>{b.team_name}</td>
                  <td className="text-end">
                    {formatPoints(b.amount)}
                    {b.is_winning && <Badge bg="success" className="ms-1">won</Badge>}
                  </td>
                  <td>{b.placed_by ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card.Body>
    </Card>
  )
}
