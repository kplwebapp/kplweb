import { useCallback, useEffect, useMemo, useState, type MouseEvent, type ReactElement } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { Button, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { useSidebarState } from '@/admin/hooks/useSidebarState'
import logo from '@/assets/img-logo-white.png'
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
import { authApi, type AuthUser } from '@/services/api/authApi'
import { ADMIN_SESSION_KEYS, adminSession, isStaff, roleLabel } from '@/utils/adminSession'

type NavItem = { label: string; path: string; icon: string }

const navClass = ({ isActive }: { isActive: boolean }) => `nav-link admin-nav-link${isActive ? ' active' : ''}`

/** Shows `label` as a tooltip to the right, only while the sidebar is collapsed to icons. */
function SideTip({ label, show, children }: { label: string; show: boolean; children: ReactElement }) {
  return (
    <OverlayTrigger
      placement="right"
      trigger={show ? ['hover', 'focus'] : []}
      show={show ? undefined : false}
      overlay={<Tooltip id={`admin-tip-${label.replace(/\W+/g, '-')}`}>{label}</Tooltip>}
    >
      {children}
    </OverlayTrigger>
  )
}

function SideLink({ item, collapsed, end }: { item: NavItem; collapsed: boolean; end?: boolean }) {
  return (
    <SideTip label={item.label} show={collapsed}>
      <NavLink to={item.path} end={end} className={navClass} aria-label={collapsed ? item.label : undefined}>
        <span className="admin-nav-icon" aria-hidden="true">{item.icon}</span>
        <span className="admin-nav-label">{item.label}</span>
      </NavLink>
    </SideTip>
  )
}

function NavGroup({ title, items, collapsed }: { title: string; items: NavItem[]; collapsed: boolean }) {
  return (
    <div className="mb-2">
      <small className="admin-nav-title text-uppercase text-secondary px-2 mb-1 d-block">{title}</small>
      {items.map((item) => (
        <SideLink key={item.path} item={item} collapsed={collapsed} />
      ))}
    </div>
  )
}

const displayName = (user: AuthUser) =>
  user.full_name || [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email

/** Collapsed sidebar: just the initials, with the full details in a tooltip. */
function SignedInBadge({ user, active }: { user: AuthUser; active: boolean }) {
  const name = displayName(user)
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
  const details = `${name} · ${user.email} · ${user.roles.map(roleLabel).join(', ')}`
  return (
    <SideTip label={details} show={active}>
      <span
        className="admin-user__avatar admin-user__badge"
        tabIndex={active ? 0 : -1}
        aria-label={`Signed in as ${details}`}
      >
        {initials}
      </span>
    </SideTip>
  )
}

function SignedInUser({ user }: { user: AuthUser }) {
  const name = displayName(user)

  return (
    <div className="admin-user" aria-label="Signed in as">
      <div className="d-flex align-items-center gap-2">
        <div className="min-w-0">
          <div className="admin-user__name text-truncate" title={name}>{name}</div>
          <div className="admin-user__meta text-truncate" title={user.email}>{user.email}</div>
        </div>
      </div>
      <div className="d-flex flex-wrap gap-1 mt-2">
        {user.roles.map((role) => (
          <span key={role} className="admin-user__role">{roleLabel(role)}</span>
        ))}
      </div>
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

  const [user, setUser] = useState<AuthUser | null>(adminSession.getUser)

  // Refresh the signed-in admin's details; roles may have changed since sign-in.
  useEffect(() => {
    let cancelled = false
    authApi
      .me()
      .then((res) => {
        if (cancelled) return
        if (!isStaff(res.data.roles)) {
          adminSession.clear()
          window.location.href = `${ADMIN_BASE}/login?expired=1`
          return
        }
        adminSession.saveUser(res.data)
        setUser(res.data)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  // Only the admin session matters here; the public website's member login is independent.
  useEffect(() => {
    const signOut = () => {
      adminSession.clear()
      window.location.href = `${ADMIN_BASE}/login?expired=1`
    }
    const onStorage = (e: StorageEvent) => {
      // logging out of the admin panel in another tab
      if ((e.key === ADMIN_SESSION_KEYS.accessToken || e.key === null) && !adminSession.getToken()) signOut()
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

  const { isMobile, collapsed, drawerOpen, toggle, closeDrawer } = useSidebarState()

  const handleLogout = () => {
    adminSession.clear()
    window.location.href = `${ADMIN_BASE}/login`
  }

  // Picking a link in the mobile drawer closes it.
  const closeOnNavigate = (e: MouseEvent<HTMLElement>) => {
    if (drawerOpen && (e.target as HTMLElement).closest('a')) closeDrawer()
  }

  const shellClass = [
    'admin-shell d-flex',
    collapsed && 'admin-shell--collapsed',
    drawerOpen && 'admin-shell--drawer-open',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={shellClass}>
      <aside id="admin-sidebar" className="admin-sidebar p-3 d-flex flex-column" onClick={closeOnNavigate}>
        <NavLink to={ADMIN_BASE} className="admin-logo mb-3" title="KPL Admin – Dashboard">
          <img src={logo} alt="Kansara Premier League – Admin" />
          <span className="admin-wordmark" aria-hidden="true">
            <span className="admin-wordmark__top">Kansara</span>
            <span className="admin-wordmark__bottom">
              {Array.from('PREMIER LEAGUE').map((ch, i) => (
                <span key={i}>{ch === ' ' ? '\u00a0' : ch}</span>
              ))}
            </span>
          </span>
        </NavLink>

        {user && (
          <div className="admin-user-slot">
            <div className="admin-user-slot__item admin-user-slot__full" aria-hidden={collapsed}>
              <div><SignedInUser user={user} /></div>
            </div>
            <div className="admin-user-slot__item admin-user-slot__badge" aria-hidden={!collapsed}>
              <div><SignedInBadge user={user} active={collapsed} /></div>
            </div>
          </div>
        )}

        <nav className="nav flex-column flex-nowrap gap-1 flex-grow-1 admin-nav">
          <div className="mb-2">
            <SideLink item={dashboardItem} collapsed={collapsed} end />
          </div>
          <NavGroup title={KIND_LABELS.TOURNAMENT.plural} items={kindGroup('TOURNAMENT')} collapsed={collapsed} />
          <NavGroup title={KIND_LABELS.EVENT.plural} items={kindGroup('EVENT')} collapsed={collapsed} />
          {playerItems.length > 0 && <NavGroup title="Players" items={playerItems} collapsed={collapsed} />}
          <NavGroup title={contentGroup.title} items={contentGroup.items} collapsed={collapsed} />
        </nav>

        <SideTip label="Log out" show={collapsed}>
          <Button variant="outline-light" size="sm" className="admin-logout" onClick={handleLogout}>
            <span className="admin-nav-icon" aria-hidden="true">⎋</span>
            <span className="admin-nav-label">Log out</span>
          </Button>
        </SideTip>
      </aside>

      <div className="admin-overlay" onClick={closeDrawer} aria-hidden="true" />

      <main className="admin-main flex-grow-1">
        <div className="admin-topbar">
          <button
            type="button"
            className="admin-menu-toggle"
            onClick={toggle}
            aria-controls="admin-sidebar"
            aria-expanded={isMobile ? drawerOpen : !collapsed}
            aria-label={isMobile ? (drawerOpen ? 'Close menu' : 'Open menu') : collapsed ? 'Expand menu' : 'Collapse menu'}
            title={isMobile ? undefined : collapsed ? 'Expand menu' : 'Collapse menu'}
          >
            <span className="admin-menu-toggle__bars" aria-hidden="true" />
          </button>
          {isMobile && (
            <NavLink to={ADMIN_BASE} className="admin-topbar__logo">
              <img src={logo} alt="KPL Admin" />
            </NavLink>
          )}
        </div>
        <div className="p-4">
          <Outlet context={context} />
        </div>
      </main>
    </div>
  )
}
