import { useState } from 'react'
import { Row, Col, Form, Button, FloatingLabel, Alert } from 'react-bootstrap'
import './Login.scss'

type Props = {
  navigate: (to: string) => void
}

export default function Login({ navigate }: Props) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const errors: Record<string, string> = {}

    if (!formData.email) {
      errors.email = 'Email is required'
    } else if (!emailRegex.test(formData.email)) {
      errors.email = 'Enter a valid email address'
    }

    if (!formData.password) {
      errors.password = 'Password is required'
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setError('Please fix the highlighted fields')
      return
    }

    console.log('Login', formData)
    // Add your login logic here
  }

  return (
    <div className="login-container">
      <Row className="w-100 h-100 gx-0">
        <Col lg={6} xs={12} className="d-flex align-items-center justify-content-center login-card-col">
          <div className="login-card">
            <div className="login-header">
              <h1>Welcome Back</h1>
              <p>Sign in to your account</p>
            </div>

            <Form onSubmit={handleSubmit} className="login-form">
              {error && (
                <Alert variant="danger" onClose={() => setError('')} dismissible>
                  {error}
                </Alert>
              )}
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

              <Form.Group className="mb-3 form-group-checkbox">
                <Form.Check
                  type="checkbox"
                  id="remember"
                  label="Remember me"
                />
              </Form.Group>

              <Button type="submit" className="submit-btn w-100">
                Sign In
              </Button>
            </Form>

            <div className="form-footer">
              <p>
                Don't have an account?{' '}
                <Button
                  variant="link"
                  className="toggle-btn"
                  onClick={() => navigate('/register')}
                >
                  Sign up
                </Button>
              </p>
              <Button variant="link" className="forgot-password-btn">
                Forgot password?
              </Button>
            </div>
          </div>
        </Col>

        <Col lg={6} className="login-illustration-col d-none d-lg-flex align-items-center justify-content-center">
          <div className="login-illustration">
            <div className="illustration-content">
              <div className="illustration-circle"></div>
              <h2>Kansara Premier League</h2>
              <p>Sign in to manage your profile</p>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  )
}
