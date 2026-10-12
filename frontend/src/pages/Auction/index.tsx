import { useEffect, useState } from 'react'
import { Badge, Card, Col, Container, Form, ProgressBar, Row, Spinner, Table } from 'react-bootstrap'
import { auctionContent } from '@/content'
import { DEFAULT_MAX_PLAYERS_PER_TEAM } from '@/constants/auctionOptions'
import { auctionApi, type AuctionSeasonData } from '@/services/api/auctionApi'
import { statsApi, type Season } from '@/services/api/publicApi'
import { formatPoints } from '@/utils/auctionPoints'
import { pickDefaultSeason } from '@/utils/season'
import './Auction.scss'

function statusVariant(status: string) {
  if (status === 'LIVE') return 'success'
  if (status === 'COMPLETED') return 'secondary'
  return 'warning'
}

function categoryVariant(role: string | null) {
  if (role === 'Batsman') return 'primary'
  if (role === 'Bowler') return 'info'
  if (role === 'All-rounder') return 'warning'
  return 'secondary'
}

export default function AuctionPage() {
  const [seasons, setSeasons] = useState<Season[]>([])
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null)
  const [data, setData] = useState<AuctionSeasonData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    statsApi
      .getSeasons()
      .then((res) => {
        const list = res.data ?? []
        setSeasons(list)
        const defaultSeason = pickDefaultSeason(list)
        if (defaultSeason) setSelectedSeasonId(defaultSeason.season_id)
      })
      .catch(() => setSeasons([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (selectedSeasonId == null) {
      setData(null)
      return
    }

    setLoading(true)
    auctionApi
      .getBySeason(selectedSeasonId)
      .then((res) => setData(res.data ?? null))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [selectedSeasonId])

  const { title, description, emptyMessage } = auctionContent
  const pointsPerTeam = Number(
    data?.auction.points_per_team ?? data?.auction.budget_per_team ?? 100000
  )
  const maxPlayers =
    data?.auction.max_players_per_team ?? DEFAULT_MAX_PLAYERS_PER_TEAM

  return (
    <Container as="section" className="auction-page py-4">
      <div className="text-center mb-4">
        <h1>{title}</h1>
        <p className="text-muted mb-0">{description}</p>
      </div>

      {seasons.length > 0 && (
        <div className="auction-page__season-select mb-4 mx-auto">
          <Form.Select
            aria-label="Select season"
            value={selectedSeasonId ?? ''}
            onChange={(e) => setSelectedSeasonId(Number(e.target.value))}
          >
            {seasons.map((season) => (
              <option key={season.season_id} value={season.season_id}>
                {season.season_name}
              </option>
            ))}
          </Form.Select>
        </div>
      )}

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      ) : !data?.auction ? (
        <Card className="shadow-sm border-0">
          <Card.Body className="text-center text-muted py-5">{emptyMessage}</Card.Body>
        </Card>
      ) : (
        <>
          <Card className="shadow-sm border-0 mb-4 auction-page__summary">
            <Card.Body>
              <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
                <div>
                  <h2 className="h4 mb-2">{data.auction.title}</h2>
                  {data.auction.description && (
                    <p className="text-muted mb-2">{data.auction.description}</p>
                  )}
                  <div className="d-flex flex-wrap gap-3 text-muted small">
                    {data.auction.auction_date && (
                      <span>
                        Date:{' '}
                        {new Date(data.auction.auction_date).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                    )}
                    {data.auction.venue && <span>Venue: {data.auction.venue}</span>}
                    <span>Points per team: {formatPoints(pointsPerTeam)}</span>
                    <span>Max squad size: {maxPlayers} players</span>
                  </div>
                </div>
                <Badge bg={statusVariant(data.auction.status)} className="auction-page__status">
                  {data.auction.status}
                </Badge>
              </div>
            </Card.Body>
          </Card>

          <Row className="g-4 mb-4">
            {data.teamSpend.map((team) => {
              const squadProgress = (team.players_bought / maxPlayers) * 100
              const pointsProgress = (team.points_spent / pointsPerTeam) * 100

              return (
                <Col key={team.team_id} xs={12} sm={6} lg={4}>
                  <Card className="shadow-sm border-0 h-100">
                    <Card.Body>
                      <Card.Title as="h5" className="h6 mb-3">
                        {team.team_name}
                      </Card.Title>
                      <div className="mb-2">
                        <div className="d-flex justify-content-between text-muted small mb-1">
                          <span>Squad</span>
                          <strong className="text-dark">
                            {team.players_bought} / {maxPlayers}
                          </strong>
                        </div>
                        <ProgressBar now={squadProgress} variant="primary" className="auction-page__bar" />
                      </div>
                      <div className="mb-3">
                        <div className="d-flex justify-content-between text-muted small mb-1">
                          <span>Points spent</span>
                          <strong className="text-dark">{formatPoints(team.points_spent)}</strong>
                        </div>
                        <ProgressBar now={pointsProgress} variant="success" className="auction-page__bar" />
                        <div className="text-muted small mt-1">
                          {formatPoints(team.points_remaining)} remaining
                        </div>
                      </div>
                      <div className="d-flex flex-wrap gap-2">
                        <Badge bg="primary">BAT {team.batsmen}</Badge>
                        <Badge bg="info">BOWL {team.bowlers}</Badge>
                        <Badge bg="warning" text="dark">
                          AR {team.all_rounders}
                        </Badge>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              )
            })}
          </Row>

          <Card className="shadow-sm border-0">
            <Card.Body className="p-0">
              <Table responsive striped hover className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Lot</th>
                    <th>Player</th>
                    <th>Category</th>
                    <th>Vibhaag</th>
                    <th>Base Points</th>
                    <th>Sold To</th>
                    <th>Bid Points</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.lots.map((lot) => (
                    <tr key={lot.lot_id}>
                      <td>{lot.lot_number}</td>
                      <td>{lot.player_name}</td>
                      <td>
                        {lot.player_role ? (
                          <Badge bg={categoryVariant(lot.player_role)}>{lot.player_role}</Badge>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>{lot.vibhaag || '—'}</td>
                      <td>{formatPoints(Number(lot.base_price))}</td>
                      <td>{lot.team_name || '—'}</td>
                      <td>
                        {lot.sold_price != null ? formatPoints(Number(lot.sold_price)) : '—'}
                      </td>
                      <td>
                        <Badge
                          bg={
                            lot.status === 'SOLD'
                              ? 'success'
                              : lot.status === 'UNSOLD'
                                ? 'secondary'
                                : 'warning'
                          }
                        >
                          {lot.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </>
      )}
    </Container>
  )
}
