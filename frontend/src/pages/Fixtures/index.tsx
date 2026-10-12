import { ListGroup, Badge } from 'react-bootstrap'
import PageShell from '@/components/common/PageShell'

const fixtures = [
  { match: 'Valsad Warriors vs Omisol Champions', date: 'Mar 15, 2026', venue: 'Ground A' },
  { match: 'Super Strikers vs Friends Cricketers', date: 'Mar 16, 2026', venue: 'Ground B' },
  { match: 'Mahakali Tigers vs Fearless Falcons', date: 'Mar 22, 2026', venue: 'Ground A' },
]

export default function Fixtures() {
  return (
    <PageShell title="Fixtures" description="Upcoming match schedule.">
      <ListGroup variant="flush">
        {fixtures.map((fixture) => (
          <ListGroup.Item key={fixture.match} className="d-flex justify-content-between align-items-start flex-wrap gap-2">
            <div>
              <strong>{fixture.match}</strong>
              <div className="text-muted small">{fixture.venue}</div>
            </div>
            <Badge bg="primary">{fixture.date}</Badge>
          </ListGroup.Item>
        ))}
      </ListGroup>
    </PageShell>
  )
}
