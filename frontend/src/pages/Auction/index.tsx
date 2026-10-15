import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Badge, Button, ButtonGroup, Card, Col, Container, Form, ListGroup, ProgressBar, Row, Spinner, Table } from 'react-bootstrap'
import { auctionContent } from '@/content'
import TeamBadge from '@/components/tournament/TeamBadge'
import { useAuctionLive, type LiveMode } from '@/hooks/useAuctionLive'
import { auctionPublicApi, type AuctionSnapshot, type PublicAuctionSummary } from '@/services/api/auctionApi'
import {
  LOT_STATUS_LABEL,
  LOT_STATUS_VARIANT,
  auctionStatusLabel,
  auctionStatusVariant,
  formatAuctionDate,
  formatPoints,
  playerStyle,
} from '@/utils/auctionText'
import { getProfilePhotoUrl, handleProfilePhotoError } from '@/utils/profilePhoto'
import './Auction.scss'

type ListState = { auctions: PublicAuctionSummary[]; error: string } | null

const MODE_TEXT: Record<LiveMode, string> = {
  connecting: 'Connecting…',
  live: '● Live',
  reconnecting: 'Reconnecting…',
  polling: 'Updating every few seconds',
}

export default function AuctionPage() {
  const [params, setParams] = useSearchParams()
  const [list, setList] = useState<ListState>(null)

  useEffect(() => {
    auctionPublicApi
      .list()
      .then((res) => setList({ auctions: res.data, error: '' }))
      .catch((err) => setList({ auctions: [], error: err instanceof Error ? err.message : 'Could not load auctions.' }))
  }, [])

  const requested = Number(params.get('id')) || null
  const selectedId = requested ?? list?.auctions[0]?.auction_id ?? null
  const live = useAuctionLive(selectedId)
  const { title, description, emptyMessage } = auctionContent

  const boardRef = useRef<HTMLDivElement>(null)
  const [fullscreen, setFullscreen] = useState(false)
  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === boardRef.current)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])
  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen()
    else boardRef.current?.requestFullscreen?.()
  }, [])

  const snapshot = live.snapshot

  return (
    <Container as="section" className="auction-page py-4">
      <div className="text-center mb-4">
        <h1>{title}</h1>
        <p className="text-muted mb-0">{description}</p>
      </div>

      {list && list.auctions.length > 1 && (
        <div className="auction-page__select mb-4 mx-auto">
          <Form.Select
            aria-label="Choose an auction"
            value={selectedId ?? ''}
            onChange={(e) => setParams({ id: e.target.value })}
          >
            {list.auctions.map((a) => (
              <option key={a.auction_id} value={a.auction_id}>
                {a.title} · {auctionStatusLabel(a.status)}
              </option>
            ))}
          </Form.Select>
        </div>
      )}

      {!list || (selectedId && live.loading) ? (
        <div className="text-center py-5"><Spinner animation="border" /></div>
      ) : !selectedId || !snapshot ? (
        <Card className="shadow-sm border-0">
          <Card.Body className="text-center text-muted py-5">{live.error || list.error || emptyMessage}</Card.Body>
        </Card>
      ) : (
        <div ref={boardRef} className={`auction-live${fullscreen ? ' auction-live--fullscreen' : ''}`}>
          <Board snapshot={snapshot} mode={live.mode} fullscreen={fullscreen} onToggleFullscreen={toggleFullscreen} />
        </div>
      )}
    </Container>
  )
}

type BoardProps = { snapshot: AuctionSnapshot; mode: LiveMode; fullscreen: boolean; onToggleFullscreen: () => void }

function Board({ snapshot, mode, fullscreen, onToggleFullscreen }: BoardProps) {
  const { auction, counts, current, teams } = snapshot
  const running = auction.status === 'LIVE' || auction.status === 'PAUSED'
  const meta = [auction.tournament?.title, auction.season_name, formatAuctionDate(auction.auction_date), auction.venue]
    .filter(Boolean)
    .join(' · ')

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
        <div>
          <h2 className="h3 mb-1 auction-live__title">{auction.title}</h2>
          {meta && <div className="auction-live__muted small">{meta}</div>}
        </div>
        <div className="d-flex flex-wrap gap-2 align-items-center">
          <Badge bg={auctionStatusVariant(auction.status)} className="auction-page__status">{auctionStatusLabel(auction.status)}</Badge>
          {running && <span className={`small auction-live__mode auction-live__mode--${mode}`}>{MODE_TEXT[mode]}</span>}
          {document.fullscreenEnabled && (
            <Button size="sm" variant={fullscreen ? 'light' : 'outline-primary'} onClick={onToggleFullscreen}>
              {fullscreen ? 'Exit full screen' : 'Full screen'}
            </Button>
          )}
        </div>
      </div>

      <Row className="g-3 mb-4" xs={2} md={4}>
        <Col><Counter label="Sold" value={counts.sold} /></Col>
        <Col><Counter label="Unsold" value={counts.unsold} /></Col>
        <Col><Counter label="Still to come" value={counts.remaining} /></Col>
        <Col><Counter label="Points spent" value={formatPoints(snapshot.total_spent)} /></Col>
      </Row>

      {running && (
        current ? (
          <CurrentPlayer snapshot={snapshot} current={current} />
        ) : (
          <Card className="border-0 shadow-sm mb-4 auction-live__card">
            <Card.Body className="text-center py-5">
              {auction.status === 'PAUSED' ? (
                <h3 className="h4 mb-0">The auction is paused</h3>
              ) : (
                <>
                  <LastResult snapshot={snapshot} />
                  <div className="auction-live__muted">Waiting for the next player…</div>
                </>
              )}
            </Card.Body>
          </Card>
        )
      )}

      {auction.status === 'COMPLETED' && (
        <h3 className="h4 mb-3">Final squads</h3>
      )}
      <Row xs={1} sm={2} lg={3} xl={teams.length > 6 ? 4 : 3} className="g-3 mb-4">
        {teams.map((t) => {
          const leading = current?.highest?.team_id === t.team_id
          return (
            <Col key={t.team_id}>
              <Card className={`border-0 shadow-sm h-100 auction-live__card${leading ? ' auction-live__team--leading' : ''}`}>
                <Card.Body>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <TeamBadge name={t.team_name} logo={t.team_logo} size={36} />
                    <div className="flex-grow-1 min-w-0">
                      <div className="fw-semibold text-truncate">{t.team_name}</div>
                      <small className="auction-live__muted">{t.players_bought} / {t.max_players} players</small>
                    </div>
                    <div className="text-end">
                      <div className="fw-bold">{formatPoints(t.remaining)}</div>
                      <small className="auction-live__muted">left</small>
                    </div>
                  </div>
                  <ProgressBar now={t.budget ? (t.spent / t.budget) * 100 : 0} variant="success" className="auction-page__bar mb-2"
                    aria-label={`${t.team_name} has spent ${formatPoints(t.spent)} of ${formatPoints(t.budget)}`} />
                  {t.players.length > 0 && (
                    <ul className="list-unstyled small mb-0 auction-live__squad">
                      {t.players.map((p) => (
                        <li key={p.lot_id} className="d-flex justify-content-between gap-2">
                          <span className="text-truncate">{p.player_name}</span>
                          <span className="auction-live__muted text-nowrap">{formatPoints(p.sold_price)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card.Body>
              </Card>
            </Col>
          )
        })}
      </Row>

      {!fullscreen && <PlayerList snapshot={snapshot} />}
    </>
  )
}

function Counter({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Card className="border-0 shadow-sm h-100 text-center auction-live__card">
      <Card.Body className="py-3">
        <div className="fs-3 fw-bold">{value}</div>
        <div className="small auction-live__muted">{label}</div>
      </Card.Body>
    </Card>
  )
}

function LastResult({ snapshot }: { snapshot: AuctionSnapshot }) {
  const last = snapshot.last_event
  if (!last || (last.type !== 'PLAYER_SOLD' && last.type !== 'PLAYER_UNSOLD')) return null
  const lot = snapshot.lots.find((l) => l.lot_id === last.lot_id)
  if (!lot) return null
  return last.type === 'PLAYER_SOLD' ? (
    <div className="mb-3">
      <div className="auction-live__sold">SOLD</div>
      <div className="fs-4">
        <strong>{lot.player_name}</strong> to <strong>{last.team_name}</strong> for <strong>{formatPoints(last.amount ?? 0)}</strong>
      </div>
    </div>
  ) : (
    <div className="mb-3 fs-4"><strong>{lot.player_name}</strong> went unsold</div>
  )
}

function CurrentPlayer({ snapshot, current }: { snapshot: AuctionSnapshot; current: NonNullable<AuctionSnapshot['current']> }) {
  const style = playerStyle(current)
  return (
    <Row className="g-3 mb-4">
      <Col lg={8}>
        <Card className="border-0 shadow-sm h-100 auction-live__card auction-live__current">
          <Card.Body className="d-flex flex-wrap align-items-center gap-4">
            <img
              src={getProfilePhotoUrl(current.profile_photo)}
              onError={handleProfilePhotoError}
              alt={current.player_name}
              className="auction-live__photo"
            />
            <div className="flex-grow-1 min-w-0">
              <div className="auction-live__muted small text-uppercase">Now bidding · Lot {current.lot_number}</div>
              <div className="auction-live__player">{current.player_name}</div>
              <div className="d-flex flex-wrap gap-2 align-items-center mt-1">
                {current.category && <Badge bg="primary">{current.category}</Badge>}
                {current.vibhaag && <span>{current.vibhaag}</span>}
              </div>
              {style && <div className="auction-live__muted small mt-1">{style}</div>}
              <div className="auction-live__muted small mt-1">Base {formatPoints(current.base_price)}</div>
            </div>
            <div className="text-center auction-live__bid">
              <div className="auction-live__muted small text-uppercase">{current.highest ? 'Highest bid' : 'Starting at'}</div>
              <div className="auction-live__amount" aria-live="polite">{formatPoints(current.highest?.amount ?? current.base_price)}</div>
              <div className="fs-5 fw-semibold">{current.highest ? current.highest.team_name : 'Waiting for bids'}</div>
              {current.highest && (
                <div className="auction-live__muted small">Next bid at least {formatPoints(current.next_min_bid)}</div>
              )}
            </div>
          </Card.Body>
        </Card>
      </Col>
      <Col lg={4}>
        <Card className="border-0 shadow-sm h-100 auction-live__card">
          <Card.Header className="bg-transparent fw-semibold">Bids</Card.Header>
          <ListGroup variant="flush" className="auction-live__bids">
            {current.bids.length === 0 && <ListGroup.Item className="auction-live__muted bg-transparent">No bids yet.</ListGroup.Item>}
            {current.bids.map((b, i) => (
              <ListGroup.Item key={`${b.team_id}-${b.amount}`} className={`d-flex justify-content-between bg-transparent${i === 0 ? ' fw-bold' : ''}`}>
                <span>{b.team_name}</span>
                <span>{formatPoints(b.amount)}</span>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Card>
      </Col>
      {snapshot.auction.rules && (
        <Col xs={12} className="small auction-live__muted">{snapshot.auction.rules}</Col>
      )}
    </Row>
  )
}

type Filter = 'all' | 'SOLD' | 'UNSOLD' | 'PENDING'

function PlayerList({ snapshot }: { snapshot: AuctionSnapshot }) {
  const [filter, setFilter] = useState<Filter>('all')
  const lots = snapshot.lots.filter((l) => filter === 'all' || l.status === filter)
  const options: [Filter, string][] = [['all', 'All'], ['SOLD', 'Sold'], ['UNSOLD', 'Unsold'], ['PENDING', 'Still to come']]

  return (
    <Card className="shadow-sm border-0">
      <Card.Header className="bg-white d-flex flex-wrap justify-content-between align-items-center gap-2">
        <span className="fw-semibold">Players</span>
        <ButtonGroup size="sm">
          {options.map(([key, label]) => (
            <Button key={key} variant={filter === key ? 'primary' : 'outline-primary'} onClick={() => setFilter(key)}>{label}</Button>
          ))}
        </ButtonGroup>
      </Card.Header>
      <Card.Body className="p-0">
        <Table responsive striped hover className="mb-0 align-middle">
          <thead className="table-light">
            <tr>
              <th>#</th>
              <th>Player</th>
              <th>Category</th>
              <th>Vibhaag</th>
              <th className="text-end">Base</th>
              <th>Team</th>
              <th className="text-end">Sold for</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {lots.length === 0 && (
              <tr><td colSpan={8} className="text-center text-muted py-4">No players here.</td></tr>
            )}
            {lots.map((lot) => (
              <tr key={lot.lot_id}>
                <td>{lot.lot_number}</td>
                <td>{lot.player_name}</td>
                <td>{lot.category ?? '—'}</td>
                <td>{lot.vibhaag || '—'}</td>
                <td className="text-end">{formatPoints(lot.base_price)}</td>
                <td>{lot.team_name || '—'}</td>
                <td className="text-end">{lot.sold_price != null ? formatPoints(lot.sold_price) : '—'}</td>
                <td>
                  <Badge bg={LOT_STATUS_VARIANT[lot.status]} text={lot.status === 'PENDING' ? 'dark' : undefined}>
                    {LOT_STATUS_LABEL[lot.status]}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  )
}
