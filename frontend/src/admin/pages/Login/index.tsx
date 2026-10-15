import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { Alert, Button, Card, Col, Container, Form, Row } from 'react-bootstrap'
import { authApi } from '@/services/api/authApi'
import { ADMIN_BASE } from '@/admin/config/sidebar'
import { adminSession } from '@/utils/adminSession'

export default function LoginPage() {
  if (adminSession.getToken()) return <Navigate to={ADMIN_BASE} replace />
  return <LoginForm />
}

function LoginForm() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const sessionEnded = searchParams.get('expired') === '1'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await authApi.adminLogin(email, password)
      adminSession.save(res.data.accessToken, res.data.refreshToken, res.data.user)
      navigate(ADMIN_BASE, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to connect to API. Check backend is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-login-page d-flex align-items-center">
      <Container>
        <Row className="justify-content-center">
          <Col sm={10} md={6} lg={4}>
            <Card className="border-0 shadow">
              <Card.Body className="p-4">
                <h4 className="mb-1">KPL Admin</h4>
                <p className="text-muted small mb-4">
                  Sign in with an admin account. This is separate from the member login on the website.
                </p>

                {sessionEnded && !error && (
                  <Alert variant="warning" className="small">
                    Your admin session has ended. Please sign in again.
                  </Alert>
                )}
                {error && <Alert variant="danger">{error}</Alert>}

                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </Form.Group>
                  <Button type="submit" variant="primary" className="w-100" disabled={loading}>
                    {loading ? 'Signing in…' : 'Sign In'}
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  )
}
