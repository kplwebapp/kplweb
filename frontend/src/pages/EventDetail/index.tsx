import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Alert, Badge, Card, Col, Container, Row, Spinner } from 'react-bootstrap'
import PageShell from '@/components/common/PageShell'
import { usePageTitle } from '@/hooks/usePageTitle'
import { activitiesApi, type Activity, type ActivityKind } from '@/services/api/activitiesApi'
import { formatEventDateRange } from '@/utils/eventDate'
import { activityImageFallback, getActivityImageUrl } from '@/utils/activityImage'
import { CRICKET_CATEGORY_SLUG } from '@/constants/cricketSkills'
import TournamentSections from './TournamentSections'
import RegisterCta from './RegisterCta'
import './EventDetail.scss'

type Props = {
  kind: ActivityKind
  singular: string
  label: string
  path: string
}

type Result = { slug: string; item: Activity | null }

export default function ActivityDetail({ kind, singular, label, path }: Props) {
  const { slug = '' } = useParams()
  const [result, setResult] = useState<Result | null>(null)

  useEffect(() => {
    let cancelled = false
    activitiesApi
      .getBySlug(slug)
      .then((res) => { if (!cancelled) setResult({ slug, item: res.data }) })
      .catch(() => { if (!cancelled) setResult({ slug, item: null }) })
    return () => { cancelled = true }
  }, [slug])

  const item = result?.slug === slug ? result.item : null
  const pageTitle =
    item && item.kind === kind ? item.title : item === null && result?.slug === slug ? `${singular} not found` : label
  usePageTitle(pageTitle)

  const backLink = (
    <Link to={path} className="btn btn-outline-primary btn-sm">Back to all {label.toLowerCase()}</Link>
  )

  if (result?.slug !== slug) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" />
      </Container>
    )
  }

  if (!item || item.kind !== kind) {
    return (
      <PageShell title={`${singular} not found`}>
        <Alert variant="warning">This {singular.toLowerCase()} could not be found.</Alert>
        {backLink}
      </PageShell>
    )
  }

  const dates = formatEventDateRange(item.event_date, item.end_date)
  const facts = [
    { label: item.days && item.days > 1 ? 'Dates' : 'Date', value: dates || 'To be announced' },
    { label: 'Venue', value: item.venue || 'To be announced' },
    item.category_name ? { label: 'Category', value: item.category_name } : null,
    item.days ? { label: 'Duration', value: `${item.days} day${item.days === 1 ? '' : 's'}` } : null,
  ].filter((fact): fact is { label: string; value: string } => fact !== null)

  return (
    <div className="activity-detail">
      <section className="activity-detail__banner">
        <img
          src={getActivityImageUrl(item.image_url, item.kind)}
          onError={activityImageFallback(item.kind)}
          alt=""
          className="activity-detail__banner-img"
        />
        <div className="activity-detail__banner-overlay">
          <Container>
            <div className="d-flex gap-2 mb-2">
              {item.category_name && <Badge bg="light" text="dark">{item.category_name}</Badge>}
              {item.status === 'ONGOING' && <Badge bg="success">Happening now</Badge>}
              {item.status === 'UPCOMING' && <Badge bg="primary">Upcoming</Badge>}
              {item.status === 'PAST' && <Badge bg="secondary">Completed</Badge>}
            </div>
            <h1 className="activity-detail__title">{item.title}</h1>
            {(dates || item.venue) && (
              <p className="activity-detail__meta mb-0">{[dates, item.venue].filter(Boolean).join(' · ')}</p>
            )}
          </Container>
        </div>
      </section>

      <Container className="py-4">
        <Card className="border-0 shadow-sm mb-4">
          <Card.Body className="p-4">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
              <h2 className="activity-detail__section-title mb-0">{singular} Details</h2>
              {item.kind === 'TOURNAMENT' && item.category_slug === CRICKET_CATEGORY_SLUG && (
                <RegisterCta slug={item.slug} status={item.status} />
              )}
            </div>
            <Row className="g-3 mb-3">
              {facts.map((fact) => (
                <Col key={fact.label} xs={6} md={3}>
                  <div className="activity-detail__fact">
                    <small className="text-muted text-uppercase">{fact.label}</small>
                    <div className="fw-semibold">{fact.value}</div>
                  </div>
                </Col>
              ))}
            </Row>
            {item.description ? (
              <p className="mb-0" style={{ whiteSpace: 'pre-line' }}>{item.description}</p>
            ) : (
              <p className="text-muted mb-0">More details coming soon.</p>
            )}
          </Card.Body>
        </Card>

        {kind === 'TOURNAMENT' && (
          <TournamentSections slug={item.slug} status={item.status} startDate={item.event_date} />
        )}

        {backLink}
      </Container>
    </div>
  )
}
