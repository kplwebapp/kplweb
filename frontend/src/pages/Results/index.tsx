import { ListGroup } from 'react-bootstrap'
import PageShell from '@/components/common/PageShell'

const results = [
  { summary: 'Valsad Warriors beat Friends Cricketers by 24 runs', date: 'Mar 8, 2026' },
  { summary: 'Omisol Champions beat Super Strikers by 6 wickets', date: 'Mar 9, 2026' },
]

export default function Results() {
  return (
    <PageShell title="Results" description="Completed match results and summaries.">
      <ListGroup variant="flush">
        {results.map((result) => (
          <ListGroup.Item key={result.summary}>
            <div className="fw-semibold">{result.summary}</div>
            <small className="text-muted">{result.date}</small>
          </ListGroup.Item>
        ))}
      </ListGroup>
    </PageShell>
  )
}
