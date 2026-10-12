import { useEffect, useState } from 'react'
import { Container, Row, Col, Card, Spinner } from 'react-bootstrap'
import { contentApi, type Sponsor } from '@/services/api/contentApi'
import './Sponsors.scss'
import React from 'react'

export default function Sponsors() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    contentApi.getSponsors()
      .then((res) => setSponsors(res.data))
      .catch(() => setSponsors([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <Container as="section" className="sponsors py-4 text-center">
        <Spinner animation="border" />
      </Container>
    )
  }

  if (sponsors.length === 0) return null

  return (
    <React.Fragment>
      <section className="sponsors py-4">
        <Container>
          <h2 className="section-title text-center mb-4">Our Sponsors</h2>
          <Row className="g-3 justify-content-center">
            {sponsors.map((sponsor) => (
              <Col key={sponsor.sponsor_id} xs={6} md={3}>
                <Card className="shadow-sm border-0 text-center h-100">
                  <Card.Body className="d-flex align-items-center justify-content-center py-4">
                    {sponsor.logo_url ? (
                      <img
                        src={sponsor.logo_url}
                        alt={sponsor.sponsor_name}
                        style={{ maxHeight: 40, maxWidth: '100%' }}
                      />
                    ) : (
                      <Card.Text className="fw-semibold mb-0">{sponsor.sponsor_name}</Card.Text>
                    )}
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
