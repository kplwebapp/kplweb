import { useCallback, useState } from 'react'
import { Alert, Button, Card, Col, Row, Spinner } from 'react-bootstrap'
import { useReloadable } from '@/admin/hooks/useReloadable'
import { tournamentAdminApi, type MediaItem } from '@/services/api/tournamentApi'
import { getUploadUrl } from '@/utils/activityImage'
import { youtubeThumbnail } from '@/utils/youtube'
import PhotoUploadCard from './PhotoUploadCard'
import VideoLinksCard from './VideoLinksCard'

export default function GalleryTab({ tournamentId }: { tournamentId: number }) {
  const load = useCallback(() => tournamentAdminApi.listMedia(tournamentId).then((res) => res.data), [tournamentId])
  const { data, error, loading, reload } = useReloadable(load, String(tournamentId))

  const [uploading, setUploading] = useState(false)
  const [itemBusy, setItemBusy] = useState(false)
  const [message, setMessage] = useState<{ variant: 'danger' | 'success'; text: string } | null>(null)

  if (loading) return <div className="text-center py-5"><Spinner animation="border" /></div>
  if (!data) return <Alert variant="danger">{error}</Alert>

  const busy = uploading || itemBusy

  const succeeded = (text: string) => {
    setMessage({ variant: 'success', text })
    reload()
  }

  const runItemAction = async (action: () => Promise<unknown>, fallback: string) => {
    setItemBusy(true)
    setMessage(null)
    try {
      await action()
      reload()
    } catch (err) {
      setMessage({ variant: 'danger', text: err instanceof Error ? err.message : fallback })
    } finally {
      setItemBusy(false)
    }
  }

  const editCaption = (item: MediaItem) => {
    const caption = window.prompt('Caption', item.caption ?? '')
    if (caption === null) return
    runItemAction(() => tournamentAdminApi.updateCaption(tournamentId, item.media_id, caption), 'Could not update the caption.')
  }

  const remove = (item: MediaItem) => {
    if (!window.confirm(`Delete this ${item.media_type === 'PHOTO' ? 'photo' : 'video'} from the gallery?`)) return
    runItemAction(() => tournamentAdminApi.removeMedia(tournamentId, item.media_id), 'Could not delete it.')
  }

  const itemCard = (item: MediaItem) => (
    <Col key={item.media_id} xs={6} md={4} xl={3}>
      <Card className="h-100 border-0 shadow-sm">
        <div className="ratio ratio-16x9 bg-light">
          <img
            src={item.media_type === 'PHOTO' ? getUploadUrl(item.url) : youtubeThumbnail(item.youtube_id ?? '')}
            alt={item.caption ?? ''}
            className="rounded-top"
            style={{ objectFit: 'cover' }}
          />
        </div>
        <Card.Body className="p-2 d-flex flex-column">
          <small className={item.caption ? 'mb-2' : 'mb-2 text-muted fst-italic'}>{item.caption || 'No caption'}</small>
          {item.media_type === 'VIDEO' && (
            <a href={item.url} target="_blank" rel="noreferrer" className="small mb-2 text-truncate">{item.url}</a>
          )}
          <div className="d-flex gap-1 mt-auto">
            <Button size="sm" variant="outline-primary" disabled={busy} onClick={() => editCaption(item)}>Caption</Button>
            <Button size="sm" variant="outline-danger" disabled={busy} onClick={() => remove(item)}>Delete</Button>
          </div>
        </Card.Body>
      </Card>
    </Col>
  )

  return (
    <>
      {message && (
        <Alert variant={message.variant} dismissible onClose={() => setMessage(null)}>{message.text}</Alert>
      )}

      <Row className="g-4 mb-4">
        <Col lg={6}>
          <PhotoUploadCard
            tournamentId={tournamentId}
            disabled={itemBusy}
            onBusyChange={setUploading}
            onUploaded={succeeded}
          />
        </Col>
        <Col lg={6}>
          <VideoLinksCard
            tournamentId={tournamentId}
            disabled={itemBusy}
            onBusyChange={setUploading}
            onAdded={succeeded}
          />
        </Col>
      </Row>

      <h5 className="mb-3">Photos ({data.photos.length})</h5>
      {data.photos.length === 0 ? (
        <p className="text-muted">No photos yet.</p>
      ) : (
        <Row className="g-3 mb-4">{data.photos.map(itemCard)}</Row>
      )}

      <h5 className="mb-3">Videos ({data.videos.length})</h5>
      {data.videos.length === 0 ? (
        <p className="text-muted">No videos yet.</p>
      ) : (
        <Row className="g-3">{data.videos.map(itemCard)}</Row>
      )}
    </>
  )
}
