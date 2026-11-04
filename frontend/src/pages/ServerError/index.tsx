import ErrorPage from '@/components/errors/ErrorPage'
import { usePageTitle } from '@/hooks/usePageTitle'

/** Standalone 500 page (e.g. deep-linked after a hard failure). */
export default function ServerErrorPage() {
  usePageTitle('Server error')
  return (
    <ErrorPage
      kind="server"
      homeTo="/"
      homeLabel="Back to home"
      onRetry={() => window.location.reload()}
    />
  )
}
