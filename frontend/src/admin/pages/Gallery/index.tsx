import { useEffect, useState, type FormEvent } from 'react'
import { Button, Row, Col, Card, Alert, Spinner, Modal, Form } from 'react-bootstrap'
import PageHeader, { AdminSection } from '@/admin/components/common/PageHeader'
import { adminContentApi, type GalleryItem } from '@/services/api/contentApi'

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: '', image_url: '', caption: '', category: 'GENERAL' })

  const loadItems = () => {
    setLoading(true)
    adminContentApi
      .listGallery()
      .then((res) => setItems(res.data))
      .catch(() => setError('Failed to load gallery.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadItems()
  }, [])

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await adminContentApi.createGalleryItem(form)
      setShowModal(false)
      setForm({ title: '', image_url: '', caption: '', category: 'GENERAL' })
      loadItems()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add image.')
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async (id: number) => {
    if (!window.confirm('Remove this gallery item?')) return
    try {
      await adminContentApi.deleteGalleryItem(id)
      setItems((prev) => prev.filter((item) => item.gallery_id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove item.')
    }
  }

  return (
    <AdminSection>
      <PageHeader
        title="Gallery Management"
        description="Upload and manage images for the public Gallery page."
        actions={
          <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
            Add Image
          </Button>
        }
      />

      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" /></div>
      ) : (
        <Row className="g-3">
          {items.map((item) => (
            <Col key={item.gallery_id} sm={6} lg={3}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Img
                  variant="top"
                  src={item.image_url}
                  alt={item.title || 'Gallery image'}
                  style={{ height: 160, objectFit: 'cover' }}
                />
                <Card.Body>
                  <Card.Title as="h6">{item.title || 'Untitled'}</Card.Title>
                  <Card.Text className="text-muted small">{item.category}</Card.Text>
                  <Button size="sm" variant="outline-danger" onClick={() => handleRemove(item.gallery_id)}>
                    Remove
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Gallery Image</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAdd}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Image URL</Form.Label>
              <Form.Control
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                placeholder="https://..."
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Caption</Form.Label>
              <Form.Control
                value={form.caption}
                onChange={(e) => setForm({ ...form, caption: e.target.value })}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Category</Form.Label>
              <Form.Control
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? 'Adding...' : 'Add Image'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </AdminSection>
  )
}
