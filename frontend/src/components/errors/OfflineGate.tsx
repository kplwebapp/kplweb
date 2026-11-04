import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import ErrorPage from './ErrorPage'

/** When the browser goes offline, replace the app with a branded offline screen. */
export default function OfflineGate({ children }: { children: React.ReactNode }) {
  const online = useOnlineStatus()
  if (!online) {
    return (
      <ErrorPage
        kind="offline"
        onRetry={() => window.location.reload()}
        retryLabel="Retry connection"
        homeTo="/"
        homeLabel="Go home"
      />
    )
  }
  return children
}
