import { Container, Card } from 'react-bootstrap'
import { usePageTitle } from '@/hooks/usePageTitle'

type Props = {
  title: string
  description?: string
  children?: React.ReactNode
  actions?: React.ReactNode
}

export default function PageHeader({ title, description, children, actions }: Props) {
  usePageTitle(title)

  return (
    <div className="mb-4">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
        <header className="page-heading">
          <h1 className="page-heading__title">{title}</h1>
          {description && <p className="page-heading__description">{description}</p>}
        </header>
        {actions}
      </div>
      {children && (
        <Card className="border-0 shadow-sm">
          <Card.Body>{children}</Card.Body>
        </Card>
      )}
    </div>
  )
}

export function AdminSection({ children }: { children: React.ReactNode }) {
  return <Container fluid className="px-0">{children}</Container>
}
