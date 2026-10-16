import { useEffect, useState } from 'react'
import { Row, Col, Card, Spinner, Alert } from 'react-bootstrap'
import PageShell from '@/components/common/PageShell'
import { galleryContent } from '@/content'
import { contentApi, type GalleryItem } from '@/services/api/contentApi'
import './Gallery.scss'

export default function Gallery() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    contentApi.getGallery()
      .then((res) => setItems(res.data))
      .catch(() => setError('Unable to load gallery.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <PageShell title={galleryContent.title} description={galleryContent.description}>
        <div className="text-center py-5"><Spinner animation="border" /></div>
      </PageShell>
    )
  }

  return (
    <PageShell title={galleryContent.title} description={galleryContent.description}>
      {error && <Alert variant="warning">{error}</Alert>}

      <Row className="g-4">
        {items.length === 0 ? (
          <Col xs={12} className="text-center text-muted">{galleryContent.emptyMessage}</Col>
        ) : (
          items.map((item) => (
            <Col key={item.gallery_id} sm={6} lg={4}>
              <Card className="h-100 shadow-sm border-0">
                <Card.Img
                  variant="top"
                  src={item.image_url}
                  alt={item.title || 'Gallery image'}
                />
                <Card.Body>
                  <Card.Title as="h2" className="h6">{item.title || 'Untitled'}</Card.Title>
                  {item.caption && (
                    <Card.Text className="text-muted small mb-0">{item.caption}</Card.Text>
                  )}
                </Card.Body>
              </Card>
            </Col>
          ))
        )}
      </Row>
    </PageShell>
  )
}
