import { useCallback, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Alert, Badge, Button, Card, Form, Modal, Spinner, Table } from 'react-bootstrap'
import PageHeader, { AdminSection } from '@/admin/components/common/PageHeader'
import { auctionPath } from '@/admin/config/sidebar'
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
import { auctionAdminApi, type SeasonOption, type TournamentOption } from '@/services/api/auctionApi'
import { auctionStatusLabel, auctionStatusVariant, formatAuctionDate } from '@/utils/auctionText'

/** /admin/auctions — every auction, newest and live first. */
export default function AuctionsPage() {
  const load = useCallback(() => auctionAdminApi.list().then((res) => res.data), [])
  const { data, error, loading } = useReloadable(load, 'auctions')
  const [creating, setCreating] = useState(false)

  return (
    <AdminSection>
      <PageHeader
        title="Auctions"
        description="Player auctions for cricket tournaments: setup, live bidding and results."
        actions={data?.can.manage && <Button onClick={() => setCreating(true)}>+ New auction</Button>}
      />

      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" /></div>
      ) : !data ? (
        <Alert variant="danger">{error}</Alert>
      ) : (
        <Card className="border-0 shadow-sm">
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
                  </tr>
                </thead>
                <tbody>
                  {data.auctions.map((a) => (
                    <tr key={a.auction_id}>
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
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>
      )}

      {creating && <CreateAuctionModal onHide={() => setCreating(false)} />}
    </AdminSection>
  )
}

type Options = { seasons: SeasonOption[]; tournaments: TournamentOption[] }

function CreateAuctionModal({ onHide }: { onHide: () => void }) {
  const navigate = useNavigate()
  const loadOptions = useCallback(
    () =>
      Promise.all([auctionAdminApi.seasons(), auctionAdminApi.tournaments()]).then(
        ([seasons, tournaments]): Options => ({ seasons: seasons.data, tournaments: tournaments.data }),
      ),
    [],
  )
  const { data: options, error: optionsError } = useReloadable(loadOptions, 'auction-options')
  const [draft, setDraft] = useState<SettingsDraft>(EMPTY_SETTINGS)
  const [categories, setCategories] = useState<CategoryDraft[]>(DEFAULT_CATEGORIES)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const change = (key: SettingKey, value: string) => {
    setDraft((prev) => {
      const next = { ...prev, [key]: value }
      // Suggest a title from the tournament until the admin types one.
      if (key === 'event_id' && !prev.title.trim()) {
        const t = options?.tournaments.find((x) => String(x.event_id) === value)
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
          {!options ? (
            <div className="text-center py-4"><Spinner animation="border" /></div>
          ) : (
            <>
              <SettingsFields draft={draft} onChange={change} seasons={options.seasons} tournaments={options.tournaments} />
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
          <Button type="submit" disabled={busy || !options}>{busy ? 'Creating…' : 'Create auction'}</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}
