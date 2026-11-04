import { ListGroup } from 'react-bootstrap'
import PageShell from '@/components/common/PageShell'
import EmptyState from '@/components/tournament/EmptyState'

type Result = { summary: string; date: string }

/** Filled when results are wired to the API; empty for now. */
const results: Result[] = []

export default function Results() {
  return (
    <PageShell title="Results" description="Completed match results and summaries.">
      {results.length === 0 ? (
        <EmptyState art="standings" title="No results yet" compact>
          Match results and summaries will appear here after games are completed.
        </EmptyState>
      ) : (
        <ListGroup variant="flush">
          {results.map((result) => (
            <ListGroup.Item key={result.summary}>
              <div className="fw-semibold">{result.summary}</div>
              <small className="text-muted">{result.date}</small>
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}
    </PageShell>
  )
}
