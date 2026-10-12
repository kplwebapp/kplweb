import { Row, Col, Card } from 'react-bootstrap'
import PageShell from '@/components/common/PageShell'

const stats = [
  { label: 'Most Runs', value: '428', player: 'Rahul Sharma' },
  { label: 'Most Wickets', value: '18', player: 'Amit Patel' },
  { label: 'Highest Score', value: '89*', player: 'Vikram Singh' },
]

export default function Statistics() {
  return (
    <PageShell title="Statistics" description="Leaderboards, batting and bowling stats.">
      <Row className="g-3">
        {stats.map((stat) => (
          <Col key={stat.label} md={4}>
            <Card className="border-0 shadow-sm text-center h-100">
              <Card.Body>
                <Card.Subtitle className="text-muted">{stat.label}</Card.Subtitle>
                <Card.Title as="h3">{stat.value}</Card.Title>
                <Card.Text className="mb-0">{stat.player}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </PageShell>
  )
}
