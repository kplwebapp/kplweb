import { Navigate, Outlet } from 'react-router-dom'
import { ADMIN_BASE } from '@/admin/config/sidebar'
import { adminSession } from '@/utils/adminSession'

export default function ProtectedRoute() {
  if (!adminSession.getToken()) {
    return <Navigate to={`${ADMIN_BASE}/login`} replace />
  }

  return <Outlet />
}
