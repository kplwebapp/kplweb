import { useEffect, useState } from 'react'
import {
  Alert,
  Badge,
  Button,
  Col,
  Form,
  Modal,
  Row,
  Spinner,
  Table,
} from 'react-bootstrap'
import PageHeader, { AdminSection } from '@/admin/components/common/PageHeader'
import {
  AUCTION_PLAYER_CATEGORIES,
  DEFAULT_MAX_PLAYERS_PER_TEAM,
  DEFAULT_POINTS_PER_TEAM,
} from '@/constants/auctionOptions'
import {
  auctionApi,
  type Auction,
  type AuctionLot,
  type AuctionSeasonData,
} from '@/services/api/auctionApi'
import { competitionApi, type Team } from '@/services/api/competitionApi'
import { statsApi, type Season } from '@/services/api/publicApi'
import { formatPoints } from '@/utils/auctionPoints'
import { pickDefaultSeason } from '@/utils/season'

type LotForm = {
  lot_number: number
  player_name: string
  player_role: string
  vibhaag: string
  base_price: number
  status: string
  team_id: number | ''
  sold_price: number | ''
}

const emptyLotForm = (): LotForm => ({
  lot_number: 1,
  player_name: '',
  player_role: 'Batsman',
  vibhaag: '',
  base_price: 0,
  status: 'PENDING',
  team_id: '',
  sold_price: '',
})

export default function AuctionPage() {
  const [seasons, setSeasons] = useState<Season[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null)
  const [data, setData] = useState<AuctionSeasonData | null>(null)
  const [auctionForm, setAuctionForm] = useState<Partial<Auction>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showLotModal, setShowLotModal] = useState(false)
  const [editingLot, setEditingLot] = useState<AuctionLot | null>(null)
  const [lotForm, setLotForm] = useState<LotForm>(emptyLotForm())

  useEffect(() => {
    Promise.all([statsApi.getSeasons(), competitionApi.listTeams()])
      .then(([seasonRes, teamRes]) => {
        const list = seasonRes.data ?? []
        setSeasons(list)
        setTeams(teamRes.data ?? [])
        const defaultSeason = pickDefaultSeason(list)
        if (defaultSeason) setSelectedSeasonId(defaultSeason.season_id)
      })
      .catch(() => {
        setSeasons([])
        setTeams([])
      })
  }, [])

  const loadAuction = (seasonId: number) => {
    setLoading(true)
    setError('')
    auctionApi
      .getBySeason(seasonId)
      .then((res) => {
        const payload = res.data ?? null
        setData(payload)
        if (payload?.auction) {
          setAuctionForm(payload.auction)
        } else {
          setAuctionForm({
            title: 'KPL Season Auction',
            status: 'UPCOMING',
            budget_per_team: DEFAULT_POINTS_PER_TEAM,
            max_players_per_team: DEFAULT_MAX_PLAYERS_PER_TEAM,
            venue: 'Kansara Community Grounds',
          })
        }
      })
      .catch(() => {
        setData(null)
        setError('Failed to load auction.')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (selectedSeasonId == null) return
    loadAuction(selectedSeasonId)
  }, [selectedSeasonId])

  const handleSaveAuction = async () => {
    if (selectedSeasonId == null) return
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await auctionApi.upsertAuction({
        season_id: selectedSeasonId,
        title: auctionForm.title || 'KPL Player Auction',
        description: auctionForm.description || '',
        auction_date: auctionForm.auction_date || null,
        venue: auctionForm.venue || '',
        status: auctionForm.status || 'UPCOMING',
        budget_per_team: Number(auctionForm.budget_per_team) || DEFAULT_POINTS_PER_TEAM,
        max_players_per_team:
          Number(auctionForm.max_players_per_team) || DEFAULT_MAX_PLAYERS_PER_TEAM,
      })
      setSuccess('Auction details saved.')
      loadAuction(selectedSeasonId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save auction.')
    } finally {
      setSaving(false)
    }
  }

  const openAddLot = () => {
    setEditingLot(null)
    const nextLot = (data?.lots.length ?? 0) + 1
    setLotForm({ ...emptyLotForm(), lot_number: nextLot })
    setShowLotModal(true)
  }

  const openEditLot = (lot: AuctionLot) => {
    setEditingLot(lot)
    setLotForm({
      lot_number: lot.lot_number,
      player_name: lot.player_name,
      player_role: lot.player_role || 'Batsman',
      vibhaag: lot.vibhaag || '',
      base_price: Number(lot.base_price),
      status: lot.status,
      team_id: lot.team_id ?? '',
      sold_price: lot.sold_price != null ? Number(lot.sold_price) : '',
    })
    setShowLotModal(true)
  }

  const handleSaveLot = async () => {
    if (selectedSeasonId == null) return
    if (!lotForm.player_role) {
      setError('Player category is required.')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const payload = {
        lot_number: lotForm.lot_number,
        player_name: lotForm.player_name,
        player_role: lotForm.player_role,
        vibhaag: lotForm.vibhaag,
        base_price: lotForm.base_price,
        status: lotForm.status,
        team_id: lotForm.team_id === '' ? null : Number(lotForm.team_id),
        sold_price: lotForm.sold_price === '' ? null : Number(lotForm.sold_price),
      }

      if (editingLot) {
        await auctionApi.updateLot(editingLot.lot_id, {
          ...payload,
          player_role: lotForm.player_role as (typeof AUCTION_PLAYER_CATEGORIES)[number],
        })
      } else {
        await auctionApi.createLot({
          season_id: selectedSeasonId,
          ...payload,
          player_role: lotForm.player_role as (typeof AUCTION_PLAYER_CATEGORIES)[number],
        })
      }

      setShowLotModal(false)
      setSuccess(editingLot ? 'Lot updated.' : 'Lot added.')
      loadAuction(selectedSeasonId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save lot.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteLot = async (lotId: number) => {
    if (selectedSeasonId == null || !window.confirm('Delete this lot?')) return
    setSaving(true)
    setError('')
    try {
      await auctionApi.deleteLot(lotId)
      setSuccess('Lot deleted.')
      loadAuction(selectedSeasonId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete lot.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminSection>
      <PageHeader
        title="Player Auction"
        description="Points-based auction — each team has 1,00,000 points and may bid on up to 16 players."
      />

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <div className="mb-3" style={{ maxWidth: 320 }}>
        <Form.Select
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

      {loading ? (
        <div className="text-center py-4">
          <Spinner animation="border" />
        </div>
      ) : (
        <>
          <Row className="g-3 mb-4">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Title</Form.Label>
                <Form.Control
                  value={auctionForm.title || ''}
                  onChange={(e) => setAuctionForm((p) => ({ ...p, title: e.target.value }))}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Status</Form.Label>
                <Form.Select
                  value={auctionForm.status || 'UPCOMING'}
                  onChange={(e) => setAuctionForm((p) => ({ ...p, status: e.target.value }))}
                >
                  <option value="UPCOMING">UPCOMING</option>
                  <option value="LIVE">LIVE</option>
                  <option value="COMPLETED">COMPLETED</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Points / Team</Form.Label>
                <Form.Control
                  type="number"
                  value={auctionForm.budget_per_team ?? ''}
                  onChange={(e) =>
                    setAuctionForm((p) => ({ ...p, budget_per_team: Number(e.target.value) }))
                  }
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Max Players / Team</Form.Label>
                <Form.Control
                  type="number"
                  min={1}
                  max={25}
                  value={auctionForm.max_players_per_team ?? DEFAULT_MAX_PLAYERS_PER_TEAM}
                  onChange={(e) =>
                    setAuctionForm((p) => ({
                      ...p,
                      max_players_per_team: Number(e.target.value),
                    }))
                  }
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Venue</Form.Label>
                <Form.Control
                  value={auctionForm.venue || ''}
                  onChange={(e) => setAuctionForm((p) => ({ ...p, venue: e.target.value }))}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Auction Date</Form.Label>
                <Form.Control
                  type="datetime-local"
                  value={
                    auctionForm.auction_date
                      ? new Date(auctionForm.auction_date).toISOString().slice(0, 16)
                      : ''
                  }
                  onChange={(e) =>
                    setAuctionForm((p) => ({
                      ...p,
                      auction_date: e.target.value ? new Date(e.target.value).toISOString() : null,
                    }))
                  }
                />
              </Form.Group>
            </Col>
            <Col xs={12}>
              <Form.Group>
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={auctionForm.description || ''}
                  onChange={(e) => setAuctionForm((p) => ({ ...p, description: e.target.value }))}
                />
              </Form.Group>
            </Col>
          </Row>

          <div className="d-flex gap-2 mb-4">
            <Button variant="primary" onClick={handleSaveAuction} disabled={saving}>
              Save Auction
            </Button>
            <Button variant="outline-primary" onClick={openAddLot} disabled={saving}>
              Add Lot
            </Button>
          </div>

          <Table responsive striped bordered hover>
            <thead>
              <tr>
                <th>Lot</th>
                <th>Player</th>
                <th>Category</th>
                <th>Base Pts</th>
                <th>Team</th>
                <th>Bid Pts</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(data?.lots ?? []).map((lot) => (
                <tr key={lot.lot_id}>
                  <td>{lot.lot_number}</td>
                  <td>{lot.player_name}</td>
                  <td>{lot.player_role || '—'}</td>
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
                  <td>
                    <Button
                      size="sm"
                      variant="outline-primary"
                      className="me-2"
                      onClick={() => openEditLot(lot)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={() => handleDeleteLot(lot.lot_id)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </>
      )}

      <Modal show={showLotModal} onHide={() => setShowLotModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editingLot ? 'Edit Lot' : 'Add Lot'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col md={4}>
              <Form.Group>
                <Form.Label>Lot #</Form.Label>
                <Form.Control
                  type="number"
                  value={lotForm.lot_number}
                  onChange={(e) => setLotForm((p) => ({ ...p, lot_number: Number(e.target.value) }))}
                />
              </Form.Group>
            </Col>
            <Col md={8}>
              <Form.Group>
                <Form.Label>Player Name</Form.Label>
                <Form.Control
                  value={lotForm.player_name}
                  onChange={(e) => setLotForm((p) => ({ ...p, player_name: e.target.value }))}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Category</Form.Label>
                <Form.Select
                  value={lotForm.player_role}
                  onChange={(e) => setLotForm((p) => ({ ...p, player_role: e.target.value }))}
                  required
                >
                  {AUCTION_PLAYER_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Vibhaag</Form.Label>
                <Form.Control
                  value={lotForm.vibhaag}
                  onChange={(e) => setLotForm((p) => ({ ...p, vibhaag: e.target.value }))}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Base Points</Form.Label>
                <Form.Control
                  type="number"
                  min={0}
                  value={lotForm.base_price}
                  onChange={(e) => setLotForm((p) => ({ ...p, base_price: Number(e.target.value) }))}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Status</Form.Label>
                <Form.Select
                  value={lotForm.status}
                  onChange={(e) => setLotForm((p) => ({ ...p, status: e.target.value }))}
                >
                  <option value="PENDING">PENDING</option>
                  <option value="SOLD">SOLD</option>
                  <option value="UNSOLD">UNSOLD</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Bid Points</Form.Label>
                <Form.Control
                  type="number"
                  min={0}
                  value={lotForm.sold_price}
                  onChange={(e) =>
                    setLotForm((p) => ({
                      ...p,
                      sold_price: e.target.value === '' ? '' : Number(e.target.value),
                    }))
                  }
                />
              </Form.Group>
            </Col>
            <Col md={12}>
              <Form.Group>
                <Form.Label>Team</Form.Label>
                <Form.Select
                  value={lotForm.team_id}
                  onChange={(e) =>
                    setLotForm((p) => ({
                      ...p,
                      team_id: e.target.value === '' ? '' : Number(e.target.value),
                    }))
                  }
                >
                  <option value="">— Select team —</option>
                  {teams.map((team) => (
                    <option key={team.team_id} value={team.team_id}>
                      {team.team_name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowLotModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSaveLot}
            disabled={saving || !lotForm.player_name || !lotForm.player_role}
          >
            Save Lot
          </Button>
        </Modal.Footer>
      </Modal>
    </AdminSection>
  )
}
