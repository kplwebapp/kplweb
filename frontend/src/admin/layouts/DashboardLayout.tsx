import { useCallback, useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { Button } from 'react-bootstrap'
import {
  ADMIN_BASE,
  KIND_LABELS,
  categoryIcon,
  categoryPath,
  contentGroup,
  dashboardItem,
  manageCategoriesPath,
  playersPath,
  teamsItem,
} from '@/admin/config/sidebar'
import { readIsSuperAdmin, type AdminContext } from '@/admin/context'
import { adminActivitiesApi, type ActivityKind, type Category } from '@/services/api/activitiesApi'
import { UNAUTHORIZED_EVENT } from '@/services/api/client'

type NavItem = { label: string; path: string; icon: string }

const navClass = ({ isActive }: { isActive: boolean }) => `nav-link admin-nav-link${isActive ? ' active' : ''}`

function NavGroup({ title, items }: { title: string; items: NavItem[] }) {
  return (
    <div className="mb-2">
      <small className="text-uppercase text-secondary px-2 mb-1 d-block">{title}</small>
      {items.map((item) => (
        <NavLink key={item.path} to={item.path} className={navClass}>
          <span className="me-2">{item.icon}</span>
          {item.label}
        </NavLink>
      ))}
    </div>
  )
}

const emptyCategories: Record<ActivityKind, Category[]> = { TOURNAMENT: [], EVENT: [] }

export default function DashboardLayout() {
  const [categories, setCategories] = useState(emptyCategories)
  const [categoriesLoaded, setCategoriesLoaded] = useState(false)
  const [isSuperAdmin] = useState(readIsSuperAdmin)

  const fetchCategories = useCallback(
    () =>
      Promise.all([
        adminActivitiesApi.listCategories('TOURNAMENT'),
        adminActivitiesApi.listCategories('EVENT'),
      ])
        .then(([tournaments, events]) => setCategories({ TOURNAMENT: tournaments.data, EVENT: events.data }))
        .catch(() => setCategories(emptyCategories))
        .finally(() => setCategoriesLoaded(true)),
    [],
  )

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  // The public site shares the same stored login, so logging out (or in as a member) there ends this session too.
  useEffect(() => {
    const signOut = () => {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      window.location.href = `${ADMIN_BASE}/login?expired=1`
    }
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'accessToken' && !e.newValue) signOut()
    }
    window.addEventListener(UNAUTHORIZED_EVENT, signOut)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(UNAUTHORIZED_EVENT, signOut)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  const context: AdminContext = useMemo(
    () => ({ categories, categoriesLoaded, reloadCategories: fetchCategories, isSuperAdmin }),
    [categories, categoriesLoaded, fetchCategories, isSuperAdmin],
  )

  const activeOf = (kind: ActivityKind) => categories[kind].filter((c) => c.is_active)

  const kindGroup = (kind: ActivityKind): NavItem[] => [
    ...activeOf(kind).map((c) => ({ label: c.name, path: categoryPath(kind, c.slug), icon: categoryIcon(kind, c.slug) })),
    ...(kind === 'TOURNAMENT' ? [teamsItem] : []),
    { label: 'Manage categories', path: manageCategoriesPath(kind), icon: '⚙️' },
  ]

  const playerItems: NavItem[] = activeOf('TOURNAMENT').map((c) => ({
    label: c.name,
    path: playersPath(c.slug),
    icon: categoryIcon('TOURNAMENT', c.slug),
  }))

  const handleLogout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    window.location.href = `${ADMIN_BASE}/login`
  }

  return (
    <div className="admin-shell d-flex">
      <aside className="admin-sidebar p-3 d-flex flex-column">
        <div className="mb-4">
          <h5 className="text-white mb-1">KPL Admin</h5>
          <small className="text-secondary">Kansara Premier League</small>
        </div>

        <nav className="nav flex-column gap-1 flex-grow-1 overflow-auto">
          <div className="mb-2">
            <NavLink to={dashboardItem.path} end className={navClass}>
              <span className="me-2">{dashboardItem.icon}</span>
              {dashboardItem.label}
            </NavLink>
          </div>
          <NavGroup title={KIND_LABELS.TOURNAMENT.plural} items={kindGroup('TOURNAMENT')} />
          <NavGroup title={KIND_LABELS.EVENT.plural} items={kindGroup('EVENT')} />
          {playerItems.length > 0 && <NavGroup title="Players" items={playerItems} />}
          <NavGroup title={contentGroup.title} items={contentGroup.items} />
        </nav>

        <Button variant="outline-light" size="sm" onClick={handleLogout}>
          Log out
        </Button>
      </aside>

      <main className="admin-main flex-grow-1 p-4">
        <Outlet context={context} />
      </main>
    </div>
  )
}
