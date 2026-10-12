import { Container, Row, Col, Card, Badge } from 'react-bootstrap'
import React from 'react'
import './TopPerformers.scss'

const performers = [
  { name: 'Player 1', stat: 'Most Runs', value: '428 runs' },
  { name: 'Player 2', stat: 'Most Wickets', value: '18 wickets' },
  { name: 'Player 3', stat: 'Best Strike Rate', value: '162.4' },
]

export default function TopPerformers() {
  return (
    <React.Fragment>
      <section className="top-performers py-4">
        <Container>
          <h2 className="section-title text-center mb-4">Top Performers</h2>
          <Row className="g-4">
            {performers.map((performer) => (
              <Col key={performer.name} md={4}>
                <Card className="h-100 shadow-sm border-0 text-center">
                  <Card.Body>
                    <Badge bg="primary" className="mb-3">{performer.stat}</Badge>
                    <Card.Title as="h5">{performer.name}</Card.Title>
                    <Card.Text className="text-muted mb-0">{performer.value}</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>
    </React.Fragment>
  )
}
