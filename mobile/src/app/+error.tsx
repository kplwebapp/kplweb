import { router } from 'expo-router'
import { ErrorScreen } from '@/components/ui/ErrorScreen'

/** Expo Router error boundary screen for uncaught route/render failures. */
export default function ErrorRoute({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <ErrorScreen
      kind="server"
      title="Something went wrong"
      description={error?.message || 'An unexpected error occurred.'}
      actionLabel="Try again"
      onAction={retry}
      secondaryLabel="Go home"
      onSecondary={() => router.replace('/')}
    />
  )
}
