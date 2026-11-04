import ErrorPage from '@/components/errors/ErrorPage'
import { usePageTitle } from '@/hooks/usePageTitle'

export default function OfflinePage() {
  usePageTitle('Offline')
  return (
    <ErrorPage
      kind="offline"
      homeTo="/"
      homeLabel="Back to home"
      onRetry={() => window.location.reload()}
      retryLabel="Retry connection"
    />
  )
}
