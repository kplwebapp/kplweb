import ErrorPage from '@/components/errors/ErrorPage'
import { ADMIN_BASE } from '@/admin/config/sidebar'

export default function AdminNotFoundPage() {
  return (
    <ErrorPage
      kind="not-found"
      title="Admin page not found"
      description="This admin URL does not exist. Use the sidebar, or return to the dashboard."
      homeTo={ADMIN_BASE}
      homeLabel="Back to dashboard"
      variant="page"
    />
  )
}
