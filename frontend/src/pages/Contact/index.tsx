import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Container, Row, Col, Card, Form, Button, Alert, FloatingLabel } from 'react-bootstrap'
import { contactContent } from '@/content'
import { contentApi } from '@/services/api/contentApi'
import './Contact.scss'

export default function Contact() {
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await contentApi.submitContact(formData)
      setSubmitted(true)
      setFormData({ name: '', email: '', subject: '', message: '' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Container as="section" className="contact-page py-4">
      <Row className="g-4">
        <Col lg={5}>
          <Card className="shadow-sm border-0 h-100">
            <Card.Body className="p-4">
              <Card.Title as="h2">{contactContent.title}</Card.Title>
              <Card.Text className="text-muted">{contactContent.description}</Card.Text>
              <Card.Text className="mb-1"><strong>Email:</strong> {contactContent.email}</Card.Text>
              <Card.Text className="mb-0"><strong>Location:</strong> {contactContent.location}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={7}>
          <Card className="shadow-sm border-0">
            <Card.Body className="p-4">
              {submitted && (
                <Alert variant="success" dismissible onClose={() => setSubmitted(false)}>
                  {contactContent.successMessage}
                </Alert>
              )}
              {error && <Alert variant="danger">{error}</Alert>}
              <Form onSubmit={handleSubmit}>
                <Row className="g-3">
                  <Col md={6}>
                    <FloatingLabel controlId="contactName" label="Full Name">
                      <Form.Control
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Full Name"
                        required
                      />
                    </FloatingLabel>
                  </Col>
                  <Col md={6}>
                    <FloatingLabel controlId="contactEmail" label="Email Address">
                      <Form.Control
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Email Address"
                        required
                      />
                    </FloatingLabel>
                  </Col>
                  <Col xs={12}>
                    <FloatingLabel controlId="contactSubject" label="Subject">
                      <Form.Control
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        placeholder="Subject"
                        required
                      />
                    </FloatingLabel>
                  </Col>
                  <Col xs={12}>
                    <FloatingLabel controlId="contactMessage" label="Message">
                      <Form.Control
                        as="textarea"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Message"
                        style={{ height: '120px' }}
                        required
                      />
                    </FloatingLabel>
                  </Col>
                  <Col xs={12}>
                    <Button type="submit" variant="primary" className="w-100" disabled={submitting}>
                      {submitting ? 'Sending...' : 'Send Message'}
                    </Button>
                  </Col>
                </Row>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}
