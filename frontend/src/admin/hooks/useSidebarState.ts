import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'

const COLLAPSED_KEY = 'kpl-admin-sidebar-collapsed'
/** Below Bootstrap's `lg` breakpoint the sidebar becomes a slide-in drawer (keep in sync with admin.css). */
const MOBILE_QUERY = '(max-width: 991.98px)'

const subscribe = (onChange: () => void) => {
  const media = window.matchMedia(MOBILE_QUERY)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

const useIsMobile = () => useSyncExternalStore(subscribe, () => window.matchMedia(MOBILE_QUERY).matches)

/** Desktop: collapsed (icons only) or expanded, remembered across visits. Mobile: drawer open or closed. */
export function useSidebarState() {
  const isMobile = useIsMobile()
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSED_KEY) === '1')
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem(COLLAPSED_KEY, collapsed ? '1' : '0')
  }, [collapsed])

  const closeDrawer = useCallback(() => setDrawerOpen(false), [])

  useEffect(() => {
    if (!drawerOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDrawerOpen(false) }
    document.addEventListener('keydown', onKey)
    document.body.classList.add('admin-drawer-open')
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.classList.remove('admin-drawer-open')
    }
  }, [drawerOpen])

  const toggle = useCallback(() => {
    if (window.matchMedia(MOBILE_QUERY).matches) setDrawerOpen((open) => !open)
    else setCollapsed((c) => !c)
  }, [])

  return {
    isMobile,
    /** Icons-only mode; never applies to the mobile drawer. */
    collapsed: collapsed && !isMobile,
    drawerOpen: drawerOpen && isMobile,
    toggle,
    closeDrawer,
  }
}
