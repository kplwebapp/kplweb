import { useEffect, useState } from 'react'
import { Row, Col, Card, Spinner, Alert } from 'react-bootstrap'
import PageShell from '@/components/common/PageShell'
import { sponsorsContent } from '@/content'
import { contentApi, type Sponsor } from '@/services/api/contentApi'

const tierLabel: Record<string, string> = {
  TITLE: 'Title Partner',
  GOLD: 'Gold',
  SILVER: 'Silver',
  COMMUNITY: 'Community',
  STANDARD: 'Partner',
}

export default function SponsorsPage() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    contentApi.getSponsors()
      .then((res) => setSponsors(res.data))
      .catch(() => setError('Unable to load sponsors.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <PageShell title={sponsorsContent.title} description={sponsorsContent.description}>
        <div className="text-center py-5"><Spinner animation="border" /></div>
      </PageShell>
    )
  }

  return (
    <PageShell title={sponsorsContent.title} description={sponsorsContent.description}>
      {error && <Alert variant="warning">{error}</Alert>}

      <Row className="g-3">
        {sponsors.length === 0 ? (
          <Col xs={12} className="text-center text-muted">{sponsorsContent.emptyMessage}</Col>
        ) : (
          sponsors.map((sponsor) => (
            <Col key={sponsor.sponsor_id} sm={6} lg={3}>
              <Card className="border-0 shadow-sm text-center h-100">
                <Card.Body>
                  {sponsor.logo_url && (
                    <img
                      src={sponsor.logo_url}
                      alt={sponsor.sponsor_name}
                      className="mb-2"
                      style={{ maxHeight: 48, maxWidth: '100%' }}
                    />
                  )}
                  <Card.Title as="h6">{sponsor.sponsor_name}</Card.Title>
                  <Card.Text className="text-muted small mb-0">
                    {tierLabel[sponsor.tier] || sponsor.tier}
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          ))
        )}
      </Row>
    </PageShell>
  )
}
