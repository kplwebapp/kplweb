import { useEffect, useState } from 'react'
import { Card, Col, Modal, Nav, Row, Spinner } from 'react-bootstrap'
import EmptyState from '@/components/tournament/EmptyState'
import PointsTableView from '@/components/tournament/PointsTableView'
import TeamBadge from '@/components/tournament/TeamBadge'
import type { ActivityStatus } from '@/services/api/activitiesApi'
import { tournamentPublicApi, type MediaItem, type TournamentDetails } from '@/services/api/tournamentApi'
import { getUploadUrl } from '@/utils/activityImage'
import { daysUntil, formatEventDateRange } from '@/utils/eventDate'
import { youtubeEmbedUrl, youtubeThumbnail } from '@/utils/youtube'

type Props = {
  slug: string
  status: ActivityStatus
  startDate: string | null
}

type Result = { slug: string; details: TournamentDetails }
type GalleryTab = 'photos' | 'videos'

const EMPTY_DETAILS: TournamentDetails = { teams: [], points_table: [], photos: [], videos: [] }

function countdownLabel(days: number | null): { value: string; label: string } | null {
  if (days === null || days < 0) return null
  if (days === 0) return { value: 'Today', label: 'kick-off' }
  if (days === 1) return { value: '1', label: 'day to go' }
  return { value: String(days), label: 'days to go' }
}

/** Teams, points table and gallery of a tournament. Every section is always shown, with a friendly placeholder when empty. */
export default function TournamentSections({ slug, status, startDate }: Props) {
  const [result, setResult] = useState<Result | null>(null)
  const [tab, setTab] = useState<GalleryTab>('photos')
  const [openItem, setOpenItem] = useState<MediaItem | null>(null)

  useEffect(() => {
    let cancelled = false
    tournamentPublicApi
      .getDetails(slug)
      .then((res) => { if (!cancelled) setResult({ slug, details: res.data }) })
      .catch(() => { if (!cancelled) setResult({ slug, details: EMPTY_DETAILS }) })
    return () => { cancelled = true }
  }, [slug])

  if (result?.slug !== slug) return <div className="text-center py-4"><Spinner animation="border" size="sm" /></div>

  const { teams, points_table: points, photos, videos } = result.details
  const upcoming = status === 'UPCOMING'
  const finished = status === 'PAST'
  const hasResults = points.some((row) => row.played > 0)
  const countdown = upcoming ? countdownLabel(daysUntil(startDate)) : null
  const galleryItems = tab === 'photos' ? photos : videos

  const notStartedText = upcoming ? 'once the tournament gets under way' : 'soon'

  return (
    <>
      {upcoming && (
        <section className="mb-4">
          <EmptyState art="countdown" title="The tournament hasn't started yet">
            <p className="mb-0">
              {startDate
                ? `Kick-off is on ${formatEventDateRange(startDate)}.`
                : 'The start date will be announced soon.'}{' '}
              Match results, the points table and photos will appear here as the action unfolds.
            </p>
            {countdown && (
              <span className="tournament-countdown">
                <strong>{countdown.value}</strong> {countdown.label}
              </span>
            )}
          </EmptyState>
        </section>
      )}

      <section className="mb-4">
        <h2 className="activity-detail__section-title">Participating Teams</h2>
        {teams.length === 0 ? (
          <EmptyState art="teams" title="Teams to be announced" compact>
            The participating teams will be listed here {upcoming ? 'before the tournament begins' : 'soon'}.
          </EmptyState>
        ) : (
          <Row className="g-3">
            {teams.map((team) => (
              <Col key={team.team_id} xs={6} md={4} lg={3}>
                <Card className="activity-detail__team h-100 border-0 shadow-sm text-center">
                  <Card.Body>
                    <TeamBadge name={team.team_name} logo={team.team_logo} size={72} />
                    <div className="fw-semibold mt-2">{team.team_name}</div>
                    {team.short_name && <small className="text-muted">{team.short_name}</small>}
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </section>

      <section className="mb-4">
        <h2 className="activity-detail__section-title">Points Table</h2>
        {hasResults ? (
          <Card className="border-0 shadow-sm overflow-hidden">
            <PointsTableView rows={points} />
          </Card>
        ) : (
          <EmptyState
            art="standings"
            title={upcoming ? 'No matches played yet' : finished ? 'No standings recorded' : 'Waiting for the first result'}
            compact
          >
            {upcoming
              ? 'The points table will come alive after the first league match is played.'
              : finished
                ? 'No league results were recorded for this tournament.'
                : 'The points table updates automatically after each completed league match.'}
          </EmptyState>
        )}
      </section>

      <section className="mb-4">
        <h2 className="activity-detail__section-title">Gallery</h2>
        <Nav variant="tabs" activeKey={tab} onSelect={(key) => key && setTab(key as GalleryTab)} className="mb-3">
          <Nav.Item>
            <Nav.Link eventKey="photos">Photos ({photos.length})</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="videos">Videos ({videos.length})</Nav.Link>
          </Nav.Item>
        </Nav>
        {galleryItems.length === 0 ? (
          <EmptyState
            art={tab}
            title={tab === 'photos' ? 'No photos yet' : 'No videos yet'}
            compact
          >
            {tab === 'photos'
              ? `Photos from the tournament will be shared here ${notStartedText}.`
              : `Highlights and match videos will be posted here ${notStartedText}.`}
          </EmptyState>
        ) : (
          <Row className="g-3">
            {galleryItems.map((item) => (
              <Col key={item.media_id} xs={6} md={4} lg={3}>
                <button type="button" className="activity-detail__media" onClick={() => setOpenItem(item)}>
                  <div className="ratio ratio-16x9">
                    <img
                      src={item.media_type === 'PHOTO' ? getUploadUrl(item.url) : youtubeThumbnail(item.youtube_id ?? '')}
                      alt={item.caption ?? (item.media_type === 'PHOTO' ? 'Tournament photo' : 'Tournament video')}
                      loading="lazy"
                    />
                  </div>
                  {item.media_type === 'VIDEO' && <span className="activity-detail__play" aria-hidden="true">▶</span>}
                  {item.caption && <span className="activity-detail__caption">{item.caption}</span>}
                </button>
              </Col>
            ))}
          </Row>
        )}
      </section>

      <Modal show={openItem !== null} onHide={() => setOpenItem(null)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title as="h6">{openItem?.caption || (openItem?.media_type === 'VIDEO' ? 'Video' : 'Photo')}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0 bg-dark">
          {openItem?.media_type === 'PHOTO' && (
            <img src={getUploadUrl(openItem.url)} alt={openItem.caption ?? ''} className="w-100 d-block" style={{ maxHeight: '75vh', objectFit: 'contain' }} />
          )}
          {openItem?.media_type === 'VIDEO' && openItem.youtube_id && (
            <div className="ratio ratio-16x9">
              <iframe
                src={youtubeEmbedUrl(openItem.youtube_id, true)}
                title={openItem.caption ?? 'Tournament video'}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
        </Modal.Body>
      </Modal>
    </>
  )
}
