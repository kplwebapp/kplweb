import { Container, Card } from 'react-bootstrap'

type Props = {
  title: string
  description?: string
  children?: React.ReactNode
  actions?: React.ReactNode
}

export default function PageHeader({ title, description, children, actions }: Props) {
  return (
    <div className="mb-4">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
        <div>
          <h2 className="mb-1">{title}</h2>
          {description && <p className="text-muted mb-0">{description}</p>}
        </div>
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
