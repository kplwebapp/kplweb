import ErrorPage from '@/components/errors/ErrorPage'
import { usePageTitle } from '@/hooks/usePageTitle'

export default function NotFoundPage() {
  usePageTitle('Page not found')
  return <ErrorPage kind="not-found" homeTo="/" homeLabel="Back to home" />
}
