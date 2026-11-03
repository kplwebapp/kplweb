import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, Badge, Button, Card, Col, Form, Pagination, Row, Spinner, Table } from 'react-bootstrap'
import { useReloadable } from '@/admin/hooks/useReloadable'
import { auctionAdminApi, type AuctionLot } from '@/services/api/auctionApi'
import { LOT_STATUS_LABEL, LOT_STATUS_VARIANT, formatPoints, playerStyle } from '@/utils/auctionText'
import { getProfilePhotoUrl, handleProfilePhotoError } from '@/utils/profilePhoto'
import type { TabProps } from './shared'

const OPEN = ['DRAFT', 'READY', 'LIVE', 'PAUSED']
const CHANGEABLE = ['PENDING', 'UNSOLD']
const POOL_PAGE_SIZE = 10

export function PlayerPhoto({ path, name, size = 36 }: { path: string | null; name: string; size?: number }) {
  return (
    <img
      src={getProfilePhotoUrl(path)}
      onError={handleProfilePhotoError}
      alt={name}
      width={size}
      height={size}
      className="rounded-circle object-fit-cover flex-shrink-0"
    />
  )
}

export default function PlayersTab(props: TabProps) {
  const { detail } = props
  const editable = detail.can.manage && !detail.auction.is_legacy && OPEN.includes(detail.auction.status)
  return (
    <Row className="g-4">
      {editable && (
        <Col xl={4}>
          {detail.auction.event_id ? (
            <CandidatesCard {...props} />
          ) : (
            <Alert variant="warning">Link the auction to a cricket tournament in Settings; its registered players form the pool.</Alert>
          )}
        </Col>
      )}
      <Col xl={editable ? 8 : 12}>
        <PoolCard {...props} editable={editable} />
      </Col>
    </Row>
  )
}

function CandidatesCard({ detail, auctionId, run }: TabProps) {
  const load = useCallback(() => auctionAdminApi.candidates(auctionId).then((res) => res.data), [auctionId])
  // Refresh when anyone is added/removed from the active pool (WITHDRAWN lots stay in detail.lots).
  const poolKey = detail.lots.filter((l) => l.status !== 'WITHDRAWN').map((l) => l.lot_id).join(',')
  const { data, error, loading, reload } = useReloadable(load, `${auctionId}:${poolKey}`, true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [categoryId, setCategoryId] = useState('')
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState(false)

  if (loading && !data) return <Card className="border-0 shadow-sm"><Card.Body className="text-center"><Spinner animation="border" /></Card.Body></Card>
  if (!data) return <Alert variant="danger">{error}</Alert>

  const candidateKey = (c: (typeof data)[number]) =>
    c.user_id != null ? `user:${c.user_id}` : `lot:${c.withdrawn_lot_id}`

  const term = search.trim().toLowerCase()
  const visible = data.filter((c) => !term || c.full_name.toLowerCase().includes(term) || c.vibhaag?.toLowerCase().includes(term))
  const toggle = (key: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  const add = async () => {
    const chosen = data.filter((c) => selected.has(candidateKey(c)))
    const userIds = chosen.map((c) => c.user_id).filter((id): id is number => id != null)
    const lotIds = chosen.map((c) => c.withdrawn_lot_id).filter((id): id is number => id != null)
    setBusy(true)
    const ok = await run(
      () => auctionAdminApi.addPlayers(auctionId, { userIds, lotIds }, categoryId ? Number(categoryId) : null),
      `${selected.size} player(s) added to the pool.`,
    )
    setBusy(false)
    if (ok) {
      setSelected(new Set())
      reload()
    }
  }

  return (
    <Card className="border-0 shadow-sm">
      <Card.Header className="bg-white fw-semibold">Registered, not yet in the pool ({data.length})</Card.Header>
      <Card.Body>
        {data.length === 0 ? (
          <p className="text-muted mb-0">Every registered player is already in the pool.</p>
        ) : (
          <>
            <Form.Control size="sm" className="mb-2" placeholder="Search name or vibhaag" value={search}
              aria-label="Search registered players" onChange={(e) => setSearch(e.target.value)} />
            <div className="d-flex justify-content-between small mb-1">
              <Button variant="link" size="sm" className="p-0" onClick={() => setSelected(new Set(visible.map(candidateKey)))}>
                Select all shown
              </Button>
              {selected.size > 0 && (
                <Button variant="link" size="sm" className="p-0" onClick={() => setSelected(new Set())}>Clear</Button>
              )}
            </div>
            <div className="mb-3 border rounded" style={{ maxHeight: 360, overflowY: 'auto' }}>
              {visible.map((c) => {
                const key = candidateKey(c)
                return (
                <label key={key} htmlFor={`candidate-${key}`} className="d-flex align-items-center gap-2 px-2 py-1 border-bottom mb-0">
                  <Form.Check id={`candidate-${key}`} checked={selected.has(key)} onChange={() => toggle(key)} />
                  <PlayerPhoto path={c.profile_photo} name={c.full_name} size={28} />
                  <span className="min-w-0">
                    <span className="d-block text-truncate">{c.full_name}</span>
                    <small className="text-muted d-block text-truncate">{[c.vibhaag, playerStyle(c)].filter(Boolean).join(' · ')}</small>
                  </span>
                </label>
                )
              })}
              {visible.length === 0 && <p className="text-muted small p-2 mb-0">No matches.</p>}
            </div>
            <Form.Group className="mb-3" controlId="candidate-category">
              <Form.Label className="small">Category for the added players</Form.Label>
              <Form.Select size="sm" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">Decide later</option>
                {detail.categories.map((c) => (
                  <option key={c.auction_category_id} value={c.auction_category_id}>{c.name}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Button className="w-100" disabled={busy || selected.size === 0} onClick={add}>
              Add to pool{selected.size ? ` (${selected.size})` : ''}
            </Button>
          </>
        )}
      </Card.Body>
    </Card>
  )
}

function PoolCard({ detail, auctionId, run, ask, editable }: TabProps & { editable: boolean }) {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [busyLotId, setBusyLotId] = useState<number | null>(null)
  const { lots, categories, auction, current, can } = detail
  const canPutOnLive =
    can.operate &&
    !auction.is_legacy &&
    (auction.status === 'LIVE' || auction.status === 'PAUSED') &&
    !current

  const term = search.trim().toLowerCase()
  const visible = useMemo(
    () =>
      lots.filter((l) => {
        if (term && !l.player_name.toLowerCase().includes(term) && !l.vibhaag?.toLowerCase().includes(term)) return false
        if (filter === 'all') return l.status !== 'WITHDRAWN'
        if (filter === 'uncategorised') return !l.auction_category_id && l.status !== 'WITHDRAWN'
        return l.status === filter
      }),
    [lots, term, filter],
  )

  useEffect(() => {
    setPage(1)
  }, [filter, search])

  const total = visible.length
  const totalPages = Math.max(1, Math.ceil(total / POOL_PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const rangeStart = total === 0 ? 0 : (safePage - 1) * POOL_PAGE_SIZE + 1
  const rangeEnd = Math.min(safePage * POOL_PAGE_SIZE, total)
  const pageRows = visible.slice((safePage - 1) * POOL_PAGE_SIZE, safePage * POOL_PAGE_SIZE)

  const update = (lot: AuctionLot, body: Parameters<typeof auctionAdminApi.updateLot>[2], message: string) =>
    run(() => auctionAdminApi.updateLot(auctionId, lot.lot_id, body), message)

  const putOnLive = async (lot: AuctionLot) => {
    setBusyLotId(lot.lot_id)
    await run(
      () => auctionAdminApi.nextPlayer(auctionId, lot.lot_id),
      `${lot.player_name} is now on the live auction screen.`,
    )
    setBusyLotId(null)
  }

  /** Swaps the player with the neighbour shown above or below it. */
  const move = (lot: AuctionLot, delta: number) => {
    const neighbour = visible[visible.indexOf(lot) + delta]
    if (!neighbour) return
    const ids = lots.map((l) => l.lot_id)
    const from = ids.indexOf(lot.lot_id)
    const to = ids.indexOf(neighbour.lot_id)
    ;[ids[from], ids[to]] = [ids[to], ids[from]]
    run(() => auctionAdminApi.reorder(auctionId, ids), 'Order saved.')
  }

  const withdraw = (lot: AuctionLot) =>
    ask({
      title: `Remove ${lot.player_name} from the pool?`,
      body: 'They go back to Registered (not in the pool) and can be added again later. The change is kept in the history.',
      confirmLabel: 'Remove',
      variant: 'danger',
      onConfirm: () => run(() => auctionAdminApi.withdrawLot(auctionId, lot.lot_id), `${lot.player_name} moved back to registered.`),
    })

  const counts = {
    all: lots.filter((l) => l.status !== 'WITHDRAWN').length,
  }

  const pageItems = useMemo(() => {
    const items: number[] = []
    const window = 2
    const from = Math.max(1, safePage - window)
    const to = Math.min(totalPages, safePage + window)
    for (let p = from; p <= to; p += 1) items.push(p)
    return items
  }, [safePage, totalPages])

  return (
    <Card className="border-0 shadow-sm">
      <Card.Header className="bg-white d-flex flex-wrap gap-2 justify-content-between align-items-center">
        <span className="fw-semibold">Player pool ({counts.all})</span>
        <div className="d-flex gap-2">
          <Form.Control size="sm" placeholder="Search" value={search} aria-label="Search the pool"
            onChange={(e) => setSearch(e.target.value)} style={{ width: 160 }} />
          <Form.Select size="sm" value={filter} aria-label="Filter players" onChange={(e) => setFilter(e.target.value)} className="w-auto">
            <option value="all">All in pool</option>
            <option value="PENDING">Waiting</option>
            <option value="SOLD">Sold</option>
            <option value="UNSOLD">Unsold</option>
            <option value="uncategorised">No category</option>
          </Form.Select>
        </div>
      </Card.Header>
      <Card.Body className="p-0">
        {total === 0 ? (
          <p className="text-muted p-3 mb-0">{lots.length === 0 ? 'No players yet. Add registered players from the list.' : 'No players match.'}</p>
        ) : (
          <Table responsive hover className="mb-0 align-middle small">
            <thead className="table-light">
              <tr>
                <th>#</th>
                <th>Player</th>
                <th>Category</th>
                <th>Status</th>
                {(editable || canPutOnLive) && <th />}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((lot) => {
                const changeable = editable && CHANGEABLE.includes(lot.status)
                const showPutOnLive =
                  canPutOnLive && lot.is_eligible && (lot.status === 'PENDING' || lot.status === 'UNSOLD')
                return (
                  <tr key={lot.lot_id}>
                    <td className="text-muted">{lot.lot_number}</td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <PlayerPhoto path={lot.profile_photo} name={lot.player_name} size={32} />
                        <div className="min-w-0">
                          <div className="fw-semibold">{lot.player_name}</div>
                          <div className="text-muted">{[lot.vibhaag, playerStyle(lot)].filter(Boolean).join(' · ')}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {changeable && categories.length ? (
                        <Form.Select size="sm" value={lot.auction_category_id ?? ''} aria-label={`${lot.player_name} category`}
                          onChange={(e) => update(lot, { auction_category_id: e.target.value ? Number(e.target.value) : null }, 'Category saved.')}>
                          <option value="">—</option>
                          {categories.map((c) => (
                            <option key={c.auction_category_id} value={c.auction_category_id}>{c.name}</option>
                          ))}
                        </Form.Select>
                      ) : (
                        lot.category_name ?? lot.player_role ?? '—'
                      )}
                    </td>
                    <td>
                      <Badge bg={LOT_STATUS_VARIANT[lot.status]} text={lot.status === 'PENDING' ? 'dark' : undefined}>
                        {LOT_STATUS_LABEL[lot.status]}
                      </Badge>
                      {lot.status === 'SOLD' && (
                        <div className="text-muted">{lot.team_name} · {formatPoints(lot.sold_price ?? 0)}</div>
                      )}
                      {lot.status === 'ON_BLOCK' && (
                        <div className="text-primary">On live screen</div>
                      )}
                    </td>
                    {(editable || canPutOnLive) && (
                      <td className="text-end text-nowrap">
                        {showPutOnLive && (
                          <Button
                            size="sm"
                            variant="primary"
                            className="me-1"
                            disabled={busyLotId === lot.lot_id}
                            onClick={() => putOnLive(lot)}
                          >
                            Put on live
                          </Button>
                        )}
                        {editable && filter === 'all' && !term && (
                          <>
                            <Button size="sm" variant="link" className="px-1" aria-label={`Move ${lot.player_name} earlier`}
                              onClick={() => move(lot, -1)}>↑</Button>
                            <Button size="sm" variant="link" className="px-1" aria-label={`Move ${lot.player_name} later`}
                              onClick={() => move(lot, 1)}>↓</Button>
                          </>
                        )}
                        {editable && CHANGEABLE.includes(lot.status) && (
                          <Button size="sm" variant="link" className="px-1 text-danger" onClick={() => withdraw(lot)}>Remove</Button>
                        )}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </Table>
        )}
      </Card.Body>
      {total > 0 && (
        <Card.Footer className="bg-white d-flex flex-wrap gap-2 justify-content-between align-items-center">
          <span className="small text-muted">
            {rangeStart}–{rangeEnd} of {total}
          </span>
          <Pagination size="sm" className="mb-0">
            <Pagination.Prev
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            />
            {pageItems[0] > 1 && (
              <>
                <Pagination.Item onClick={() => setPage(1)}>{1}</Pagination.Item>
                {pageItems[0] > 2 && <Pagination.Ellipsis disabled />}
              </>
            )}
            {pageItems.map((p) => (
              <Pagination.Item key={p} active={p === safePage} onClick={() => setPage(p)}>
                {p}
              </Pagination.Item>
            ))}
            {pageItems[pageItems.length - 1] < totalPages && (
              <>
                {pageItems[pageItems.length - 1] < totalPages - 1 && <Pagination.Ellipsis disabled />}
                <Pagination.Item onClick={() => setPage(totalPages)}>{totalPages}</Pagination.Item>
              </>
            )}
            <Pagination.Next
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            />
          </Pagination>
        </Card.Footer>
      )}
    </Card>
  )
}
