import { ListGroup, Badge } from 'react-bootstrap'
import PageShell from '@/components/common/PageShell'
import EmptyState from '@/components/tournament/EmptyState'

type Fixture = { match: string; date: string; venue: string }

/** Filled when fixtures are wired to the API; empty for now. */
const fixtures: Fixture[] = []

export default function Fixtures() {
  return (
    <PageShell title="Fixtures" description="Upcoming match schedule.">
      {fixtures.length === 0 ? (
        <EmptyState art="fixtures" title="No fixtures scheduled yet" compact>
          The match schedule will show up here once tournaments publish their fixtures.
        </EmptyState>
      ) : (
        <ListGroup variant="flush">
          {fixtures.map((fixture) => (
            <ListGroup.Item
              key={fixture.match}
              className="d-flex justify-content-between align-items-start flex-wrap gap-2"
            >
              <div>
                <strong>{fixture.match}</strong>
                <div className="text-muted small">{fixture.venue}</div>
              </div>
              <Badge bg="primary">{fixture.date}</Badge>
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}
    </PageShell>
  )
}
