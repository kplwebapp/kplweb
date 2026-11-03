import { Button, Col, Form, Row, Table } from 'react-bootstrap'
import type { TournamentOption } from '@/services/api/auctionApi'
import { isIconCategoryName, newCategory, type CategoryDraft, type SettingKey, type SettingsDraft } from './auctionSettings'

type FieldsProps = {
  draft: SettingsDraft
  onChange: (key: SettingKey, value: string) => void
  tournaments: TournamentOption[]
  currentAuctionId?: number
  isLocked?: (key: SettingKey) => boolean
}

export function SettingsFields({ draft, onChange, tournaments, currentAuctionId, isLocked = () => false }: FieldsProps) {
  const field = (key: SettingKey) => ({
    value: draft[key],
    disabled: isLocked(key),
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => onChange(key, e.target.value),
  })
  const available = tournaments.filter((t) => !t.auction_id || t.auction_id === currentAuctionId)

  return (
    <Row className="g-3">
      <Col md={6}>
        <Form.Group controlId="auction-title">
          <Form.Label>Auction title</Form.Label>
          <Form.Control maxLength={200} required {...field('title')} />
        </Form.Group>
      </Col>
      <Col md={6}>
        <Form.Group controlId="auction-tournament">
          <Form.Label>Cricket tournament</Form.Label>
          <Form.Select {...field('event_id')} disabled={isLocked('event_id')}>
            <option value="">Not linked yet</option>
            {available.map((t) => (
              <option key={t.event_id} value={t.event_id}>
                {t.title}{t.is_archived ? ' (archived)' : ''}
              </option>
            ))}
          </Form.Select>
          <Form.Text>
            Only cricket tournaments marked “Requires auction” appear here. Registered players form the pool; tournament
            teams join automatically.
          </Form.Text>
        </Form.Group>
      </Col>

      <Col md={3}>
        <Form.Group controlId="auction-date">
          <Form.Label>Date and time</Form.Label>
          <Form.Control type="datetime-local" {...field('auction_date')} />
        </Form.Group>
      </Col>
      <Col md={3}>
        <Form.Group controlId="auction-venue">
          <Form.Label>Venue</Form.Label>
          <Form.Control maxLength={200} {...field('venue')} />
        </Form.Group>
      </Col>
      <Col md={3}>
        <Form.Group controlId="auction-budget">
          <Form.Label>Points per team</Form.Label>
          <Form.Control type="number" min={0} step={1} {...field('budget_per_team')} />
        </Form.Group>
      </Col>
      <Col md={3}>
        <Form.Group controlId="auction-increment">
          <Form.Label>Bid increment</Form.Label>
          <Form.Control type="number" min={1} step={1} {...field('min_bid_increment')} />
        </Form.Group>
      </Col>

      <Col md={3}>
        <Form.Group controlId="auction-min-squad">
          <Form.Label>Min squad</Form.Label>
          <Form.Control type="number" min={0} step={1} {...field('min_players_per_team')} />
        </Form.Group>
      </Col>
      <Col md={3}>
        <Form.Group controlId="auction-max-squad">
          <Form.Label>Max squad</Form.Label>
          <Form.Control type="number" min={1} step={1} {...field('max_players_per_team')} />
        </Form.Group>
      </Col>
      <Col md={3}>
        <Form.Group controlId="auction-base">
          <Form.Label>Base points</Form.Label>
          <Form.Control type="number" min={0} step={1} {...field('default_base_price')} />
        </Form.Group>
      </Col>

      <Col md={6}>
        <Form.Group controlId="auction-description">
          <Form.Label>Description</Form.Label>
          <Form.Control as="textarea" rows={3} maxLength={5000} {...field('description')} />
        </Form.Group>
      </Col>
      <Col md={6}>
        <Form.Group controlId="auction-rules">
          <Form.Label>Rules shown to viewers</Form.Label>
          <Form.Control as="textarea" rows={3} maxLength={5000} {...field('rules')} />
        </Form.Group>
      </Col>
    </Row>
  )
}

type EditorProps = {
  categories: CategoryDraft[]
  onChange: (next: CategoryDraft[]) => void
  disabled?: boolean
  /** Participating teams — Icon Player pool size must match this (cricket). */
  teamCount?: number
}

export function CategoryEditor({ categories, onChange, disabled, teamCount }: EditorProps) {
  const set = (key: string, field: keyof CategoryDraft, value: string) =>
    onChange(
      categories.map((c) => {
        if (c.key !== key) return c
        const next = { ...c, [field]: value }
        if (field === 'name' && isIconCategoryName(value)) {
          next.min_per_team = '1'
          next.max_per_team = '1'
        }
        return next
      }),
    )
  const move = (index: number, delta: number) => {
    const next = [...categories]
    const [item] = next.splice(index, 1)
    next.splice(index + delta, 0, item)
    onChange(next)
  }

  return (
    <>
      {categories.some((c) => isIconCategoryName(c.name)) && (
        <p className="small text-muted mb-2">
          Icon Player is cricket-only: one per team
          {typeof teamCount === 'number' && teamCount > 0
            ? ` — keep ${teamCount} Icon Player(s) in the pool for ${teamCount} team(s).`
            : ' — pool size must equal the number of participating teams.'}
        </p>
      )}
      <Table size="sm" responsive className="align-middle mb-2">
        <thead>
          <tr>
            <th>Category</th>
            <th style={{ width: 130 }}>Base points</th>
            <th style={{ width: 100 }}>Min / team</th>
            <th style={{ width: 100 }}>Max / team</th>
            <th style={{ width: 120 }} />
          </tr>
        </thead>
        <tbody>
          {categories.length === 0 && (
            <tr>
              <td colSpan={5} className="text-muted">No categories: players are auctioned without category rules.</td>
            </tr>
          )}
          {categories.map((c, i) => {
            const isIcon = isIconCategoryName(c.name)
            return (
            <tr key={c.key}>
              <td>
                <Form.Control size="sm" maxLength={50} value={c.name} disabled={disabled}
                  aria-label="Category name" onChange={(e) => set(c.key, 'name', e.target.value)} />
              </td>
              <td>
                <Form.Control size="sm" type="number" min={0} placeholder="Default" value={c.base_price} disabled={disabled}
                  aria-label={`${c.name} base points`} onChange={(e) => set(c.key, 'base_price', e.target.value)} />
              </td>
              <td>
                <Form.Control size="sm" type="number" min={0} value={isIcon ? '1' : c.min_per_team} disabled={disabled || isIcon}
                  aria-label={`${c.name} minimum per team`} onChange={(e) => set(c.key, 'min_per_team', e.target.value)} />
              </td>
              <td>
                <Form.Control size="sm" type="number" min={0} placeholder="Any" value={isIcon ? '1' : c.max_per_team} disabled={disabled || isIcon}
                  aria-label={`${c.name} maximum per team`} onChange={(e) => set(c.key, 'max_per_team', e.target.value)} />
              </td>
              <td className="text-end text-nowrap">
                <Button size="sm" variant="link" className="px-1" disabled={disabled || i === 0}
                  aria-label={`Move ${c.name} up`} onClick={() => move(i, -1)}>↑</Button>
                <Button size="sm" variant="link" className="px-1" disabled={disabled || i === categories.length - 1}
                  aria-label={`Move ${c.name} down`} onClick={() => move(i, 1)}>↓</Button>
                <Button size="sm" variant="link" className="px-1 text-danger" disabled={disabled}
                  aria-label={`Remove ${c.name}`} onClick={() => onChange(categories.filter((x) => x.key !== c.key))}>✕</Button>
              </td>
            </tr>
            )
          })}
        </tbody>
      </Table>
      {!disabled && (
        <Button size="sm" variant="outline-primary"
          onClick={() => onChange([...categories, newCategory()])}>
          + Add category
        </Button>
      )}
    </>
  )
}
