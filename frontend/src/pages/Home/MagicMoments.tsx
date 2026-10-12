import { Container, Row, Col, Card } from 'react-bootstrap'
import './MagicMoments.scss'
import React from 'react'

const moments = [
  {
    title: 'Last Match Heroics',
    date: '12 Jun 2026',
    imageUrl: 'https://placehold.co/640x360/1e3a8a/ffffff?text=Last+Match+Heroics',
  },
  {
    title: 'Player of the Week',
    date: '8 Jun 2026',
    imageUrl: 'https://placehold.co/640x360/2563eb/ffffff?text=Player+of+the+Week',
  },
  {
    title: 'Game Changers',
    date: '2 Jun 2026',
    imageUrl: 'https://placehold.co/640x360/1d4ed8/ffffff?text=Game+Changers',
  },
]

export default function MagicMoments() {
  return (
    <React.Fragment>
      <section className="magic-moments py-5">
        <Container>
          <h2 className="section-title text-center mb-4">Magic Moments</h2>
          <Row className="g-4">
            {moments.map((moment) => (
              <Col key={moment.title} md={4}>
                <Card className="magic-moment-card h-100 shadow-sm border-0">
                  <Card.Img variant="top" src={moment.imageUrl} alt={moment.title} />
                  <Card.Body>
                    <Card.Title as="h5">{moment.title}</Card.Title>
                    <p className="magic-moment-date mb-0">{moment.date}</p>
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
