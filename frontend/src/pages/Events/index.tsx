import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Row, Col, Card, Spinner, Alert, Badge, Nav } from 'react-bootstrap'
import PageShell from '@/components/common/PageShell'
import EmptyState from '@/components/tournament/EmptyState'
import { activitiesApi, type Activity, type ActivityKind, type ActivityStatus } from '@/services/api/activitiesApi'
import { formatEventDateRange } from '@/utils/eventDate'
import { activityImageFallback, getActivityImageUrl } from '@/utils/activityImage'

type Props = {
  kind: ActivityKind
  label: string
  path: string
  /** Show Upcoming / Ongoing / Completed tabs (including finished items) instead of only upcoming ones. */
  tabbed?: boolean
}

type TabKey = 'upcoming' | 'ongoing' | 'completed'

const TABS: { key: TabKey; status: ActivityStatus; title: string }[] = [
  { key: 'upcoming', status: 'UPCOMING', title: 'Upcoming' },
  { key: 'ongoing', status: 'ONGOING', title: 'Ongoing' },
  { key: 'completed', status: 'PAST', title: 'Completed' },
]

const STATUS_BADGE: Record<ActivityStatus, { bg: string; text: string }> = {
  UPCOMING: { bg: 'primary', text: 'Upcoming' },
  ONGOING: { bg: 'success', text: 'Happening now' },
  PAST: { bg: 'secondary', text: 'Completed' },
}

function ActivityCard({ item, path }: { item: Activity; path: string }) {
  const badge = STATUS_BADGE[item.status]
  return (
    <Card className="h-100 shadow-sm border-0">
      <Card.Img
        variant="top"
        src={getActivityImageUrl(item.image_url, item.kind)}
        onError={activityImageFallback(item.kind)}
        alt={item.title}
        style={{ objectFit: 'cover', height: 180 }}
      />
      <Card.Body className="d-flex flex-column">
        <div className="d-flex gap-2 mb-2">
          {item.category_name && <Badge bg="light" text="dark">{item.category_name}</Badge>}
          <Badge bg={badge.bg}>{badge.text}</Badge>
        </div>
        <Card.Title as="h5">{item.title}</Card.Title>
        {(item.event_date || item.venue) && (
          <Card.Subtitle className="text-muted small mb-2">
            {[formatEventDateRange(item.event_date, item.end_date), item.venue].filter(Boolean).join(' · ')}
          </Card.Subtitle>
        )}
        {item.description && (
          <Card.Text className="text-muted" style={{ whiteSpace: 'pre-line' }}>
            {item.description.length > 160 ? `${item.description.slice(0, 160)}…` : item.description}
          </Card.Text>
        )}
        <Link to={`${path}/${item.slug}`} className="btn btn-outline-primary btn-sm mt-auto align-self-start">
          {item.status === 'PAST' ? 'View results' : 'View details'}
        </Link>
      </Card.Body>
    </Card>
  )
}

const emptyText: Record<TabKey, { title: string; text: (label: string) => string }> = {
  upcoming: {
    title: 'Nothing scheduled yet',
    text: (label) => `New ${label.toLowerCase()} will be announced here. Please check back soon.`,
  },
  ongoing: {
    title: 'Nothing happening right now',
    text: (label) => `No ${label.toLowerCase()} are in progress at the moment. Check the Upcoming tab for what's next.`,
  },
  completed: {
    title: 'No completed ones yet',
    text: (label) => `Finished ${label.toLowerCase()} and their results will be listed here.`,
  },
}

export default function ActivityList({ kind, label, path, tabbed = false }: Props) {
  const [result, setResult] = useState<{ kind: ActivityKind; items: Activity[]; error: string } | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    let cancelled = false
    activitiesApi
      .listPublic(kind, tabbed)
      .then((res) => { if (!cancelled) setResult({ kind, items: res.data, error: '' }) })
      .catch(() => {
        if (!cancelled) setResult({ kind, items: [], error: `Could not load ${label.toLowerCase()}. Please try again later.` })
      })
    return () => { cancelled = true }
  }, [kind, label, tabbed])

  const loading = result?.kind !== kind

  if (!tabbed) {
    return (
      <PageShell title={label} description={`Upcoming KPL ${label.toLowerCase()}.`}>
        {loading ? (
          <div className="text-center py-4"><Spinner animation="border" /></div>
        ) : result.error ? (
          <Alert variant="danger" className="mb-0">{result.error}</Alert>
        ) : result.items.length === 0 ? (
          <p className="text-muted mb-0">
            There are no upcoming {label.toLowerCase()} at the moment. Please check back soon.
          </p>
        ) : (
          <Row className="g-4">
            {result.items.map((item) => (
              <Col key={item.event_id} md={6} lg={4}><ActivityCard item={item} path={path} /></Col>
            ))}
          </Row>
        )}
      </PageShell>
    )
  }

  const items = loading ? [] : result.items
  const byTab = Object.fromEntries(
    TABS.map((t) => [t.key, items.filter((item) => item.status === t.status)]),
  ) as Record<TabKey, Activity[]>

  // Without an explicit ?tab=, open on what's live now, then what's next, then past results.
  const requested = TABS.find((t) => t.key === searchParams.get('tab'))?.key
  const fallback: TabKey = byTab.ongoing.length ? 'ongoing' : byTab.upcoming.length || !byTab.completed.length ? 'upcoming' : 'completed'
  const active = requested ?? fallback

  const selectTab = (key: string | null) => {
    if (key) setSearchParams({ tab: key }, { replace: true })
  }

  return (
    <PageShell title={label} description={`Upcoming, ongoing and completed KPL ${label.toLowerCase()}.`}>
      <Nav variant="tabs" activeKey={active} onSelect={selectTab} className="mb-4">
        {TABS.map((t) => (
          <Nav.Item key={t.key}>
            <Nav.Link eventKey={t.key}>
              {t.title}
              {!loading && <Badge bg={active === t.key ? 'primary' : 'light'} text={active === t.key ? undefined : 'dark'} className="ms-2">{byTab[t.key].length}</Badge>}
            </Nav.Link>
          </Nav.Item>
        ))}
      </Nav>

      {loading ? (
        <div className="text-center py-4"><Spinner animation="border" /></div>
      ) : result.error ? (
        <Alert variant="danger" className="mb-0">{result.error}</Alert>
      ) : byTab[active].length === 0 ? (
        <EmptyState art={active === 'completed' ? 'standings' : 'countdown'} title={emptyText[active].title} compact>
          {emptyText[active].text(label)}
        </EmptyState>
      ) : (
        <Row className="g-4">
          {byTab[active].map((item) => (
            <Col key={item.event_id} md={6} lg={4}><ActivityCard item={item} path={path} /></Col>
          ))}
        </Row>
      )}
    </PageShell>
  )
}
