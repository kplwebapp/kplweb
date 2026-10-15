import { useState } from 'react'
import { Alert, Badge, Button, ButtonGroup, Card, Col, Form, InputGroup, ListGroup, Row } from 'react-bootstrap'
import TeamBadge from '@/components/tournament/TeamBadge'
import { auctionAdminApi, type AuctionDetail, type AuctionLot, type AuctionTeam } from '@/services/api/auctionApi'
import { formatPoints, playerStyle } from '@/utils/auctionText'
import { PlayerPhoto } from './PlayersTab'
import type { TabProps } from './shared'

type Current = NonNullable<AuctionDetail['current']>

export default function LiveTab(props: TabProps) {
  const { detail } = props
  const { auction, current } = detail
  const running = auction.status === 'LIVE' || auction.status === 'PAUSED'

  if (!running) {
    const message =
      auction.status === 'COMPLETED'
        ? 'The auction is complete. See Results for squads and spending.'
        : auction.status === 'CANCELLED'
          ? 'The auction was cancelled.'
          : 'Bidding opens when the auction is started. Mark it ready, then start it from the buttons above.'
    return <Alert variant="info">{message}</Alert>
  }

  return (
    <Row className="g-4">
      <Col xl={8}>
        {auction.status === 'PAUSED' && (
          <Alert variant="warning">The auction is paused. Resume it to take bids.</Alert>
        )}
        {current ? (
          <OnTheBlock key={`${current.lot_id}:${current.bid_round}:${current.next_min_bid}`} {...props} current={current} />
        ) : (
          <PickNext {...props} />
        )}
      </Col>
      <Col xl={4}>
        <TeamsPanel teams={detail.teams} leaderId={current?.bids[0]?.team_id ?? null} />
      </Col>
    </Row>
  )
}

/** Why a team cannot bid `amount` right now, or '' if it can (the server checks again). */
function blocker(team: AuctionTeam, amount: number, leaderId: number | null) {
  if (team.team_id === leaderId) return 'Highest bidder'
  if (team.slots_left <= 0) return 'Squad full'
  if (amount > team.remaining) return 'Not enough points'
  return ''
}

function OnTheBlock({ detail, auctionId, run, ask, current }: TabProps & { current: Current }) {
  const { auction, teams, can } = detail
  const live = auction.status === 'LIVE'
  const highest = current.bids[0] ?? null
  const increment = auction.min_bid_increment
  const minimum = current.next_min_bid
  const [amountText, setAmountText] = useState(String(minimum))
  const [busy, setBusy] = useState(false)
  const amount = Number(amountText)
  const amountValid = Number.isInteger(amount) && amount >= minimum

  const act = async (action: () => Promise<unknown>, message: string) => {
    setBusy(true)
    await run(action, message)
    setBusy(false)
  }

  const bid = (team: AuctionTeam) =>
    act(() => auctionAdminApi.bid(auctionId, current.lot_id, team.team_id, amount), `${team.team_name} bids ${formatPoints(amount)}.`)

  const sell = () =>
    highest &&
    ask({
      title: `Sell ${current.player_name}?`,
      body: (
        <>
          Sold to <strong>{highest.team_name}</strong> for <strong>{formatPoints(highest.amount)}</strong>.
        </>
      ),
      confirmLabel: 'Sold',
      variant: 'success',
      onConfirm: () => run(() => auctionAdminApi.sell(auctionId, current.lot_id), `${current.player_name} sold to ${highest.team_name}.`),
    })

  const restart = () =>
    ask({
      title: 'Restart the bidding for this player?',
      body: 'Bids so far are set aside (they stay in the history) and bidding starts again from the base points.',
      confirmLabel: 'Restart bidding',
      variant: 'warning',
      reason: 'required',
      onConfirm: (reason) => run(() => auctionAdminApi.restartBidding(auctionId, current.lot_id, reason), 'Bidding restarted.'),
    })

  return (
    <Card className="border-0 shadow-sm">
      <Card.Body>
        <div className="d-flex flex-wrap gap-3 align-items-center mb-3">
          <PlayerPhoto path={current.profile_photo} name={current.player_name} size={88} />
          <div className="flex-grow-1 min-w-0">
            <div className="text-muted small">Lot {current.lot_number}{current.bid_round > 1 ? ` · round ${current.bid_round}` : ''}</div>
            <h3 className="h4 mb-1">{current.player_name}</h3>
            <div className="d-flex flex-wrap gap-2 align-items-center small">
              {current.category_name && <Badge bg="primary">{current.category_name}</Badge>}
              {current.vibhaag && <span>{current.vibhaag}</span>}
              {playerStyle(current) && <span className="text-muted">{playerStyle(current)}</span>}
            </div>
          </div>
          <div className="text-end">
            <div className="text-muted small">{highest ? 'Highest bid' : 'Base points'}</div>
            <div className="display-6 fw-bold">{formatPoints(highest?.amount ?? current.base_price)}</div>
            <div className="fw-semibold text-success">{highest ? highest.team_name : 'No bids yet'}</div>
          </div>
        </div>

        {live && can.operate && (
          <>
            <Form.Label htmlFor="bid-amount" className="small mb-1">
              Bid amount (at least {formatPoints(minimum)})
            </Form.Label>
            <InputGroup className="mb-2">
              <Form.Control id="bid-amount" type="number" min={minimum} step={increment} value={amountText}
                isInvalid={!amountValid} onChange={(e) => setAmountText(e.target.value)} />
              <Button variant="outline-secondary" onClick={() => setAmountText(String(minimum))}>Minimum</Button>
              {[2, 5].map((n) => (
                <Button key={n} variant="outline-secondary" onClick={() => setAmountText(String(minimum + increment * (n - 1)))}>
                  +{formatPoints(increment * (n - 1))}
                </Button>
              ))}
            </InputGroup>
            <div className="small text-muted mb-2">Choose the team making this bid:</div>
            <Row xs={2} md={3} className="g-2 mb-3">
              {teams.map((t) => {
                const reason = blocker(t, amount, highest?.team_id ?? null)
                return (
                  <Col key={t.team_id}>
                    <Button variant={reason ? 'outline-secondary' : 'outline-primary'} className="w-100 text-start h-100"
                      disabled={busy || !amountValid || Boolean(reason)} onClick={() => bid(t)}>
                      <div className="d-flex align-items-center gap-2">
                        <TeamBadge name={t.team_name} logo={t.team_logo} size={26} />
                        <span className="fw-semibold text-truncate">{t.short_name || t.team_name}</span>
                      </div>
                      <small className="d-block">{reason || `${formatPoints(t.remaining)} left`}</small>
                    </Button>
                  </Col>
                )
              })}
            </Row>
          </>
        )}

        <div className="d-flex flex-wrap gap-2">
          {can.operate && live && (
            highest ? (
              <Button variant="success" size="lg" disabled={busy} onClick={sell}>
                Sold to {highest.team_name} · {formatPoints(highest.amount)}
              </Button>
            ) : (
              <Button variant="secondary" size="lg" disabled={busy}
                onClick={() => act(() => auctionAdminApi.unsold(auctionId, current.lot_id), `${current.player_name} unsold.`)}>
                Unsold
              </Button>
            )
          )}
          {can.manage && highest && (
            <Button variant="outline-warning" disabled={busy} onClick={restart}>Restart bidding…</Button>
          )}
        </div>

        <h6 className="mt-4">Bids this round</h6>
        {current.bids.length === 0 ? (
          <p className="text-muted small mb-0">No bids yet.</p>
        ) : (
          <ListGroup variant="flush" className="small">
            {current.bids.map((b, i) => (
              <ListGroup.Item key={b.bid_id} className="d-flex justify-content-between px-0">
                <span className={i === 0 ? 'fw-semibold' : 'text-muted'}>{b.team_name}</span>
                <span className={i === 0 ? 'fw-semibold' : 'text-muted'}>
                  {formatPoints(b.amount)} · {new Date(b.placed_at).toLocaleTimeString('en-IN')}
                </span>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Card.Body>
    </Card>
  )
}

function PickNext({ detail, auctionId, run }: TabProps) {
  const { auction, lots, can } = detail
  const [busy, setBusy] = useState(false)
  const [showUnsold, setShowUnsold] = useState(false)
  const waiting = lots.filter((l) => l.status === 'PENDING' && l.is_eligible)
  const unsold = lots.filter((l) => l.status === 'UNSOLD' && l.is_eligible)
  const live = auction.status === 'LIVE' && can.operate

  const bringUp = async (lot: AuctionLot | null) => {
    setBusy(true)
    await run(() => auctionAdminApi.nextPlayer(auctionId, lot?.lot_id ?? null), 'Player is up for bidding.')
    setBusy(false)
  }

  const list = showUnsold ? unsold : waiting

  return (
    <Card className="border-0 shadow-sm">
      <Card.Body>
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
          <div>
            <h3 className="h5 mb-0">No player is up</h3>
            <small className="text-muted">{waiting.length} waiting · {unsold.length} unsold</small>
          </div>
          {live && waiting.length > 0 && (
            <Button size="lg" disabled={busy} onClick={() => bringUp(null)}>
              Next player: {waiting[0].player_name}
            </Button>
          )}
        </div>
        {waiting.length === 0 && (
          <Alert variant="light" className="small">
            Every player has been auctioned. Bring back an unsold player, or complete the auction.
          </Alert>
        )}

        <ButtonGroup size="sm" className="mb-2">
          <Button variant={showUnsold ? 'outline-primary' : 'primary'} onClick={() => setShowUnsold(false)}>Waiting ({waiting.length})</Button>
          <Button variant={showUnsold ? 'primary' : 'outline-primary'} onClick={() => setShowUnsold(true)}>Unsold ({unsold.length})</Button>
        </ButtonGroup>
        <ListGroup variant="flush" style={{ maxHeight: 420, overflowY: 'auto' }}>
          {list.map((l) => (
            <ListGroup.Item key={l.lot_id} className="d-flex align-items-center gap-2 px-0">
              <span className="text-muted small" style={{ width: 28 }}>{l.lot_number}</span>
              <PlayerPhoto path={l.profile_photo} name={l.player_name} size={28} />
              <span className="flex-grow-1 min-w-0">
                <span className="d-block text-truncate">{l.player_name}</span>
                <small className="text-muted">{[l.category_name, l.vibhaag, formatPoints(l.base_price)].filter(Boolean).join(' · ')}</small>
              </span>
              {live && (
                <Button size="sm" variant="outline-primary" disabled={busy} onClick={() => bringUp(l)}>
                  {showUnsold ? 'Bring back' : 'Bring up'}
                </Button>
              )}
            </ListGroup.Item>
          ))}
          {list.length === 0 && <ListGroup.Item className="px-0 text-muted small">None.</ListGroup.Item>}
        </ListGroup>
      </Card.Body>
    </Card>
  )
}

function TeamsPanel({ teams, leaderId }: { teams: AuctionTeam[]; leaderId: number | null }) {
  return (
    <Card className="border-0 shadow-sm">
      <Card.Header className="bg-white fw-semibold">Teams</Card.Header>
      <ListGroup variant="flush">
        {teams.map((t) => (
          <ListGroup.Item key={t.team_id} className={t.team_id === leaderId ? 'bg-success-subtle' : undefined}>
            <div className="d-flex align-items-center gap-2">
              <TeamBadge name={t.team_name} logo={t.team_logo} size={30} />
              <div className="flex-grow-1 min-w-0">
                <div className="fw-semibold text-truncate">{t.team_name}</div>
                <small className="text-muted">{t.players_bought} / {t.max_players} players</small>
              </div>
              <div className="text-end">
                <div className="fw-semibold">{formatPoints(t.remaining)}</div>
                <small className="text-muted">of {formatPoints(t.budget)}</small>
              </div>
            </div>
          </ListGroup.Item>
        ))}
      </ListGroup>
    </Card>
  )
}
