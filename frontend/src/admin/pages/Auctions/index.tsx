import { useCallback, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Alert, Badge, Button, Card, Col, Form, Modal, Row, Spinner, Table } from 'react-bootstrap'
import PageHeader, { AdminSection } from '@/admin/components/common/PageHeader'
import { auctionPath, liveAuctionPath } from '@/admin/config/sidebar'
import { useReloadable } from '@/admin/hooks/useReloadable'
import { CategoryEditor, SettingsFields } from '@/admin/pages/AuctionManage/AuctionSettingsForm'
import {
  DEFAULT_CATEGORIES,
  EMPTY_SETTINGS,
  categoriesToInput,
  settingsToInput,
  validateCategories,
  validateSettings,
  type CategoryDraft,
  type SettingKey,
  type SettingsDraft,
} from '@/admin/pages/AuctionManage/auctionSettings'
import { auctionAdminApi, type LiveAuctionSummary, type TournamentOption } from '@/services/api/auctionApi'
import { auctionStatusLabel, auctionStatusVariant, formatAuctionDate } from '@/utils/auctionText'

/** /admin/auctions — every auction, with a single live desk when one is running. */
export default function AuctionsPage() {
  const load = useCallback(() => auctionAdminApi.list().then((res) => res.data), [])
  const { data, error, loading, reload } = useReloadable(load, 'auctions')
  const [creating, setCreating] = useState(false)

  return (
    <AdminSection>
      <PageHeader
        title="Auctions"
        description="Only one auction can be live at a time. Set up drafts here, then run the live desk for bidding."
        actions={data?.can.manage && <Button onClick={() => setCreating(true)}>+ New auction</Button>}
      />

      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" /></div>
      ) : !data ? (
        <Alert variant="danger">{error}</Alert>
      ) : (
        <>
          <LiveDeskCard live={data.live} canOperate={data.can.operate} />

          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white fw-semibold">All auctions</Card.Header>
            <Card.Body className="p-0">
              {data.auctions.length === 0 ? (
                <p className="text-muted p-4 mb-0">No auctions yet.</p>
              ) : (
                <Table responsive hover className="mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Auction</th>
                      <th>Tournament</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th className="text-end">Teams</th>
                      <th className="text-end">Sold / pool</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {data.auctions.map((a) => {
                      const isLive = a.status === 'LIVE' || a.status === 'PAUSED'
                      return (
                        <tr key={a.auction_id} className={isLive ? 'table-success' : undefined}>
                          <td>
                            <Link to={auctionPath(a.auction_id)} className="fw-semibold">{a.title}</Link>
                            <div className="small text-muted">{a.season_name}</div>
                          </td>
                          <td>{a.event_title ?? <span className="text-muted">—</span>}</td>
                          <td className="text-nowrap">{formatAuctionDate(a.auction_date) || <span className="text-muted">—</span>}</td>
                          <td>
                            <Badge bg={auctionStatusVariant(a.status)}>{auctionStatusLabel(a.status)}</Badge>
                            {a.is_legacy && <Badge bg="light" text="dark" className="ms-1">History</Badge>}
                          </td>
                          <td className="text-end">{a.is_legacy ? '—' : a.teams}</td>
                          <td className="text-end">{a.sold} / {a.pool_size}</td>
                          <td className="text-end text-nowrap">
                            {isLive ? (
                              <Link to={liveAuctionPath} className="btn btn-sm btn-success">Open live desk</Link>
                            ) : (
                              <Link to={auctionPath(a.auction_id)} className="btn btn-sm btn-outline-primary">Open</Link>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </>
      )}

      {creating && (
        <CreateAuctionModal
          onHide={() => setCreating(false)}
          onCreated={() => reload()}
        />
      )}
    </AdminSection>
  )
}

function LiveDeskCard({ live, canOperate }: { live: LiveAuctionSummary | null; canOperate: boolean }) {
  if (!live) {
    return (
      <Alert variant="light" className="border mb-4">
        <div className="fw-semibold mb-1">No live auction</div>
        <div className="small text-muted mb-0">
          Mark an auction ready, then start it. Only one auction can run live at a time.
          {canOperate ? ' Operators can open the live desk from the sidebar once started.' : null}
        </div>
      </Alert>
    )
  }

  const meta = [live.event_title, live.season_name, formatAuctionDate(live.auction_date ?? null), live.venue]
    .filter(Boolean)
    .join(' · ')

  return (
    <Card className="border-0 shadow-sm mb-4 border-success">
      <Card.Body>
        <Row className="g-3 align-items-center">
          <Col md>
            <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
              <Badge bg={live.status === 'LIVE' ? 'success' : 'warning'}>
                {live.status === 'LIVE' ? 'Live now' : 'Paused'}
              </Badge>
              <span className="text-muted small">Single live auction desk</span>
            </div>
            <h2 className="h4 mb-1">{live.title}</h2>
            {meta ? <div className="small text-muted mb-2">{meta}</div> : null}
            <div className="d-flex flex-wrap gap-3 small">
              <span><strong>{live.sold ?? 0}</strong> sold</span>
              <span><strong>{live.waiting ?? 0}</strong> waiting</span>
              <span><strong>{live.on_block ?? 0}</strong> on block</span>
              <span><strong>{live.teams ?? 0}</strong> teams</span>
            </div>
          </Col>
          <Col md="auto" className="d-flex flex-wrap gap-2">
            <Link to={auctionPath(live.auction_id)} className="btn btn-success">
              Open live desk
            </Link>
            <a href={`/auction?id=${live.auction_id}`} target="_blank" rel="noreferrer" className="btn btn-outline-primary">
              Public screen ↗
            </a>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  )
}

function CreateAuctionModal({ onHide, onCreated }: { onHide: () => void; onCreated?: () => void }) {
  const navigate = useNavigate()
  const loadTournaments = useCallback(
    () => auctionAdminApi.tournaments().then((res): TournamentOption[] => res.data),
    [],
  )
  const { data: tournaments, error: optionsError } = useReloadable(loadTournaments, 'auction-tournaments')
  const [draft, setDraft] = useState<SettingsDraft>(EMPTY_SETTINGS)
  const [categories, setCategories] = useState<CategoryDraft[]>(DEFAULT_CATEGORIES)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const change = (key: SettingKey, value: string) => {
    setDraft((prev) => {
      const next = { ...prev, [key]: value }
      if (key === 'event_id' && !prev.title.trim()) {
        const t = tournaments?.find((x) => String(x.event_id) === value)
        if (t) next.title = `${t.title} – Player Auction`
      }
      return next
    })
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const problem = validateSettings(draft) || validateCategories(categories)
    if (problem) {
      setError(problem)
      return
    }
    setBusy(true)
    setError('')
    try {
      const res = await auctionAdminApi.create({ ...settingsToInput(draft), categories: categoriesToInput(categories) })
      onCreated?.()
      navigate(auctionPath(res.data.auction_id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the auction.')
      setBusy(false)
    }
  }

  return (
    <Modal show onHide={onHide} size="xl" backdrop="static">
      <Form onSubmit={submit} noValidate>
        <Modal.Header closeButton>
          <Modal.Title as="h5">New auction</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {optionsError && <Alert variant="danger">{optionsError}</Alert>}
          {error && <Alert variant="danger">{error}</Alert>}
          {!tournaments ? (
            <div className="text-center py-4"><Spinner animation="border" /></div>
          ) : (
            <>
              <SettingsFields draft={draft} onChange={change} tournaments={tournaments} />
              <h6 className="mt-4">Player categories</h6>
              <p className="small text-muted">
                Each player is auctioned in one category. Leave base points empty to use the default; set limits per
                team if needed.
              </p>
              <CategoryEditor categories={categories} onChange={setCategories} />
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onHide} disabled={busy}>Cancel</Button>
          <Button type="submit" disabled={busy || !tournaments}>{busy ? 'Creating…' : 'Create auction'}</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}
