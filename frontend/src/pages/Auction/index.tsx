import { useCallback, useEffect, useRef, useState, type SyntheticEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Badge, Button, Card, Col, Container, Modal, Row, Spinner, Table } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCalendarDays, faCompress, faExpand, faLocationDot } from '@fortawesome/free-solid-svg-icons'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import PageShell from '@/components/common/PageShell'
import { auctionContent } from '@/content'
import TeamBadge from '@/components/tournament/TeamBadge'
import { useAuctionLive } from '@/hooks/useAuctionLive'
import { usePageTitle } from '@/hooks/usePageTitle'
import {
  auctionPublicApi,
  type AuctionSnapshot,
  type PublicAuctionSummary,
  type PublicLot,
  type PublicTeam,
} from '@/services/api/auctionApi'
import defaultTournamentImage from '@/assets/default-tournament.svg'
import { getUploadUrl } from '@/utils/activityImage'
import { formatAuctionDate, formatPoints, truncateAuctionText } from '@/utils/auctionText'
import { getProfilePhotoUrl, handleProfilePhotoError } from '@/utils/profilePhoto'
import './Auction.scss'

type ListState = { auctions: PublicAuctionSummary[]; error: string } | null

const CARD_BADGE: Record<PublicAuctionSummary['phase'], string> = {
  live: 'success',
  completed: 'secondary',
  upcoming: 'primary',
}

const LOT_BADGE: Record<string, string> = {
  ON_BLOCK: 'primary',
  SOLD: 'success',
  UNSOLD: 'secondary',
  PENDING: 'light',
}

function auctionImageSrc(path: string | null | undefined) {
  return path?.trim() ? getUploadUrl(path) : defaultTournamentImage
}

function auctionImageFallback(event: SyntheticEvent<HTMLImageElement>) {
  event.currentTarget.onerror = null
  event.currentTarget.src = defaultTournamentImage
}

function formatBirthDate(value: string | null | undefined) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function yesNo(value: string | null | undefined) {
  if (value === 'true' || value === 'Yes' || value === 'yes') return 'Yes'
  if (value === 'false' || value === 'No' || value === 'no') return 'No'
  return value?.trim() || '—'
}

function lotBadge(lot: PublicLot) {
  return LOT_BADGE[lot.status] ?? 'light'
}

export default function AuctionPage() {
  const [params, setParams] = useSearchParams()
  const [list, setList] = useState<ListState>(null)
  const selectedId = Number(params.get('id')) || null

  useEffect(() => {
    auctionPublicApi
      .list()
      .then((res) => setList({ auctions: res.data, error: '' }))
      .catch((err) => setList({ auctions: [], error: err instanceof Error ? err.message : 'Could not load auctions.' }))
  }, [])

  const { title, description, emptyMessage } = auctionContent

  if (selectedId) {
    return (
      <Container as="section" className="auction-page py-4">
        <AuctionBoard auctionId={selectedId} listError={list?.error} />
      </Container>
    )
  }

  return (
    <PageShell title={title} description={description}>
      {!list ? (
        <div className="text-center py-5"><Spinner animation="border" /></div>
      ) : list.error ? (
        <Card className="shadow-sm border-0">
          <Card.Body className="text-center text-danger py-5">{list.error}</Card.Body>
        </Card>
      ) : list.auctions.length === 0 ? (
        <Card className="shadow-sm border-0">
          <Card.Body className="text-center text-muted py-5">{emptyMessage}</Card.Body>
        </Card>
      ) : (
        <Row xs={1} md={2} lg={3} className="g-4">
          {list.auctions.map((auction) => (
            <Col key={auction.auction_id}>
              <AuctionCard auction={auction} onOpen={() => setParams({ id: String(auction.auction_id) })} />
            </Col>
          ))}
        </Row>
      )}
    </PageShell>
  )
}

function AuctionCard({ auction, onOpen }: { auction: PublicAuctionSummary; onOpen: () => void }) {
  const blurb = truncateAuctionText(auction.description)
  const dateLabel = formatAuctionDate(auction.auction_date)

  return (
    <Card className="h-100 border-0 shadow-sm auction-card">
      <div className="auction-card__media">
        <Card.Img
          src={auctionImageSrc(auction.image_url)}
          onError={auctionImageFallback}
          alt=""
          className="auction-card__image"
        />
        <Badge bg={CARD_BADGE[auction.phase]} className="auction-card__status">{auction.status_label}</Badge>
      </div>
      <Card.Body className="d-flex flex-column">
        <Card.Title as="h2" className="h5 mb-2">{auction.title}</Card.Title>
        {(dateLabel || auction.venue) && (
          <div className="small text-muted mb-2">
            {[dateLabel, auction.venue].filter(Boolean).join(' · ')}
          </div>
        )}
        {blurb ? (
          <Card.Text className="text-muted small flex-grow-1">{blurb}</Card.Text>
        ) : (
          <div className="flex-grow-1" />
        )}
        <Button
          variant={auction.phase === 'completed' ? 'outline-primary' : 'primary'}
          className="w-100 mt-3"
          disabled={!auction.cta_enabled}
          onClick={onOpen}
        >
          {auction.cta_label}
        </Button>
      </Card.Body>
    </Card>
  )
}

function AuctionBoard({ auctionId, listError }: { auctionId: number; listError?: string }) {
  const live = useAuctionLive(auctionId)
  const boardRef = useRef<HTMLDivElement>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const { emptyMessage } = auctionContent
  usePageTitle(live.snapshot?.auction.title ?? 'Auction')

  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === boardRef.current)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen()
    else boardRef.current?.requestFullscreen?.()
  }, [])

  if (live.loading) {
    return <div className="text-center py-5"><Spinner animation="border" /></div>
  }

  if (!live.snapshot) {
    return (
      <Card className="shadow-sm border-0">
        <Card.Body className="text-center text-muted py-5">
          {live.error || listError || emptyMessage}
        </Card.Body>
      </Card>
    )
  }

  return (
    <div ref={boardRef} className={`auction-live${fullscreen ? ' auction-live--fullscreen' : ''}`}>
      <Board snapshot={live.snapshot} fullscreen={fullscreen} onToggleFullscreen={toggleFullscreen} />
    </div>
  )
}

type BoardProps = {
  snapshot: AuctionSnapshot
  fullscreen: boolean
  onToggleFullscreen: () => void
}

function Board({ snapshot, fullscreen, onToggleFullscreen }: BoardProps) {
  const { auction, teams, next, featured, pool } = snapshot
  const listedPlayers = pool ?? snapshot.lots.filter((l) => l.status !== 'SOLD')
  const featuredPlayer = featured ?? snapshot.current
  const dateLabel = formatAuctionDate(auction.auction_date)

  return (
    <>
      <div className="auction-live__header">
        <h1 className="page-heading__title mb-0">{auction.title}</h1>
        {document.fullscreenEnabled && (
          <Button
            variant="link"
            className="auction-live__fullscreen"
            onClick={onToggleFullscreen}
            aria-label={fullscreen ? 'Exit full screen' : 'View full screen'}
          >
            <FontAwesomeIcon icon={fullscreen ? faCompress : faExpand} />
          </Button>
        )}
      </div>

      <div className="auction-live__meta">
        {dateLabel && (
          <span>
            <FontAwesomeIcon icon={faCalendarDays} className="me-2" aria-hidden />
            {dateLabel}
          </span>
        )}
        {auction.venue && (
          <span>
            <FontAwesomeIcon icon={faLocationDot} className="me-2" aria-hidden />
            {auction.venue}
          </span>
        )}
      </div>

      {auction.status === 'PAUSED' && (
        <div className="auction-live__paused mb-3">The auction is paused</div>
      )}

      <section className="mb-4">
        <h2 className="h5 mb-3">Teams</h2>
        <Row xs={1} md={2} lg={3} className="g-3">
          {teams.map((team) => (
            <Col key={team.team_id}>
              <TeamCard team={team} />
            </Col>
          ))}
          {teams.length === 0 && (
            <Col>
              <Card className="border-0 shadow-sm">
                <Card.Body className="text-muted text-center py-4">No teams in this auction yet.</Card.Body>
              </Card>
            </Col>
          )}
        </Row>
      </section>

      <Row className="g-3 mb-3">
        <Col lg={5}>
          <Card className="border-0 shadow-sm h-100 auction-live__card">
            <Card.Header className="bg-transparent fw-semibold">Registered players</Card.Header>
            <Card.Body className="p-0">
              <div className="auction-live__player-table">
                <Table responsive hover className="mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>Player</th>
                      <th>Vibhaag</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listedPlayers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center text-muted py-4">No players left in the list.</td>
                      </tr>
                    ) : (
                      listedPlayers.map((lot) => (
                        <tr
                          key={lot.lot_id}
                          className={featuredPlayer?.lot_id === lot.lot_id ? 'auction-live__row--active' : undefined}
                        >
                          <td>{lot.lot_number}</td>
                          <td className="fw-semibold">{lot.player_name}</td>
                          <td>{lot.vibhaag || '—'}</td>
                          <td>
                            <Badge
                              bg={lotBadge(lot)}
                              text={lot.status === 'PENDING' ? 'dark' : undefined}
                            >
                              {lot.status_label}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={7}>
          <Card
            key={featuredPlayer ? `lot-${featuredPlayer.lot_id}-${featuredPlayer.status}` : 'waiting'}
            className="border-0 shadow-sm h-100 auction-live__card"
          >
            {featuredPlayer ? (
              <>
                <Card.Header className="bg-transparent">
                  <h2 className="h4 mb-0">{featuredPlayer.player_name}</h2>
                </Card.Header>
                <Card.Body>
                  <Row className="g-3 align-items-start">
                    <Col sm={4} className="text-center">
                      <img
                        src={getProfilePhotoUrl(featuredPlayer.profile_photo)}
                        onError={handleProfilePhotoError}
                        alt={featuredPlayer.player_name}
                        className="auction-live__photo"
                      />
                    </Col>
                    <Col sm={8}>
                      <dl className="auction-live__details mb-0">
                        <div><dt>Vibhaag</dt><dd>{featuredPlayer.vibhaag || '—'}</dd></div>
                        <div><dt>Birthdate</dt><dd>{formatBirthDate(featuredPlayer.date_of_birth)}</dd></div>
                        <div><dt>Batting style</dt><dd>{featuredPlayer.batting_style || '—'}</dd></div>
                        <div><dt>Bowling style</dt><dd>{featuredPlayer.bowling_style || '—'}</dd></div>
                        <div><dt>Is wicketkeeper?</dt><dd>{yesNo(featuredPlayer.is_wicketkeeper)}</dd></div>
                        <div>
                          <dt>No. of points spent</dt>
                          <dd>
                            {featuredPlayer.points_spent != null
                              ? formatPoints(featuredPlayer.points_spent)
                              : '—'}
                          </dd>
                        </div>
                        <div>
                          <dt>Status</dt>
                          <dd>
                            <Badge
                              bg={lotBadge(featuredPlayer)}
                              text={featuredPlayer.status === 'PENDING' ? 'dark' : undefined}
                            >
                              {featuredPlayer.status_label}
                            </Badge>
                            {featuredPlayer.status === 'SOLD' && featuredPlayer.team_name && (
                              <span className="ms-2 small text-muted">to {featuredPlayer.team_name}</span>
                            )}
                          </dd>
                        </div>
                      </dl>
                    </Col>
                  </Row>
                </Card.Body>
              </>
            ) : (
              <Card.Body className="text-center text-muted py-5">
                Waiting for the next player to come up for selection…
              </Card.Body>
            )}
          </Card>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm auction-live__next">
        <Card.Body className="d-flex flex-wrap align-items-center justify-content-between gap-2 py-3">
          <span className="text-muted">Next player</span>
          <strong className="fs-5 mb-0">
            {next ? `${next.player_name}` : 'No more players waiting'}
          </strong>
        </Card.Body>
      </Card>
    </>
  )
}

function TeamCard({ team }: { team: PublicTeam }) {
  const [showPlayers, setShowPlayers] = useState(false)
  const selected = team.players_bought
  const remaining = Math.max(0, team.slots_left)
  const chartData = [
    { name: 'Selected', value: selected || 0 },
    { name: 'Remaining', value: remaining || 0 },
  ]
  const hasSquad = selected + remaining > 0

  return (
    <>
      <Card className="border-0 shadow-sm h-100 auction-live__team-card">
        <Card.Body className="d-flex flex-column">
          <div className="d-flex align-items-center gap-2 mb-3">
            <TeamBadge name={team.team_name} logo={team.team_logo} size={40} />
            <div className="fw-semibold text-truncate">{team.team_name}</div>
          </div>
          <div className="d-flex align-items-center gap-3">
            <div className="auction-live__donut" aria-hidden={!hasSquad}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={hasSquad ? chartData : [{ name: 'Empty', value: 1 }]}
                    dataKey="value"
                    innerRadius="68%"
                    outerRadius="95%"
                    stroke="none"
                    isAnimationActive={false}
                  >
                    {hasSquad ? (
                      <>
                        <Cell fill="#1e5bb8" />
                        <Cell fill="#d9e4f5" />
                      </>
                    ) : (
                      <Cell fill="#e9ecef" />
                    )}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="list-unstyled small mb-0 auction-live__team-stats">
              <li>
                <span className="text-muted">Points remaining</span>
                <strong>{formatPoints(team.remaining)}</strong>
              </li>
              <li>
                <span className="text-muted">Players selected</span>
                <strong>{selected}</strong>
              </li>
              <li>
                <span className="text-muted">Players remaining</span>
                <strong>{remaining}</strong>
              </li>
            </ul>
          </div>
          <Button
            size="sm"
            variant="outline-primary"
            className="mt-3 align-self-start"
            onClick={() => setShowPlayers(true)}
          >
            View team players
          </Button>
        </Card.Body>
      </Card>

      <Modal show={showPlayers} onHide={() => setShowPlayers(false)} centered>
        <Modal.Header closeButton className="align-items-center">
          <Modal.Title as="h5" className="d-flex align-items-center gap-2 mb-0">
            <TeamBadge name={team.team_name} logo={team.team_logo} size={40} />
            <span>{team.team_name}</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          {team.players.length === 0 ? (
            <p className="text-muted text-center py-4 mb-0">No players selected yet.</p>
          ) : (
            <Table responsive hover className="mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>Player</th>
                  <th>Category</th>
                  <th className="text-end">Points spent</th>
                </tr>
              </thead>
              <tbody>
                {team.players.map((player) => (
                  <tr key={player.lot_id}>
                    <td className="fw-semibold">{player.player_name}</td>
                    <td>{player.category || '—'}</td>
                    <td className="text-end">{formatPoints(player.sold_price)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Modal.Body>
      </Modal>
    </>
  )
}
