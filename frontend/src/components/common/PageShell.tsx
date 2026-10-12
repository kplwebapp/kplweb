import { Container, Card } from 'react-bootstrap'

type Props = {
  title: string
  description?: string
  children?: React.ReactNode
}

export default function PageShell({ title, description, children }: Props) {
  return (
    <Container as="section" className="py-4">
      <Card className="shadow-sm border-0">
        <Card.Body className="p-4">
          <Card.Title as="h2" className="mb-2">{title}</Card.Title>
          {description && (
            <Card.Subtitle as="p" className="lead text-muted mb-4">
              {description}
            </Card.Subtitle>
          )}
          {children ?? (
            <Card.Text className="text-muted mb-0">
              Content coming soon.
            </Card.Text>
          )}
        </Card.Body>
      </Card>
    </Container>
  )
}
