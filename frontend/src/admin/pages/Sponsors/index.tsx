import { useEffect, useState, type FormEvent } from 'react'
import { Button, Row, Col, Card, Badge, Alert, Spinner, Modal, Form } from 'react-bootstrap'
import PageHeader, { AdminSection } from '@/admin/components/common/PageHeader'
import { adminContentApi, type Sponsor } from '@/services/api/contentApi'

const emptySponsor = {
  sponsor_name: '',
  tier: 'STANDARD',
  display_order: 0,
  is_active: true,
  logo_url: '',
  website_url: '',
}

export default function SponsorsPage() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Sponsor | null>(null)
  const [form, setForm] = useState(emptySponsor)
  const [saving, setSaving] = useState(false)

  const loadSponsors = () => {
    setLoading(true)
    adminContentApi
      .listSponsors()
      .then((res) => setSponsors(res.data))
      .catch(() => setError('Failed to load sponsors.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadSponsors()
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm(emptySponsor)
    setShowModal(true)
  }

  const openEdit = (sponsor: Sponsor) => {
    setEditing(sponsor)
    setForm({
      sponsor_name: sponsor.sponsor_name,
      tier: sponsor.tier,
      display_order: sponsor.display_order,
      is_active: sponsor.is_active ?? true,
      logo_url: sponsor.logo_url || '',
      website_url: sponsor.website_url || '',
    })
    setShowModal(true)
  }

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (editing) {
        await adminContentApi.updateSponsor(editing.sponsor_id, form)
      } else {
        await adminContentApi.createSponsor(form)
      }
      setShowModal(false)
      loadSponsors()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (sponsor: Sponsor) => {
    try {
      await adminContentApi.updateSponsor(sponsor.sponsor_id, { is_active: !sponsor.is_active })
      loadSponsors()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed.')
    }
  }

  return (
    <AdminSection>
      <PageHeader
        title="Sponsors"
        description="Manage sponsors shown on the public Sponsors page and Home section."
        actions={<Button variant="primary" size="sm" onClick={openCreate}>Add Sponsor</Button>}
      />

      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" /></div>
      ) : (
        <Row className="g-3">
          {sponsors.map((sponsor) => (
            <Col key={sponsor.sponsor_id} md={6} lg={3}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <Card.Title as="h6">{sponsor.sponsor_name}</Card.Title>
                    <Badge bg={sponsor.is_active ? 'success' : 'secondary'}>
                      {sponsor.is_active ? 'Active' : 'Hidden'}
                    </Badge>
                  </div>
                  <Card.Text className="text-muted small">
                    Tier: {sponsor.tier} · Order: {sponsor.display_order}
                  </Card.Text>
                  <div className="d-flex gap-2">
                    <Button size="sm" variant="outline-primary" onClick={() => openEdit(sponsor)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="outline-secondary" onClick={() => toggleActive(sponsor)}>
                      {sponsor.is_active ? 'Hide' : 'Show'}
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editing ? 'Edit Sponsor' : 'Add Sponsor'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSave}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                value={form.sponsor_name}
                onChange={(e) => setForm({ ...form, sponsor_name: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Tier</Form.Label>
              <Form.Select
                value={form.tier}
                onChange={(e) => setForm({ ...form, tier: e.target.value })}
              >
                <option value="TITLE">Title</option>
                <option value="GOLD">Gold</option>
                <option value="SILVER">Silver</option>
                <option value="COMMUNITY">Community</option>
                <option value="STANDARD">Standard</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Display Order</Form.Label>
              <Form.Control
                type="number"
                value={form.display_order}
                onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Logo URL</Form.Label>
              <Form.Control
                value={form.logo_url}
                onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
              />
            </Form.Group>
            <Form.Check
              type="checkbox"
              label="Active (visible on public site)"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </AdminSection>
  )
}
