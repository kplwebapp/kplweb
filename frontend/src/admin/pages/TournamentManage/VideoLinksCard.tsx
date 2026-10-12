import { useState, type FormEvent } from 'react'
import { Alert, Button, Card, CloseButton, Form } from 'react-bootstrap'
import { tournamentAdminApi } from '@/services/api/tournamentApi'
import { parseYoutubeId } from '@/utils/youtube'

const INITIAL_ROWS = 3
const MAX_ROWS = 10

type Row = { id: number; url: string; caption: string }

let nextRowId = 0
const newRow = (): Row => ({ id: nextRowId++, url: '', caption: '' })
const freshRows = () => Array.from({ length: INITIAL_ROWS }, newRow)

type Props = {
  tournamentId: number
  disabled: boolean
  onBusyChange: (busy: boolean) => void
  onAdded: (message: string) => void
}

export default function VideoLinksCard({ tournamentId, disabled, onBusyChange, onAdded }: Props) {
  const [rows, setRows] = useState<Row[]>(freshRows)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const filled = rows.filter((row) => row.url.trim())
  const isInvalid = (row: Row) => row.url.trim() !== '' && !parseYoutubeId(row.url)
  const hasInvalid = rows.some(isInvalid)
  const blocked = disabled || saving

  const update = (id: number, patch: Partial<Row>) =>
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)))

  const removeRow = (id: number) =>
    setRows((prev) => (prev.length > 1 ? prev.filter((row) => row.id !== id) : [newRow()]))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (hasInvalid) return setError('Fix the highlighted links. Only YouTube video links can be added.')
    setSaving(true)
    onBusyChange(true)
    setError('')
    try {
      const res = await tournamentAdminApi.addVideos(
        tournamentId,
        filled.map((row) => ({ url: row.url.trim(), caption: row.caption.trim() })),
      )
      setRows(freshRows())
      onAdded(`${res.data.length} video${res.data.length === 1 ? '' : 's'} added.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add the videos.')
    } finally {
      setSaving(false)
      onBusyChange(false)
    }
  }

  return (
    <Card className="border-0 shadow-sm h-100">
      <Card.Header className="bg-white fw-semibold">Add YouTube videos</Card.Header>
      <Card.Body>
        <Form onSubmit={submit} noValidate>
          {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
          <p className="small text-muted mb-2">
            Paste one link per row. Empty rows are ignored. Watch, share (youtu.be) and Shorts links all work.
          </p>
          {rows.map((row, index) => (
            <div key={row.id} className="video-link-row mb-2">
              <span className="video-link-row__number">{index + 1}</span>
              <div className="flex-grow-1">
                <Form.Control
                  size="sm"
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=…"
                  aria-label={`YouTube link ${index + 1}`}
                  value={row.url}
                  isInvalid={isInvalid(row)}
                  disabled={blocked}
                  onChange={(e) => update(row.id, { url: e.target.value })}
                />
                <Form.Control.Feedback type="invalid">Not a YouTube video link.</Form.Control.Feedback>
                {row.url.trim() && (
                  <Form.Control
                    size="sm"
                    className="mt-1"
                    placeholder="Caption (optional)"
                    aria-label={`Caption for link ${index + 1}`}
                    value={row.caption}
                    maxLength={300}
                    disabled={blocked}
                    onChange={(e) => update(row.id, { caption: e.target.value })}
                  />
                )}
              </div>
              <CloseButton aria-label={`Remove row ${index + 1}`} disabled={blocked} onClick={() => removeRow(row.id)} />
            </div>
          ))}
          <div className="d-flex justify-content-between align-items-center gap-2 mt-3">
            <Button
              variant="outline-secondary"
              size="sm"
              disabled={blocked || rows.length >= MAX_ROWS}
              onClick={() => setRows((prev) => [...prev, newRow()])}
            >
              + Add another link
            </Button>
            <Button type="submit" size="sm" disabled={blocked || filled.length === 0 || hasInvalid}>
              {saving
                ? 'Adding…'
                : `Add ${filled.length > 0 ? `${filled.length} ` : ''}video${filled.length === 1 ? '' : 's'}`}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  )
}
