import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Alert, Button, Card, CloseButton, Form } from 'react-bootstrap'
import { tournamentAdminApi } from '@/services/api/tournamentApi'
import { ACTIVITY_IMAGE_ACCEPT, validateActivityImage } from '@/utils/activityImage'

const MAX_PHOTOS_PER_UPLOAD = 20

const fileKey = (file: File) => `${file.name}:${file.size}:${file.lastModified}`

function Preview({ file, onRemove, disabled }: { file: File; onRemove: () => void; disabled: boolean }) {
  const url = useMemo(() => URL.createObjectURL(file), [file])
  useEffect(() => () => URL.revokeObjectURL(url), [url])
  return (
    <div className="gallery-upload-preview">
      <img src={url} alt={file.name} />
      <CloseButton
        className="gallery-upload-preview__remove"
        aria-label={`Remove ${file.name}`}
        onClick={onRemove}
        disabled={disabled}
      />
    </div>
  )
}

type Props = {
  tournamentId: number
  disabled: boolean
  onBusyChange: (busy: boolean) => void
  onUploaded: (message: string) => void
}

export default function PhotoUploadCard({ tournamentId, disabled, onBusyChange, onUploaded }: Props) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<File[]>([])
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const addFiles = (list: FileList | null) => {
    setError('')
    const chosen = Array.from(list ?? [])
    if (fileInput.current) fileInput.current.value = ''

    const rejected = chosen
      .map((file) => ({ file, problem: validateActivityImage(file) }))
      .filter((entry) => entry.problem)
    const accepted = chosen.filter((file) => !validateActivityImage(file))

    const known = new Set(files.map(fileKey))
    const merged = [...files, ...accepted.filter((file) => !known.has(fileKey(file)))]
    const problems = rejected.map((r) => `${r.file.name}: ${r.problem}`)
    if (merged.length > MAX_PHOTOS_PER_UPLOAD) {
      problems.push(`Only the first ${MAX_PHOTOS_PER_UPLOAD} photos were kept; upload the rest in another batch.`)
    }
    setFiles(merged.slice(0, MAX_PHOTOS_PER_UPLOAD))
    if (problems.length > 0) setError(problems.join(' '))
  }

  const removeFile = (index: number) => setFiles((prev) => prev.filter((_, i) => i !== index))

  const upload = async (e: FormEvent) => {
    e.preventDefault()
    setUploading(true)
    onBusyChange(true)
    setError('')
    try {
      const res = await tournamentAdminApi.uploadPhotos(tournamentId, files, caption)
      setFiles([])
      setCaption('')
      onUploaded(`${res.data.length} photo${res.data.length === 1 ? '' : 's'} uploaded.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload the photos.')
    } finally {
      setUploading(false)
      onBusyChange(false)
    }
  }

  const blocked = disabled || uploading

  return (
    <Card className="border-0 shadow-sm h-100">
      <Card.Header className="bg-white fw-semibold">Upload photos</Card.Header>
      <Card.Body>
        <Form onSubmit={upload}>
          {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
          <Form.Group className="mb-2" controlId="gallery-photos">
            <Form.Label className="small mb-1">
              Select one or more photos. You can pick several at once (Ctrl/Shift + click) or add more in rounds.
            </Form.Label>
            <Form.Control
              ref={fileInput}
              type="file"
              multiple
              accept={ACTIVITY_IMAGE_ACCEPT}
              disabled={blocked || files.length >= MAX_PHOTOS_PER_UPLOAD}
              onChange={(e) => addFiles((e.target as HTMLInputElement).files)}
            />
            <Form.Text muted>
              JPG, PNG or GIF, up to 2 MB each, {MAX_PHOTOS_PER_UPLOAD} per upload.
            </Form.Text>
          </Form.Group>

          {files.length > 0 && (
            <>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <small className="fw-semibold">{files.length} selected</small>
                <Button variant="link" size="sm" className="p-0" disabled={blocked} onClick={() => setFiles([])}>
                  Clear all
                </Button>
              </div>
              <div className="gallery-upload-previews mb-2">
                {files.map((file, index) => (
                  <Preview key={fileKey(file)} file={file} disabled={blocked} onRemove={() => removeFile(index)} />
                ))}
              </div>
            </>
          )}

          <Form.Control
            className="mb-2"
            placeholder="Caption for these photos (optional)"
            value={caption}
            maxLength={300}
            disabled={blocked}
            onChange={(e) => setCaption(e.target.value)}
          />
          <Button type="submit" size="sm" disabled={files.length === 0 || blocked}>
            {uploading
              ? 'Uploading…'
              : `Upload${files.length ? ` ${files.length} photo${files.length === 1 ? '' : 's'}` : ''}`}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  )
}
