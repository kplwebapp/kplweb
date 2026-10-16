import { Container, Card } from 'react-bootstrap'
import { usePageTitle } from '@/hooks/usePageTitle'

type Props = {
  title: string
  description?: string
  children?: React.ReactNode
  /** When false, only sets the document title (no heading card). Default true. */
  showHeading?: boolean
}

/** Shared public-page chrome: consistent document title + page heading. */
export default function PageShell({ title, description, children, showHeading = true }: Props) {
  usePageTitle(title)

  if (!showHeading) {
    return <Container as="section" className="py-4">{children}</Container>
  }

  return (
    <Container as="section" className="py-4">
      <header className="page-heading mb-4">
        <h1 className="page-heading__title">{title}</h1>
        {description && <p className="page-heading__description">{description}</p>}
      </header>
      {children ?? (
        <Card className="shadow-sm border-0">
          <Card.Body className="p-4">
            <Card.Text className="text-muted mb-0">Content coming soon.</Card.Text>
          </Card.Body>
        </Card>
      )}
    </Container>
  )
}
