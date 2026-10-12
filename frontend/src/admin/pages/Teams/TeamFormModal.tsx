import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Alert, Button, Form, Modal } from 'react-bootstrap'
import TeamBadge from '@/components/tournament/TeamBadge'
import { adminTeamsApi, type Team } from '@/services/api/tournamentApi'
import type { Category } from '@/services/api/activitiesApi'
import { ACTIVITY_IMAGE_ACCEPT, validateActivityImage } from '@/utils/activityImage'

type Props = {
  editing: Team | null
  games: Category[]
  defaultGameId: number
  onClose: () => void
  onSaved: (team: Team | null) => void
}

export default function TeamFormModal({ editing, games, defaultGameId, onClose, onSaved }: Props) {
  const [gameId, setGameId] = useState(String(editing?.category_id ?? defaultGameId))
  const [savedTeam, setSavedTeam] = useState<Team | null>(null)
  const [name, setName] = useState(editing?.team_name ?? '')
  const [code, setCode] = useState(editing?.team_code ?? '')
  const [shortName, setShortName] = useState(editing?.short_name ?? '')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [removeLogo, setRemoveLogo] = useState(false)
  const [savedId, setSavedId] = useState<number | null>(editing?.team_id ?? null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const previewUrl = useMemo(() => (logoFile ? URL.createObjectURL(logoFile) : null), [logoFile])
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }, [previewUrl])

  const createdNew = !editing && savedId !== null

  const close = () => (createdNew ? onSaved(savedTeam) : onClose())

  const chooseFile = (file: File | undefined) => {
    setError('')
    if (!file) return setLogoFile(null)
    const problem = validateActivityImage(file)
    if (problem) {
      setError(problem)
      setLogoFile(null)
      return
    }
    setLogoFile(file)
    setRemoveLogo(false)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    const body = {
      team_name: name.trim(),
      team_code: code.trim() || null,
      short_name: shortName.trim() || null,
      category_id: Number(gameId),
    }
    let id = savedId
    let team: Team
    try {
      if (id === null) {
        team = (await adminTeamsApi.create(body)).data
        id = team.team_id
        setSavedId(id)
      } else {
        team = (await adminTeamsApi.update(id, body)).data
      }
      setSavedTeam(team)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the team.')
      setSaving(false)
      return
    }
    try {
      if (logoFile) await adminTeamsApi.uploadLogo(id, logoFile)
      else if (removeLogo && editing?.team_logo) await adminTeamsApi.removeLogo(id)
      onSaved(team)
    } catch (err) {
      setError(`The team was saved, but the logo could not be uploaded: ${err instanceof Error ? err.message : 'unknown error'}`)
      setSaving(false)
    }
  }

  const currentLogo = removeLogo ? null : editing?.team_logo ?? null

  return (
    <Modal show onHide={close} centered>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>{editing ? 'Edit team' : 'Add team'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form.Group className="mb-3" controlId="team-game">
            <Form.Label>Game</Form.Label>
            <Form.Select value={gameId} onChange={(e) => setGameId(e.target.value)} required>
              <option value="">Choose a game…</option>
              {games.map((game) => (
                <option key={game.category_id} value={game.category_id}>{game.name}</option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3" controlId="team-name">
            <Form.Label>Team name</Form.Label>
            <Form.Control value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required pattern=".*\S.*" autoFocus />
          </Form.Group>
          <div className="row g-3 mb-3">
            <Form.Group className="col-6" controlId="team-code">
              <Form.Label>Code</Form.Label>
              <Form.Control
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={10}
                placeholder="e.g. VWA"
              />
            </Form.Group>
            <Form.Group className="col-6" controlId="team-short-name">
              <Form.Label>Short name</Form.Label>
              <Form.Control value={shortName} onChange={(e) => setShortName(e.target.value)} maxLength={50} />
            </Form.Group>
          </div>
          <Form.Group controlId="team-logo">
            <Form.Label>Logo</Form.Label>
            <div className="d-flex align-items-center gap-3">
              {previewUrl ? (
                <img src={previewUrl} alt="Selected logo" className="team-badge team-badge--logo" style={{ width: 56, height: 56 }} />
              ) : (
                <TeamBadge name={name || '?'} logo={currentLogo} size={56} />
              )}
              <div className="flex-grow-1">
                <Form.Control
                  type="file"
                  accept={ACTIVITY_IMAGE_ACCEPT}
                  onChange={(e) => chooseFile((e.target as HTMLInputElement).files?.[0])}
                />
                <Form.Text muted>JPG, PNG or GIF, up to 2 MB. Without a logo the team's initials are shown.</Form.Text>
              </div>
            </div>
            {editing?.team_logo && !logoFile && (
              <Form.Check
                className="mt-2"
                id="team-remove-logo"
                label="Remove logo (show initials)"
                checked={removeLogo}
                onChange={(e) => setRemoveLogo(e.target.checked)}
              />
            )}
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={close} disabled={saving}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}
