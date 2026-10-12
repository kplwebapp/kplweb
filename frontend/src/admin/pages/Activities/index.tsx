import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Alert, Button, Nav, Spinner, Table } from 'react-bootstrap'
import PageHeader, { AdminSection } from '@/admin/components/common/PageHeader'
import ActivityFormModal from '@/admin/components/ActivityFormModal'
import { KIND_LABELS, tournamentManagePath } from '@/admin/config/sidebar'
import { useAdminContext } from '@/admin/context'
import {
  adminActivitiesApi,
  type Activity,
  type ActivityKind,
  type ActivityStatus,
} from '@/services/api/activitiesApi'
import { formatEventDateRange } from '@/utils/eventDate'

type View = ActivityStatus | 'ARCHIVED'

const TABS: { key: ActivityStatus; label: (plural: string) => string }[] = [
  { key: 'UPCOMING', label: (plural) => `Upcoming ${plural}` },
  { key: 'ONGOING', label: (plural) => `Ongoing ${plural}` },
  { key: 'PAST', label: (plural) => `Past ${plural}` },
]

type Result = { key: string; items: Activity[]; error: string }

export default function ActivitiesPage({ kind }: { kind: ActivityKind }) {
  const { category: slug = '' } = useParams()
  return <CategoryActivities key={`${kind}:${slug}`} kind={kind} slug={slug} />
}

function CategoryActivities({ kind, slug }: { kind: ActivityKind; slug: string }) {
  const { categories, categoriesLoaded, isSuperAdmin } = useAdminContext()
  const category = categories[kind].find((c) => c.slug === slug)
  const labels = KIND_LABELS[kind]

  const [view, setView] = useState<View>('UPCOMING')
  const [reloadToken, setReloadToken] = useState(0)
  const [result, setResult] = useState<Result | null>(null)
  const [actionError, setActionError] = useState('')
  const [modal, setModal] = useState<{ editing: Activity | null } | null>(null)

  const categoryId = category?.category_id
  const requestKey = `${categoryId}:${view}:${reloadToken}`

  useEffect(() => {
    if (!categoryId) return
    let cancelled = false
    const filters =
      view === 'ARCHIVED'
        ? { kind, categoryId, archived: true }
        : { kind, categoryId, status: view }
    adminActivitiesApi
      .list(filters)
      .then((res) => { if (!cancelled) setResult({ key: requestKey, items: res.data, error: '' }) })
      .catch((err) => {
        if (!cancelled) {
          setResult({ key: requestKey, items: [], error: err instanceof Error ? err.message : 'Failed to load.' })
        }
      })
    return () => { cancelled = true }
  }, [kind, categoryId, view, requestKey])

  const reload = () => setReloadToken((t) => t + 1)

  const runAction = async (action: () => Promise<unknown>) => {
    setActionError('')
    try {
      await action()
      reload()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action failed.')
    }
  }

  const handleArchive = (item: Activity) => {
    if (!window.confirm(`Archive "${item.title}"? It will be hidden from the website and these tabs.`)) return
    runAction(() => adminActivitiesApi.archive(item.event_id))
  }

  const handleRestore = (item: Activity) => runAction(() => adminActivitiesApi.restore(item.event_id))

  const handleDelete = (item: Activity) => {
    if (!window.confirm(`Permanently delete "${item.title}"? This cannot be undone.`)) return
    runAction(() => adminActivitiesApi.remove(item.event_id))
  }

  if (!categoriesLoaded) {
    return <div className="text-center py-5"><Spinner animation="border" /></div>
  }

  if (!category) {
    return (
      <AdminSection>
        <Alert variant="warning">This {labels.singular.toLowerCase()} category doesn't exist or has been hidden.</Alert>
      </AdminSection>
    )
  }

  const loading = result?.key !== requestKey
  const items = loading ? [] : result.items
  const loadError = loading ? '' : result.error
  const archivedView = view === 'ARCHIVED'

  return (
    <AdminSection>
      <PageHeader
        title={`${category.name} ${labels.plural}`}
        description={
          archivedView
            ? `Archived ${labels.plural.toLowerCase()} are hidden from the website. Restore one to show it again.`
            : `Manage ${category.name.toLowerCase()} ${labels.plural.toLowerCase()}. Archive instead of deleting to keep the history.`
        }
        actions={
          <div className="d-flex gap-2">
            <Button
              variant={archivedView ? 'secondary' : 'outline-secondary'}
              size="sm"
              onClick={() => setView(archivedView ? 'UPCOMING' : 'ARCHIVED')}
            >
              {archivedView ? `Back to ${labels.plural.toLowerCase()}` : 'View archived'}
            </Button>
            <Button variant="primary" size="sm" onClick={() => setModal({ editing: null })}>
              Add {labels.singular}
            </Button>
          </div>
        }
      />

      {!archivedView && (
        <Nav variant="tabs" activeKey={view} onSelect={(key) => key && setView(key as ActivityStatus)} className="mb-3">
          {TABS.map((tab) => (
            <Nav.Item key={tab.key}>
              <Nav.Link eventKey={tab.key}>{tab.label(labels.plural)}</Nav.Link>
            </Nav.Item>
          ))}
        </Nav>
      )}

      {(actionError || loadError) && (
        <Alert variant="danger" onClose={() => setActionError('')} dismissible={Boolean(actionError)}>
          {actionError || loadError}
        </Alert>
      )}

      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" /></div>
      ) : (
        <Table responsive hover className="bg-white shadow-sm align-middle">
          <thead className="table-light">
            <tr>
              <th>{labels.singular} Date</th>
              <th>{labels.singular} Title</th>
              <th>Venue</th>
              <th className="text-center">No. of Days</th>
              <th className="text-end">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-muted py-4">
                  {archivedView
                    ? `No archived ${labels.plural.toLowerCase()}.`
                    : `No ${view.toLowerCase()} ${labels.plural.toLowerCase()}.`}
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.event_id}>
                  <td className="text-nowrap">{formatEventDateRange(item.event_date, item.end_date) || 'Date TBA'}</td>
                  <td className="fw-semibold">{item.title}</td>
                  <td>{item.venue || '—'}</td>
                  <td className="text-center">{item.days ?? '—'}</td>
                  <td className="text-end">
                    <div className="d-inline-flex gap-2">
                      {archivedView ? (
                        <>
                          <Button size="sm" variant="outline-primary" onClick={() => handleRestore(item)}>
                            Restore
                          </Button>
                          {isSuperAdmin && (
                            <Button size="sm" variant="outline-danger" onClick={() => handleDelete(item)}>
                              Delete
                            </Button>
                          )}
                        </>
                      ) : (
                        <>
                          {kind === 'TOURNAMENT' && (
                            <Link to={tournamentManagePath(category.slug, item.event_id)} className="btn btn-sm btn-primary">
                              Manage
                            </Link>
                          )}
                          <Button size="sm" variant="outline-primary" onClick={() => setModal({ editing: item })}>
                            Edit
                          </Button>
                          <Button size="sm" variant="outline-secondary" onClick={() => handleArchive(item)}>
                            Archive
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      )}

      {modal && (
        <ActivityFormModal
          key={modal.editing?.event_id ?? 'new'}
          kind={kind}
          category={category}
          editing={modal.editing}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null)
            reload()
          }}
        />
      )}
    </AdminSection>
  )
}
