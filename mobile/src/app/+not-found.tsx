import { router } from 'expo-router'
import { ErrorScreen } from '@/components/ui/ErrorScreen'

export default function NotFound() {
  return (
    <ErrorScreen
      kind="not-found"
      actionLabel="Go home"
      onAction={() => router.replace('/')}
    />
  )
}
