import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { Alert, Button, Col, Form, Modal, Row } from 'react-bootstrap'
import { KIND_LABELS } from '@/admin/config/sidebar'
import {
  adminActivitiesApi,
  type Activity,
  type ActivityInput,
  type ActivityKind,
  type Category,
} from '@/services/api/activitiesApi'
import {
  ACTIVITY_IMAGE_ACCEPT,
  activityImageFallback,
  getActivityImageUrl,
  validateActivityImage,
} from '@/utils/activityImage'
import { adminTeamsApi, tournamentAdminApi, type Team } from '@/services/api/tournamentApi'
import ParticipatingTeamsPicker from './ParticipatingTeamsPicker'

type Props = {
  kind: ActivityKind
  category: Category
  editing: Activity | null
  onClose: () => void
  onSaved: () => void
}

const toForm = (category: Category, item: Activity | null): ActivityInput => ({
  category_id: item?.category_id ?? category.category_id,
  title: item?.title ?? '',
  description: item?.description ?? '',
  event_date: item?.event_date ?? '',
  // single-day records store no end date; show it as the same day in the range
  end_date: item?.end_date ?? item?.event_date ?? '',
  venue: item?.venue ?? '',
})

/** Mount with a `key` per record so the form resets when switching between records. */
export default function ActivityFormModal({ kind, category, editing, onClose, onSaved }: Props) {
  const label = KIND_LABELS[kind].singular
  const [form, setForm] = useState<ActivityInput>(() => toForm(category, editing))
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [removeImage, setRemoveImage] = useState(false)
  const [fileInputKey, setFileInputKey] = useState(0)
  // set once a new record is created, so retrying after a failed image upload doesn't create a duplicate
  const [savedId, setSavedId] = useState<number | null>(editing?.event_id ?? null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const isTournament = kind === 'TOURNAMENT'
  // teams of this tournament's game, and the ids already saved on the tournament
  const [teamData, setTeamData] = useState<{ all: Team[]; joined: number[]; error: string } | null>(null)
  const [selectedTeams, setSelectedTeams] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (!isTournament) return
    let cancelled = false
    Promise.all([
      adminTeamsApi.list(category.category_id),
      editing ? tournamentAdminApi.listTeams(editing.event_id) : Promise.resolve(null),
    ])
      .then(([all, joined]) => {
        if (cancelled) return
        const joinedIds = joined?.data.map((t) => t.team_id) ?? []
        setTeamData({ all: all.data, joined: joinedIds, error: '' })
        setSelectedTeams(new Set(joinedIds))
      })
      .catch((err) => {
        if (!cancelled) setTeamData({ all: [], joined: [], error: err instanceof Error ? err.message : 'Could not load teams.' })
      })
    return () => { cancelled = true }
  }, [isTournament, category.category_id, editing])

  const pickableTeams =
    teamData && teamData.all.filter((t) => t.is_active || teamData.joined.includes(t.team_id))

  const syncTeams = async (id: number) => {
    if (!isTournament || !teamData || teamData.error) return
    const joined = new Set(teamData.joined)
    const toAdd = [...selectedTeams].filter((teamId) => !joined.has(teamId))
    const toRemove = teamData.joined.filter((teamId) => !selectedTeams.has(teamId))
    if (toAdd.length) await tournamentAdminApi.addTeams(id, toAdd)
    for (const teamId of toRemove) await tournamentAdminApi.removeTeam(id, teamId)
    setTeamData((d) => d && { ...d, joined: [...selectedTeams] })
  }

  const filePreview = useMemo(() => (imageFile ? URL.createObjectURL(imageFile) : null), [imageFile])
  useEffect(() => () => { if (filePreview) URL.revokeObjectURL(filePreview) }, [filePreview])

  const currentImage = removeImage ? null : editing?.image_url
  const previewSrc = filePreview ?? getActivityImageUrl(currentImage, kind)
  const showingDefault = !filePreview && !currentImage

  const close = () => (savedId && !editing ? onSaved() : onClose())

  const changeStart = (value: string) =>
    setForm((f) => ({ ...f, event_date: value, end_date: !f.end_date || f.end_date < value ? value : f.end_date }))

  const clearFileInput = () => setFileInputKey((k) => k + 1)

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const problem = validateActivityImage(file)
    if (problem) {
      setError(problem)
      setImageFile(null)
      clearFileInput()
      return
    }
    setError('')
    setImageFile(file)
    setRemoveImage(false)
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    clearFileInput()
    setRemoveImage(true)
  }

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    let id = savedId
    try {
      if (id) {
        await adminActivitiesApi.update(id, form)
      } else {
        const created = await adminActivitiesApi.create(kind, form)
        id = created.data.event_id
        setSavedId(id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.')
      setSaving(false)
      return
    }

    try {
      if (imageFile) {
        await adminActivitiesApi.uploadImage(id, imageFile)
      } else if (removeImage && editing?.image_url) {
        await adminActivitiesApi.removeImage(id)
      }
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'Upload failed.'
      setError(`The ${label.toLowerCase()} was saved, but the image could not be uploaded: ${reason}`)
      setSaving(false)
      return
    }

    try {
      await syncTeams(id)
      onSaved()
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'Update failed.'
      setError(`The ${label.toLowerCase()} was saved, but its teams could not be updated: ${reason}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal show onHide={close} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          {editing ? `Edit ${label}` : `Add ${label}`} <small className="text-muted fs-6">· {category.name}</small>
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSave}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form.Group className="mb-3">
            <Form.Label>{label} Title</Form.Label>
            <Form.Control
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              maxLength={200}
              required
            />
          </Form.Group>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Start date</Form.Label>
                <Form.Control
                  type="date"
                  value={form.event_date}
                  onChange={(e) => changeStart(e.target.value)}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>End date</Form.Label>
                <Form.Control
                  type="date"
                  value={form.end_date}
                  min={form.event_date || undefined}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  required
                />
              </Form.Group>
            </Col>
            <Col xs={12}>
              <Form.Text muted className="d-block mt-n2 mb-3">
                For a single-day {label.toLowerCase()}, pick the same date for both.
              </Form.Text>
            </Col>
          </Row>
          <Form.Group className="mb-3">
            <Form.Label>Venue</Form.Label>
            <Form.Control
              value={form.venue}
              onChange={(e) => setForm({ ...form, venue: e.target.value })}
              maxLength={200}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Form.Group>
          {isTournament && (
            <ParticipatingTeamsPicker
              gameName={category.name}
              gameSlug={category.slug}
              teams={pickableTeams}
              error={teamData?.error ?? ''}
              selected={selectedTeams}
              onChange={setSelectedTeams}
            />
          )}
          <Form.Group>
            <Form.Label>Image</Form.Label>
            <Row className="g-3 align-items-start">
              <Col sm={5}>
                <img
                  src={previewSrc}
                  alt={showingDefault ? 'Default image' : 'Selected image'}
                  onError={activityImageFallback(kind)}
                  className="img-fluid rounded border w-100"
                  style={{ aspectRatio: '3 / 2', objectFit: 'cover' }}
                />
              </Col>
              <Col sm={7}>
                <Form.Control
                  key={fileInputKey}
                  type="file"
                  accept={ACTIVITY_IMAGE_ACCEPT}
                  onChange={handleFileChange}
                />
                <Form.Text muted className="d-block mt-1">
                  JPG, PNG or GIF, up to 2 MB.
                  {showingDefault && ' No image yet, so the default image shown here will be used.'}
                </Form.Text>
                {(imageFile || currentImage) && (
                  <Button variant="link" size="sm" className="px-0 text-danger" onClick={handleRemoveImage}>
                    Remove image (use default)
                  </Button>
                )}
              </Col>
            </Row>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={close}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}
