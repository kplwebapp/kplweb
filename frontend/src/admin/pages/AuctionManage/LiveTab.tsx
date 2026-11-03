import { useEffect, useMemo, useState } from 'react'
import { Alert, Badge, Button, Card, Col, Dropdown, Form, ListGroup, Row, Spinner } from 'react-bootstrap'
import TeamBadge from '@/components/tournament/TeamBadge'
import {
  auctionAdminApi,
  type AuctionDetail,
  type LiveBoardCategory,
  type LiveBoardTeam,
} from '@/services/api/auctionApi'
import { formatPoints, playerStyle } from '@/utils/auctionText'
import { PlayerPhoto } from './PlayersTab'
import type { TabProps } from './shared'

type Current = NonNullable<AuctionDetail['current']>

const MODE_HINT: Record<string, string> = {
  icon: 'No bidding — assign from paper cheat',
  squad_round: 'One purchase per team per round',
  open: 'Bid while points and squad slots remain',
}

export default function LiveTab(props: TabProps) {
  const { detail } = props
  const { auction, current, live_board: board } = detail
  const running = auction.status === 'LIVE' || auction.status === 'PAUSED'

  if (auction.is_legacy) {
    return (
      <Alert variant="warning">
        This auction is still marked as history, so live bidding is locked. Open Overview and choose{' '}
        <strong>Enable live bidding</strong>.
      </Alert>
    )
  }

  if (!running) {
    const message =
      auction.status === 'COMPLETED'
        ? 'The auction is complete. See Results for squads and spending.'
        : auction.status === 'CANCELLED'
          ? 'The auction was cancelled.'
          : 'Mark the auction ready, then start it to open the live desk.'
    return <Alert variant="info">{message}</Alert>
  }

  if (!board) {
    return <div className="text-center py-4"><Spinner animation="border" /></div>
  }

  return (
    <div className="d-flex flex-column gap-3">
      {auction.status === 'PAUSED' && (
        <Alert variant="warning" className="mb-0">The auction is paused. Resume it to take bids.</Alert>
      )}
      <LiveDesk {...props} board={board} current={current} />
    </div>
  )
}

function LiveDesk({
  detail,
  auctionId,
  run,
  ask,
  board,
  current,
}: TabProps & { board: NonNullable<AuctionDetail['live_board']>; current: Current | null }) {
  const categories = board.categories
  const categoryKeyOf = (c: LiveBoardCategory) => String(c.auction_category_id ?? c.name)
  const [categoryKey, setCategoryKey] = useState<string>(() =>
    categoryKeyOf(categories.find((c) => c.on_block) ?? categories[0] ?? { name: 'Icon Player' } as LiveBoardCategory),
  )

  useEffect(() => {
    const onBlock = categories.find((c) => c.on_block)
    if (onBlock) setCategoryKey(categoryKeyOf(onBlock))
  }, [categories, current?.lot_id])

  const active =
    categories.find((c) => categoryKeyOf(c) === categoryKey) ?? categories[0] ?? null

  return (
    <div className="d-flex flex-column gap-3">
      <Row className="g-3">
        <Col xl={4}>
          <CategoryPanel
            categories={categories}
            activeKey={categoryKey}
            onSelect={setCategoryKey}
            active={active}
            auctionId={auctionId}
            run={run}
            canOperate={detail.can.operate && detail.auction.status === 'LIVE'}
            canPutUp={detail.can.operate && (detail.auction.status === 'LIVE' || detail.auction.status === 'PAUSED')}
            hasCurrent={Boolean(current)}
          />
        </Col>
        <Col xl={8}>
          {current ? (
            <LivePlayerPanel
              detail={detail}
              auctionId={auctionId}
              run={run}
              ask={ask}
              current={current}
              mode={board.current_mode}
              activeCategory={active}
            />
          ) : (
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="text-muted text-center py-5">
                Choose a player from a category on the left and put them on the live screen.
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>

      {current ? (
        <TeamBidsSection
          detail={detail}
          auctionId={auctionId}
          run={run}
          current={current}
          mode={board.current_mode}
          teams={board.teams}
        />
      ) : null}
    </div>
  )
}

function CategoryPanel({
  categories,
  activeKey,
  onSelect,
  active,
  auctionId,
  run,
  canOperate,
  canPutUp,
  hasCurrent,
}: {
  categories: LiveBoardCategory[]
  activeKey: string
  onSelect: (key: string) => void
  active: LiveBoardCategory | null
  auctionId: number
  run: TabProps['run']
  canOperate: boolean
  canPutUp: boolean
  hasCurrent: boolean
}) {
  const [busyId, setBusyId] = useState<number | null>(null)
  const waiting = useMemo(
    () => (active?.players ?? []).filter((p) => p.status === 'PENDING' || p.status === 'UNSOLD'),
    [active],
  )

  const putOnLive = async (lotId: number, name: string) => {
    if (hasCurrent) return
    setBusyId(lotId)
    await run(() => auctionAdminApi.nextPlayer(auctionId, lotId), `${name} is on the live screen.`)
    setBusyId(null)
  }

  const activeRemaining = active?.remaining ?? active?.waiting ?? 0
  const activeLabel = active
    ? `${active.name} (${activeRemaining})`
    : 'Select category'

  return (
    <Card className="border-0 shadow-sm h-100">
      <Card.Header className="bg-white">
        <div className="fw-semibold mb-2">Players by category</div>
        <Dropdown onSelect={(key) => key && onSelect(key)}>
          <Dropdown.Toggle
            variant="outline-secondary"
            className="w-100 text-start"
            id="live-category-dropdown"
          >
            {activeLabel}
          </Dropdown.Toggle>
          <Dropdown.Menu className="w-100">
            {categories.map((c) => {
              const key = String(c.auction_category_id ?? c.name)
              const remaining = c.remaining ?? c.waiting ?? 0
              return (
                <Dropdown.Item key={`${c.name}-${key}`} eventKey={key} active={key === activeKey}>
                  {c.name} ({remaining})
                </Dropdown.Item>
              )
            })}
          </Dropdown.Menu>
        </Dropdown>
      </Card.Header>
      <Card.Body className="p-0">
        {active ? (
          <>
            <div className="px-3 py-2 border-bottom small text-muted">
              {MODE_HINT[active.mode] ?? active.mode}
              {active.round
                ? ` · Round ${active.round.current_round} of ${active.round.total_rounds}`
                : null}
            </div>
            <ListGroup variant="flush" style={{ maxHeight: '32rem', overflowY: 'auto' }}>
              {waiting.map((p) => (
                <ListGroup.Item key={p.lot_id} className="d-flex align-items-center gap-2">
                  <PlayerPhoto path={p.profile_photo} name={p.player_name} size={28} />
                  <span className="flex-grow-1 min-w-0">
                    <span className="d-block text-truncate fw-semibold">{p.player_name}</span>
                    <small className="text-muted">{p.vibhaag || '—'}</small>
                  </span>
                  {canPutUp && (
                    <Button
                      size="sm"
                      variant="primary"
                      disabled={busyId === p.lot_id || hasCurrent}
                      onClick={() => void putOnLive(p.lot_id, p.player_name)}
                    >
                      Put on live
                    </Button>
                  )}
                </ListGroup.Item>
              ))}
              {waiting.length === 0 && (
                <ListGroup.Item className="text-muted small">No waiting players in this category.</ListGroup.Item>
              )}
            </ListGroup>
            {hasCurrent && canPutUp && (
              <div className="px-3 py-2 small text-muted border-top">
                Finish the current player (sold / unsold / assign) before putting another on live.
              </div>
            )}
            {!canOperate && canPutUp && (
              <div className="px-3 py-2 small text-warning border-top">
                Auction is paused — you can still put a player on screen; resume to bid.
              </div>
            )}
          </>
        ) : (
          <p className="text-muted p-3 mb-0">No categories yet. Add them under Settings / Player pool.</p>
        )}
      </Card.Body>
    </Card>
  )
}

function LivePlayerPanel({
  detail,
  auctionId,
  run,
  ask,
  current,
  mode,
  activeCategory,
}: TabProps & {
  current: Current
  mode: AuctionDetail['live_board']['current_mode']
  activeCategory: LiveBoardCategory | null
}) {
  const live = detail.auction.status === 'LIVE'
  const canOperate = detail.can.operate && live
  const highest = current.bids[0] ?? null
  const [busy, setBusy] = useState(false)
  const isIcon = mode === 'icon'

  const act = async (action: () => Promise<unknown>, message: string) => {
    setBusy(true)
    const ok = await run(action, message)
    setBusy(false)
    return ok
  }

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
      onConfirm: () =>
        run(() => auctionAdminApi.sell(auctionId, current.lot_id), `${current.player_name} sold to ${highest.team_name}.`),
    })

  return (
    <Card className="border-0 shadow-sm h-100">
      <Card.Header className="bg-white d-flex flex-wrap justify-content-between gap-2">
        <span className="fw-semibold">Live player</span>
        <div className="d-flex flex-wrap gap-2 align-items-center">
          {activeCategory?.round && (
            <Badge bg="info">
              Round {activeCategory.round.current_round}/{activeCategory.round.total_rounds}
            </Badge>
          )}
          <Badge bg={isIcon ? 'warning' : 'success'} text={isIcon ? 'dark' : undefined}>
            {isIcon ? 'Icon · assign only' : 'Live bidding'}
          </Badge>
        </div>
      </Card.Header>
      <Card.Body>
        <Row className="g-3 align-items-start">
          <Col sm={8}>
            <div className="text-muted small mb-1">
              Lot {current.lot_number}
              {current.category_name ? ` · ${current.category_name}` : ''}
            </div>
            <h3 className="h4 mb-2">{current.player_name}</h3>
            <Row className="g-2 small">
              <Col xs={6}><span className="text-muted d-block">Vibhaag</span><strong>{current.vibhaag || '—'}</strong></Col>
              <Col xs={6}><span className="text-muted d-block">Style</span><strong>{playerStyle(current) || '—'}</strong></Col>
              <Col xs={6}>
                <span className="text-muted d-block">{isIcon ? 'Assign points' : 'Current bid'}</span>
                <strong className="fs-5">{formatPoints(highest?.amount ?? 0)}</strong>
              </Col>
              <Col xs={6}>
                <span className="text-muted d-block">{isIcon ? 'Leading team' : 'Leading / next min'}</span>
                <strong>
                  {highest
                    ? `${highest.team_name} · min ${formatPoints(current.next_min_bid)}`
                    : `No bids · min ${formatPoints(current.next_min_bid)}`}
                </strong>
              </Col>
            </Row>
            {!isIcon && canOperate && (
              <div className="d-flex flex-wrap gap-2 mt-3">
                {highest ? (
                  <Button variant="success" disabled={busy} onClick={sell}>
                    Sold to {highest.team_name} · {formatPoints(highest.amount)}
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    disabled={busy}
                    onClick={() =>
                      void act(
                        () => auctionAdminApi.unsold(auctionId, current.lot_id),
                        `${current.player_name} unsold.`,
                      )
                    }
                  >
                    Unsold
                  </Button>
                )}
              </div>
            )}
          </Col>
          <Col sm={4} className="text-center">
            <PlayerPhoto path={current.profile_photo} name={current.player_name} size={160} />
          </Col>
        </Row>
      </Card.Body>
    </Card>
  )
}

function TeamBidsSection({
  detail,
  auctionId,
  run,
  current,
  mode,
  teams,
}: {
  detail: AuctionDetail
  auctionId: number
  run: TabProps['run']
  current: Current
  mode: AuctionDetail['live_board']['current_mode']
  teams: LiveBoardTeam[]
}) {
  const live = detail.auction.status === 'LIVE'
  const canOperate = detail.can.operate && live
  const [busy, setBusy] = useState(false)
  const isIcon = mode === 'icon'

  const act = async (action: () => Promise<unknown>, message: string) => {
    setBusy(true)
    const ok = await run(action, message)
    setBusy(false)
    return ok
  }

  return (
    <div className="d-flex flex-column gap-3">
      <div>
        <h3 className="h6 mb-2">{isIcon ? 'Assign to a team' : 'Team bids'}</h3>
        <Row xs={1} md={2} xl={3} className="g-3">
          {teams.map((team) => (
            <Col key={team.team_id}>
              <TeamBidCard
                team={team}
                isIcon={isIcon}
                disabled={!canOperate || busy}
                minimum={current.next_min_bid}
                onBid={(amount) =>
                  act(
                    () => auctionAdminApi.bid(auctionId, current.lot_id, team.team_id, amount),
                    `${team.team_name} bids ${formatPoints(amount)}.`,
                  )
                }
                onAssign={(amount) =>
                  act(
                    () => auctionAdminApi.assignPlayer(auctionId, current.lot_id, team.team_id, amount),
                    `${current.player_name} assigned to ${team.team_name}.`,
                  )
                }
              />
            </Col>
          ))}
        </Row>
        {teams.length === 0 && (
          <Alert variant="warning" className="mt-2 mb-0">Add participating teams under Teams & budgets.</Alert>
        )}
      </div>

      {!isIcon && current.bids.length > 0 && (
        <Card className="border-0 shadow-sm">
          <Card.Header className="bg-white fw-semibold">Bids this player</Card.Header>
          <ListGroup variant="flush">
            {current.bids.map((b, i) => (
              <ListGroup.Item key={b.bid_id} className="d-flex justify-content-between">
                <span className={i === 0 ? 'fw-semibold' : undefined}>{b.team_name}</span>
                <span className={i === 0 ? 'fw-semibold' : 'text-muted'}>{formatPoints(b.amount)}</span>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Card>
      )}
    </div>
  )
}

function TeamBidCard({
  team,
  isIcon,
  disabled,
  minimum,
  onBid,
  onAssign,
}: {
  team: LiveBoardTeam
  isIcon: boolean
  disabled: boolean
  minimum: number
  onBid: (amount: number) => Promise<boolean>
  onAssign: (amount: number) => Promise<boolean>
}) {
  const [amountText, setAmountText] = useState(String(Math.max(0, minimum)))
  const [busy, setBusy] = useState(false)
  const amount = Number(amountText)
  const amountValid = Number.isInteger(amount) && amount >= (isIcon ? 0 : minimum)

  useEffect(() => {
    setAmountText(String(Math.max(0, minimum)))
  }, [minimum, team.team_id])

  const submit = async () => {
    if (!amountValid) return
    setBusy(true)
    if (isIcon) await onAssign(amount)
    else await onBid(amount)
    setBusy(false)
  }

  const blocked = isIcon ? !team.can_assign : !team.can_bid
  const reason = team.bid_blocked_reason

  return (
    <Card className={`h-100 border-0 shadow-sm${team.already_bid ? ' border-success' : ''}`}>
      <Card.Body>
        <div className="d-flex align-items-center gap-2 mb-3">
          <TeamBadge name={team.team_name} logo={team.team_logo} size={40} />
          <div className="min-w-0">
            <div className="fw-semibold text-truncate">{team.team_name}</div>
            <small className="text-muted">
              {team.players_bought}/{team.max_players} players
            </small>
          </div>
        </div>
        <ul className="list-unstyled small mb-3">
          <li className="d-flex justify-content-between mb-1">
            <span className="text-muted">Points remaining</span>
            <strong>{formatPoints(team.remaining)}</strong>
          </li>
          <li className="d-flex justify-content-between">
            <span className="text-muted">{isIcon ? 'Assign points' : 'Bidding points'}</span>
            <strong>{team.bid_amount != null ? formatPoints(team.bid_amount) : '—'}</strong>
          </li>
        </ul>
        <Form.Control
          size="sm"
          type="number"
          min={isIcon ? 0 : minimum}
          step={1}
          className="mb-2"
          value={amountText}
          disabled={disabled || blocked || busy}
          isInvalid={amountText !== '' && !amountValid}
          onChange={(e) => setAmountText(e.target.value)}
          aria-label={`${team.team_name} bid amount`}
        />
        <Button
          className="w-100"
          variant={isIcon ? 'warning' : 'primary'}
          disabled={disabled || blocked || busy || !amountValid}
          onClick={() => void submit()}
        >
          {busy ? 'Submitting…' : isIcon ? 'Assign to team' : 'Submit bid'}
        </Button>
        {reason ? <div className="small text-muted mt-2">{reason}</div> : null}
      </Card.Body>
    </Card>
  )
}
