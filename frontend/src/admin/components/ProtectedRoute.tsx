import { Navigate, Outlet } from 'react-router-dom'
import { ADMIN_BASE } from '@/admin/config/sidebar'

export default function ProtectedRoute() {
  const hasToken = !!localStorage.getItem('accessToken')

  if (!hasToken) {
    return <Navigate to={`${ADMIN_BASE}/login`} replace />
  }

  return <Outlet />
}
