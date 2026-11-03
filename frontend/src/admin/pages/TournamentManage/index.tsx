import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Alert, Badge, Nav, Spinner } from 'react-bootstrap'
import PageHeader, { AdminSection } from '@/admin/components/common/PageHeader'
import { ADMIN_BASE, categoryPath } from '@/admin/config/sidebar'
import { adminActivitiesApi, type Activity } from '@/services/api/activitiesApi'
import { formatEventDateRange } from '@/utils/eventDate'
import { adminSession, hasPermission } from '@/utils/adminSession'
import TeamsTab from './TeamsTab'
import ScoresTab from './ScoresTab'
import MatchesTab from './MatchesTab'
import PointsTab from './PointsTab'
import GalleryTab from './GalleryTab'

type TabKey = 'teams' | 'scores' | 'matches' | 'points' | 'gallery'

type Result = { id: number; tournament: Activity | null; error: string }

/** /admin/tournaments/:category/:id — participating teams, results, standings and gallery of one tournament. */
export default function TournamentManagePage() {
  const { category = '', id: idParam = '' } = useParams()
  const id = Number(idParam)
  const canScore = hasPermission(adminSession.getUser(), 'scoring:write', 'scoring:live')
  const tabs = useMemo(
    () =>
      (
        [
          { key: 'teams' as const, label: 'Teams' },
          ...(canScore ? [{ key: 'scores' as const, label: 'Scores' }] : []),
          { key: 'matches' as const, label: 'Matches & Results' },
          { key: 'points' as const, label: 'Points Table' },
          { key: 'gallery' as const, label: 'Gallery' },
        ] satisfies { key: TabKey; label: string }[]
      ),
    [canScore],
  )
  const [tab, setTab] = useState<TabKey>('teams')
  const [result, setResult] = useState<Result | null>(null)

  useEffect(() => {
    if (tab === 'scores' && !canScore) setTab('teams')
  }, [tab, canScore])

  useEffect(() => {
    if (!id) return
    let cancelled = false
    adminActivitiesApi
      .get(id)
      .then((res) => { if (!cancelled) setResult({ id, tournament: res.data, error: '' }) })
      .catch((err) => {
        if (!cancelled) setResult({ id, tournament: null, error: err instanceof Error ? err.message : 'Failed to load.' })
      })
    return () => { cancelled = true }
  }, [id])

  const backLink = (
    <Link to={category ? categoryPath('TOURNAMENT', category) : ADMIN_BASE} className="btn btn-sm btn-outline-secondary">
      ← Back to tournaments
    </Link>
  )

  if (id && result?.id !== id) return <div className="text-center py-5"><Spinner animation="border" /></div>

  const tournament = result?.tournament
  if (!id || !tournament || tournament.kind !== 'TOURNAMENT') {
    return (
      <AdminSection>
        <Alert variant="warning">{result?.error || 'Tournament not found.'}</Alert>
        {backLink}
      </AdminSection>
    )
  }

  const meta = [
    tournament.category_name,
    formatEventDateRange(tournament.event_date, tournament.end_date),
    tournament.venue,
  ].filter(Boolean).join(' · ')

  return (
    <AdminSection>
      <PageHeader
        title={tournament.title}
        description={meta}
        actions={
          <div className="d-flex gap-2 align-items-center">
            {tournament.is_archived && <Badge bg="secondary">Archived</Badge>}
            {!tournament.is_archived && (
              <a href={`/tournaments/${tournament.slug}`} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary">
                View on website ↗
              </a>
            )}
            {backLink}
          </div>
        }
      />

      <Nav variant="tabs" activeKey={tab} onSelect={(key) => key && setTab(key as TabKey)} className="mb-3">
        {tabs.map((t) => (
          <Nav.Item key={t.key}>
            <Nav.Link eventKey={t.key}>{t.label}</Nav.Link>
          </Nav.Item>
        ))}
      </Nav>

      {tab === 'teams' && (
        <TeamsTab
          tournamentId={id}
          categoryId={tournament.category_id}
          categoryName={tournament.category_name}
          categorySlug={tournament.category_slug}
        />
      )}
      {tab === 'scores' && canScore && (
        <ScoresTab tournamentId={id} categorySlug={tournament.category_slug} />
      )}
      {tab === 'matches' && (
        <MatchesTab tournamentId={id} categorySlug={tournament.category_slug} />
      )}
      {tab === 'points' && <PointsTab tournamentId={id} categorySlug={tournament.category_slug} />}
      {tab === 'gallery' && <GalleryTab tournamentId={id} />}
    </AdminSection>
  )
}
