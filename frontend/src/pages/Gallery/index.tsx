import { useEffect, useState } from 'react'
import { Container, Row, Col, Card, Spinner, Alert } from 'react-bootstrap'
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
      <Container className="py-5 text-center">
        <Spinner animation="border" />
      </Container>
    )
  }

  return (
    <Container as="section" className="gallery-page py-4">
      <Card className="shadow-sm border-0 mb-4">
        <Card.Body className="p-4">
          <Card.Title as="h2">{galleryContent.title}</Card.Title>
          <Card.Text className="lead text-muted mb-0">{galleryContent.description}</Card.Text>
        </Card.Body>
      </Card>

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
                  <Card.Title as="h6">{item.title || 'Untitled'}</Card.Title>
                  {item.caption && (
                    <Card.Text className="text-muted small mb-0">{item.caption}</Card.Text>
                  )}
                </Card.Body>
              </Card>
            </Col>
          ))
        )}
      </Row>
    </Container>
  )
}
