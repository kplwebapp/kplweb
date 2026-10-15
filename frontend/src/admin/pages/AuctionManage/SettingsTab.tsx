import { useCallback, useState } from 'react'
import { Alert, Button, Card, Form, Spinner } from 'react-bootstrap'
import { useReloadable } from '@/admin/hooks/useReloadable'
import { auctionAdminApi, type AuctionSettingsInput } from '@/services/api/auctionApi'
import { CategoryEditor, SettingsFields } from './AuctionSettingsForm'
import {
  LIVE_EDITABLE,
  categoriesFromApi,
  categoriesToInput,
  settingsFromAuction,
  settingsToInput,
  validateCategories,
  validateSettings,
  type CategoryDraft,
  type SettingKey,
} from './auctionSettings'
import type { TabProps } from './shared'

const OPEN = ['DRAFT', 'READY', 'LIVE', 'PAUSED']
const SETUP = ['DRAFT', 'READY']

export default function SettingsTab({ detail, auctionId, run }: TabProps) {
  const { auction, can } = detail
  const loadOptions = useCallback(
    () =>
      Promise.all([auctionAdminApi.seasons(), auctionAdminApi.tournaments()]).then(([seasons, tournaments]) => ({
        seasons: seasons.data,
        tournaments: tournaments.data,
      })),
    [],
  )
  const { data: options, error: optionsError } = useReloadable(loadOptions, 'auction-options')
  const [saved, setSaved] = useState(() => settingsFromAuction(auction))
  const [draft, setDraft] = useState(saved)
  const [categories, setCategories] = useState<CategoryDraft[]>(() => categoriesFromApi(detail.categories))
  const [error, setError] = useState('')
  const [categoryError, setCategoryError] = useState('')
  const [busy, setBusy] = useState(false)

  const editable = can.manage && !auction.is_legacy && OPEN.includes(auction.status)
  const inSetup = SETUP.includes(auction.status)
  const isLocked = (key: SettingKey) => !editable || (!inSetup && !LIVE_EDITABLE.includes(key))
  const changedKeys = (Object.keys(draft) as SettingKey[]).filter((k) => draft[k] !== saved[k])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    const problem = validateSettings(draft)
    if (problem) {
      setError(problem)
      return
    }
    setError('')
    const input = settingsToInput(draft)
    const changes = Object.fromEntries(changedKeys.map((k) => [k, input[k]])) as Partial<AuctionSettingsInput>
    setBusy(true)
    const ok = await run(() => auctionAdminApi.update(auctionId, changes), 'Settings saved.')
    setBusy(false)
    if (ok) setSaved(draft)
  }

  const saveCategories = async () => {
    const problem = validateCategories(categories)
    if (problem) {
      setCategoryError(problem)
      return
    }
    setCategoryError('')
    setBusy(true)
    await run(async () => {
      const res = await auctionAdminApi.setCategories(auctionId, categoriesToInput(categories))
      setCategories(categoriesFromApi(res.data))
    }, 'Categories saved.')
    setBusy(false)
  }

  return (
    <>
      <Card className="border-0 shadow-sm mb-4">
        <Card.Header className="bg-white fw-semibold">Auction settings</Card.Header>
        <Card.Body>
          {optionsError && <Alert variant="danger">{optionsError}</Alert>}
          {!inSetup && editable && (
            <Alert variant="info" className="py-2 small">
              The auction has started: only the title, date, venue, description, rules and bid increment can change.
            </Alert>
          )}
          {!options ? (
            <div className="text-center py-4"><Spinner animation="border" /></div>
          ) : (
            <Form onSubmit={save} noValidate>
              {error && <Alert variant="danger">{error}</Alert>}
              <SettingsFields
                draft={draft}
                onChange={(key, value) => setDraft((prev) => ({ ...prev, [key]: value }))}
                seasons={options.seasons}
                tournaments={options.tournaments}
                currentAuctionId={auctionId}
                isLocked={isLocked}
              />
              {editable && (
                <div className="d-flex justify-content-end gap-2 mt-3">
                  <Button variant="outline-secondary" disabled={busy || changedKeys.length === 0} onClick={() => setDraft(saved)}>
                    Undo changes
                  </Button>
                  <Button type="submit" disabled={busy || changedKeys.length === 0}>Save settings</Button>
                </div>
              )}
            </Form>
          )}
        </Card.Body>
      </Card>

      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white fw-semibold">Player categories</Card.Header>
        <Card.Body>
          {categoryError && <Alert variant="danger">{categoryError}</Alert>}
          <p className="small text-muted">
            Categories can change until the auction starts. A category used by players in the pool can be renamed but
            not removed.
          </p>
          <CategoryEditor categories={categories} onChange={setCategories} disabled={!can.manage || !inSetup || auction.is_legacy} />
          {can.manage && inSetup && !auction.is_legacy && (
            <div className="d-flex justify-content-end mt-3">
              <Button disabled={busy} onClick={saveCategories}>Save categories</Button>
            </div>
          )}
        </Card.Body>
      </Card>
    </>
  )
}
