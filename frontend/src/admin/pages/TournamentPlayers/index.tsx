import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Alert, Badge, Spinner, Table } from 'react-bootstrap'
import PageHeader, { AdminSection } from '@/admin/components/common/PageHeader'
import { ADMIN_BASE, playersPath } from '@/admin/config/sidebar'
import { useAdminContext } from '@/admin/context'
import { adminActivitiesApi, type Activity, type RegisteredPlayer } from '@/services/api/activitiesApi'
import { formatEventDateRange } from '@/utils/eventDate'
import { CRICKET_CATEGORY_SLUG, CRICKET_SKILL_LABELS } from '@/constants/cricketSkills'

const STATUS_BADGE: Record<Activity['status'], string> = {
  UPCOMING: 'primary',
  ONGOING: 'success',
  PAST: 'secondary',
}

/** /admin/players/:category — tournaments in a category, each with a "View Players" button. */
export function TournamentsForPlayersPage() {
  const { category: slug = '' } = useParams()
  const { categories, categoriesLoaded } = useAdminContext()
  const category = categories.TOURNAMENT.find((c) => c.slug === slug)
  const categoryId = category?.category_id

  const [result, setResult] = useState<{ categoryId: number; items: Activity[]; error: string } | null>(null)

  useEffect(() => {
    if (!categoryId) return
    let cancelled = false
    adminActivitiesApi
      .list({ kind: 'TOURNAMENT', categoryId })
      .then((res) => { if (!cancelled) setResult({ categoryId, items: res.data, error: '' }) })
      .catch((err) => {
        if (!cancelled) setResult({ categoryId, items: [], error: err instanceof Error ? err.message : 'Failed to load.' })
      })
    return () => { cancelled = true }
  }, [categoryId])

  if (!categoriesLoaded) return <div className="text-center py-5"><Spinner animation="border" /></div>
  if (!category) {
    return <AdminSection><Alert variant="warning">This tournament category doesn't exist or has been hidden.</Alert></AdminSection>
  }

  const current = result?.categoryId === categoryId ? result : null

  return (
    <AdminSection>
      <PageHeader
        title={`${category.name} Players`}
        description={`Choose a ${category.name.toLowerCase()} tournament to see the players who registered for it.`}
      />

      {!current ? (
        <div className="text-center py-5"><Spinner animation="border" /></div>
      ) : current.error ? (
        <Alert variant="danger">{current.error}</Alert>
      ) : (
        <Table responsive hover className="bg-white shadow-sm align-middle">
          <thead className="table-light">
            <tr>
              <th>Tournament Title</th>
              <th>Tournament Date</th>
              <th>Venue</th>
              <th className="text-end">Action</th>
            </tr>
          </thead>
          <tbody>
            {current.items.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center text-muted py-4">
                  No {category.name.toLowerCase()} tournaments yet. Add one under Tournaments → {category.name}.
                </td>
              </tr>
            ) : (
              current.items.map((item) => (
                <tr key={item.event_id}>
                  <td className="fw-semibold">
                    {item.title}{' '}
                    <Badge bg={STATUS_BADGE[item.status]} className="ms-1 fw-normal">{item.status.toLowerCase()}</Badge>
                  </td>
                  <td className="text-nowrap">{formatEventDateRange(item.event_date, item.end_date) || 'Date TBA'}</td>
                  <td>{item.venue || '—'}</td>
                  <td className="text-end">
                    <Link to={`${playersPath(category.slug)}/${item.event_id}`} className="btn btn-sm btn-primary">
                      View Players
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      )}
    </AdminSection>
  )
}

const playerName = (p: RegisteredPlayer) =>
  p.full_name?.trim() || [p.first_name, p.last_name].filter(Boolean).join(' ') || p.email

/** /admin/players/:category/:tournamentId — players registered for one tournament. */
export function TournamentRegistrationsPage() {
  const { category: slug = '', tournamentId = '' } = useParams()
  const id = Number(tournamentId)

  const [result, setResult] = useState<
    { id: number; tournament: Activity | null; players: RegisteredPlayer[]; error: string } | null
  >(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    adminActivitiesApi
      .listRegistrations(id)
      .then((res) => { if (!cancelled) setResult({ id, ...res.data, error: '' }) })
      .catch((err) => {
        if (!cancelled) {
          setResult({ id, tournament: null, players: [], error: err instanceof Error ? err.message : 'Failed to load.' })
        }
      })
    return () => { cancelled = true }
  }, [id])

  const backLink = (
    <Link to={slug ? playersPath(slug) : ADMIN_BASE} className="btn btn-sm btn-outline-secondary">
      ← Back to tournaments
    </Link>
  )

  if (!id || (result?.id === id && !result.tournament)) {
    return (
      <AdminSection>
        <Alert variant="warning">{result?.error || 'Tournament not found.'}</Alert>
        {backLink}
      </AdminSection>
    )
  }

  if (result?.id !== id) return <div className="text-center py-5"><Spinner animation="border" /></div>

  const { tournament, players } = result
  const isCricket = tournament?.category_slug === CRICKET_CATEGORY_SLUG
  const columnCount = isCricket ? 6 + CRICKET_SKILL_LABELS.length : 6
  const meta = [
    tournament?.category_name,
    formatEventDateRange(tournament?.event_date, tournament?.end_date),
    tournament?.venue,
  ].filter(Boolean).join(' · ')

  return (
    <AdminSection>
      <PageHeader title="Players" description={[tournament?.title, meta].filter(Boolean).join(' · ')} actions={backLink} />

      <Table responsive hover className="bg-white shadow-sm align-middle">
        <thead className="table-light">
          <tr>
            <th style={{ width: 60 }}>#</th>
            <th>Player</th>
            <th>Email</th>
            <th>Mobile</th>
            <th>Vibhaag</th>
            {isCricket && CRICKET_SKILL_LABELS.map(({ key, label }) => <th key={key}>{label}</th>)}
            <th>Registered On</th>
          </tr>
        </thead>
        <tbody>
          {players.length === 0 ? (
            <tr>
              <td colSpan={columnCount} className="text-center text-muted py-4">
                No players have registered for this tournament yet.
              </td>
            </tr>
          ) : (
            players.map((p, index) => (
              <tr key={p.registration_id}>
                <td>{index + 1}</td>
                <td className="fw-semibold">{playerName(p)}</td>
                <td>{p.email}</td>
                <td>{p.mobile || '—'}</td>
                <td>{p.vibhaag || '—'}</td>
                {isCricket && CRICKET_SKILL_LABELS.map(({ key }) => (
                  <td key={key} className="text-nowrap">{p.cricket_skills?.[key] ?? '—'}</td>
                ))}
                <td>{new Date(p.registered_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </AdminSection>
  )
}
