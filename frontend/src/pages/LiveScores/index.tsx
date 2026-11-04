import { Row, Col, Card, Badge } from 'react-bootstrap'
import PageShell from '@/components/common/PageShell'
import EmptyState from '@/components/tournament/EmptyState'

type LiveMatch = {
  team1: string
  team2: string
  score1: string
  score2: string
  overs: string
}

/** Filled when live scoring is wired to the API; empty for now. */
const liveMatches: LiveMatch[] = []

export default function LiveScores() {
  return (
    <PageShell title="Live Scores" description="Real-time ball-by-ball updates.">
      {liveMatches.length === 0 ? (
        <EmptyState art="scores" title="No live matches right now" compact>
          Scores will appear here when a match is live. Check Fixtures for upcoming games.
        </EmptyState>
      ) : (
        <Row className="g-3">
          {liveMatches.map((match) => (
            <Col xs={12} key={`${match.team1}-${match.team2}`}>
              <Card className="border-0 shadow-sm">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <span>Live Match</span>
                  <Badge bg="danger">LIVE</Badge>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col sm={5}>
                      <strong>{match.team1}</strong>
                      <div className="text-muted">{match.score1}</div>
                    </Col>
                    <Col sm={2} className="text-center text-muted">
                      vs
                    </Col>
                    <Col sm={5}>
                      <strong>{match.team2}</strong>
                      <div className="text-muted">{match.score2}</div>
                    </Col>
                  </Row>
                  <Card.Text className="small text-muted mt-2 mb-0">Overs: {match.overs}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </PageShell>
  )
}
