import { useState } from 'react'
import { Row, Col, Form, Button, FloatingLabel, Alert } from 'react-bootstrap'
import './Register.scss'

type Props = {
  navigate: (to: string) => void
}

export default function Register({ navigate }: Props) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError('')
    setFieldErrors(prev => ({
      ...prev,
      [name]: ''
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const errors: Record<string, string> = {}

    if (!formData.name) {
      errors.name = 'Full name is required'
    }

    if (!formData.email) {
      errors.email = 'Email is required'
    } else if (!emailRegex.test(formData.email)) {
      errors.email = 'Enter a valid email address'
    }

    if (!formData.password) {
      errors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters'
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setError('Please fix the highlighted fields')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('http://localhost:3001/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Registration failed')
        return
      }

      setSuccess('Registration successful! Redirecting to login...')
      setFormData({ name: '', email: '', password: '', confirmPassword: '' })

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (err) {
      setError('Network error. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="register-container">
      <Row className="w-100 h-100 gx-0">
        <Col lg={6} xs={12} className="d-flex align-items-center justify-content-center register-card-col">
          <div className="register-card">
            <div className="register-header">
              <h1>Create Your Account</h1>
              <p>Join Kansara Premier League today</p>
            </div>

            {error && (
              <Alert variant="danger" onClose={() => setError('')} dismissible>
                {error}
              </Alert>
            )}

            {success && (
              <Alert variant="success" onClose={() => setSuccess('')} dismissible>
                {success}
              </Alert>
            )}

            <Form onSubmit={handleSubmit} className="register-form">
              <Form.Group className="mb-3">
                <FloatingLabel
                  controlId="name"
                  label="Full Name"
                >
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Full Name"
                    isInvalid={!!fieldErrors.name}
                    required
                  />
                </FloatingLabel>
                {fieldErrors.name && <div className="field-error">{fieldErrors.name}</div>}
              </Form.Group>

              <Form.Group className="mb-3">
                <FloatingLabel
                  controlId="email"
                  label="Email Address"
                >
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Email Address"
                    isInvalid={!!fieldErrors.email}
                    required
                  />
                </FloatingLabel>
                {fieldErrors.email && <div className="field-error">{fieldErrors.email}</div>}
              </Form.Group>

              <Form.Group className="mb-3">
                <FloatingLabel
                  controlId="password"
                  label="Password"
                >
                  <Form.Control
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Password"
                    isInvalid={!!fieldErrors.password}
                    required
                  />
                </FloatingLabel>
                {fieldErrors.password && <div className="field-error">{fieldErrors.password}</div>}
              </Form.Group>

              <Form.Group className="mb-3">
                <FloatingLabel
                  controlId="confirmPassword"
                  label="Confirm Password"
                >
                  <Form.Control
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm Password"
                    isInvalid={!!fieldErrors.confirmPassword}
                    required
                  />
                </FloatingLabel>
                {fieldErrors.confirmPassword && <div className="field-error">{fieldErrors.confirmPassword}</div>}
              </Form.Group>

              <Form.Group className="mb-3 form-group-checkbox">
                <Form.Check
                  type="checkbox"
                  id="terms"
                  label="I agree to the Terms of Service and Privacy Policy"
                  required
                />
              </Form.Group>

              <Button type="submit" className="submit-btn w-100" disabled={loading}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </Form>

            <div className="form-footer">
              <p>
                Already have an account?{' '}
                <Button
                  variant="link"
                  className="toggle-btn"
                  onClick={() => navigate('/login')}
                >
                  Sign in
                </Button>
              </p>
            </div>
          </div>
        </Col>

        <Col lg={6} className="register-illustration-col d-none d-lg-flex align-items-center justify-content-center">
          <div className="register-illustration">
            <div className="illustration-content">
              <div className="illustration-circle"></div>
              <h2>Join the Community</h2>
              <p>Be part of the cricket revolution</p>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  )
}
