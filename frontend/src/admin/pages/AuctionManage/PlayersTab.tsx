import { useCallback, useState } from 'react'
import { Alert, Badge, Button, Card, Col, Form, Row, Spinner, Table } from 'react-bootstrap'
import { useReloadable } from '@/admin/hooks/useReloadable'
import { auctionAdminApi, type AuctionLot } from '@/services/api/auctionApi'
import { LOT_STATUS_LABEL, LOT_STATUS_VARIANT, formatPoints, playerStyle } from '@/utils/auctionText'
import { getProfilePhotoUrl, handleProfilePhotoError } from '@/utils/profilePhoto'
import type { TabProps } from './shared'

const OPEN = ['DRAFT', 'READY', 'LIVE', 'PAUSED']
const CHANGEABLE = ['PENDING', 'UNSOLD']

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
  // Refresh the list whenever the pool changes.
  const { data, error, loading, reload } = useReloadable(load, `${auctionId}:${detail.lots.length}`, true)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [categoryId, setCategoryId] = useState('')
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState(false)

  if (loading && !data) return <Card className="border-0 shadow-sm"><Card.Body className="text-center"><Spinner animation="border" /></Card.Body></Card>
  if (!data) return <Alert variant="danger">{error}</Alert>

  const term = search.trim().toLowerCase()
  const visible = data.filter((c) => !term || c.full_name.toLowerCase().includes(term) || c.vibhaag?.toLowerCase().includes(term))
  const toggle = (userId: number) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })

  const add = async () => {
    setBusy(true)
    const ok = await run(
      () => auctionAdminApi.addPlayers(auctionId, [...selected], categoryId ? Number(categoryId) : null),
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
              <Button variant="link" size="sm" className="p-0" onClick={() => setSelected(new Set(visible.map((c) => c.user_id)))}>
                Select all shown
              </Button>
              {selected.size > 0 && (
                <Button variant="link" size="sm" className="p-0" onClick={() => setSelected(new Set())}>Clear</Button>
              )}
            </div>
            <div className="mb-3 border rounded" style={{ maxHeight: 360, overflowY: 'auto' }}>
              {visible.map((c) => (
                <label key={c.user_id} htmlFor={`candidate-${c.user_id}`} className="d-flex align-items-center gap-2 px-2 py-1 border-bottom mb-0">
                  <Form.Check id={`candidate-${c.user_id}`} checked={selected.has(c.user_id)} onChange={() => toggle(c.user_id)} />
                  <PlayerPhoto path={c.profile_photo} name={c.full_name} size={28} />
                  <span className="min-w-0">
                    <span className="d-block text-truncate">{c.full_name}</span>
                    <small className="text-muted d-block text-truncate">{[c.vibhaag, playerStyle(c)].filter(Boolean).join(' · ')}</small>
                  </span>
                </label>
              ))}
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

function BasePriceInput({ lot, disabled, onSave }: { lot: AuctionLot; disabled: boolean; onSave: (value: number) => void }) {
  const [value, setValue] = useState(String(lot.base_price))
  const commit = () => {
    const n = Number(value)
    if (value === '' || !Number.isInteger(n) || n < 0) setValue(String(lot.base_price))
    else if (n !== lot.base_price) onSave(n)
  }
  return (
    <Form.Control size="sm" type="number" min={0} step={1} value={value} disabled={disabled}
      aria-label={`${lot.player_name} base points`} style={{ width: 110 }}
      onChange={(e) => setValue(e.target.value)} onBlur={commit}
      onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }} />
  )
}

function PoolCard({ detail, auctionId, run, ask, editable }: TabProps & { editable: boolean }) {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const { lots, categories } = detail

  const term = search.trim().toLowerCase()
  const visible = lots.filter((l) => {
    if (term && !l.player_name.toLowerCase().includes(term) && !l.vibhaag?.toLowerCase().includes(term)) return false
    if (filter === 'all') return l.status !== 'WITHDRAWN'
    if (filter === 'ineligible') return !l.is_eligible
    if (filter === 'uncategorised') return !l.auction_category_id && l.status !== 'WITHDRAWN'
    return l.status === filter
  })

  const update = (lot: AuctionLot, body: Parameters<typeof auctionAdminApi.updateLot>[2], message: string) =>
    run(() => auctionAdminApi.updateLot(auctionId, lot.lot_id, body), message)

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

  const setEligible = (lot: AuctionLot, eligible: boolean) => {
    if (eligible) {
      update(lot, { is_eligible: true, eligibility_note: null }, `${lot.player_name} is eligible.`)
      return
    }
    ask({
      title: `Mark ${lot.player_name} ineligible?`,
      body: 'Ineligible players stay in the pool but are skipped in the auction and hidden from the public screen.',
      confirmLabel: 'Mark ineligible',
      variant: 'warning',
      reason: 'required',
      onConfirm: (reason) => update(lot, { is_eligible: false, eligibility_note: reason }, `${lot.player_name} marked ineligible.`),
    })
  }

  const withdraw = (lot: AuctionLot) =>
    ask({
      title: `Remove ${lot.player_name} from the pool?`,
      body: 'The player will not be auctioned. You can restore them later; the change is kept in the history.',
      confirmLabel: 'Remove',
      variant: 'danger',
      onConfirm: () => run(() => auctionAdminApi.withdrawLot(auctionId, lot.lot_id), `${lot.player_name} removed from the pool.`),
    })

  const counts = {
    all: lots.filter((l) => l.status !== 'WITHDRAWN').length,
    withdrawn: lots.filter((l) => l.status === 'WITHDRAWN').length,
  }

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
            <option value="ineligible">Ineligible</option>
            <option value="WITHDRAWN">Removed ({counts.withdrawn})</option>
          </Form.Select>
        </div>
      </Card.Header>
      <Card.Body className="p-0">
        {visible.length === 0 ? (
          <p className="text-muted p-3 mb-0">{lots.length === 0 ? 'No players yet. Add registered players from the list.' : 'No players match.'}</p>
        ) : (
          <Table responsive hover className="mb-0 align-middle small">
            <thead className="table-light">
              <tr>
                <th>#</th>
                <th>Player</th>
                <th>Category</th>
                <th>Base</th>
                <th className="text-center">Eligible</th>
                <th>Status</th>
                {editable && <th />}
              </tr>
            </thead>
            <tbody>
              {visible.map((lot) => {
                const changeable = editable && CHANGEABLE.includes(lot.status)
                return (
                  <tr key={lot.lot_id}>
                    <td className="text-muted">{lot.lot_number}</td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <PlayerPhoto path={lot.profile_photo} name={lot.player_name} size={32} />
                        <div className="min-w-0">
                          <div className="fw-semibold">{lot.player_name}</div>
                          <div className="text-muted">{[lot.vibhaag, playerStyle(lot)].filter(Boolean).join(' · ')}</div>
                          {!lot.is_eligible && lot.eligibility_note && <div className="text-warning">{lot.eligibility_note}</div>}
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
                      {changeable ? (
                        <BasePriceInput key={lot.base_price} lot={lot} disabled={false}
                          onSave={(value) => update(lot, { base_price: value }, 'Base points saved.')} />
                      ) : (
                        formatPoints(lot.base_price)
                      )}
                    </td>
                    <td className="text-center">
                      <Form.Check aria-label={`${lot.player_name} eligible`} checked={lot.is_eligible} disabled={!changeable}
                        onChange={(e) => setEligible(lot, e.target.checked)} className="d-inline-block" />
                    </td>
                    <td>
                      <Badge bg={LOT_STATUS_VARIANT[lot.status]} text={lot.status === 'PENDING' ? 'dark' : undefined}>
                        {LOT_STATUS_LABEL[lot.status]}
                      </Badge>
                      {lot.status === 'SOLD' && (
                        <div className="text-muted">{lot.team_name} · {formatPoints(lot.sold_price ?? 0)}</div>
                      )}
                    </td>
                    {editable && (
                      <td className="text-end text-nowrap">
                        {filter === 'all' && !term && (
                          <>
                            <Button size="sm" variant="link" className="px-1" aria-label={`Move ${lot.player_name} earlier`}
                              onClick={() => move(lot, -1)}>↑</Button>
                            <Button size="sm" variant="link" className="px-1" aria-label={`Move ${lot.player_name} later`}
                              onClick={() => move(lot, 1)}>↓</Button>
                          </>
                        )}
                        {CHANGEABLE.includes(lot.status) && (
                          <Button size="sm" variant="link" className="px-1 text-danger" onClick={() => withdraw(lot)}>Remove</Button>
                        )}
                        {lot.status === 'WITHDRAWN' && (
                          <Button size="sm" variant="link" className="px-1"
                            onClick={() => run(() => auctionAdminApi.restoreLot(auctionId, lot.lot_id), `${lot.player_name} restored.`)}>
                            Restore
                          </Button>
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
    </Card>
  )
}
