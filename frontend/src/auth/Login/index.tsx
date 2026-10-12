import { useState, type ChangeEvent, type FocusEvent, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Form, Button, FloatingLabel, Alert } from 'react-bootstrap'
import LoginRegisterLayout from '../../layouts/LoginRegisterLayout'
import { useAuth } from '../../contexts/AuthContext'
import { getPostLoginPath } from '../../utils/authRedirect'
import './Login.scss'

type Props = {
  navigate: (to: string) => void
}

export default function Login({ navigate }: Props) {
  const { login } = useAuth()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect')
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [validFields, setValidFields] = useState<Record<string, boolean>>({})
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  const validateField = (name: string, value: string) => {
    const errors: Record<string, string> = {}

    if (name === 'email') {
      if (!value) {
        errors.email = 'Email is required'
      } else if (!emailRegex.test(value)) {
        errors.email = 'Enter a valid email address'
      }
    } else if (name === 'password') {
      if (!value) {
        errors.password = 'Password is required'
      }
    }

    return errors
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError('')

    if (name === 'email') {
      setValidFields(prev => ({ ...prev, email: false }))
    }
  }

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const newErrors = validateField(name, value)

    setFieldErrors(prev => {
      const updated = { ...prev }
      if (newErrors[name]) {
        updated[name] = newErrors[name]
      } else {
        delete updated[name]
      }
      return updated
    })

    if (name === 'email' && value && emailRegex.test(value) && !newErrors.email) {
      setValidFields(prev => ({ ...prev, email: true }))
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    setValidFields({})

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
      return
    }

    setLoading(true)

    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        const apiError = data.message || data.error || 'Login failed'

        if (
          apiError.includes('pending approval') ||
          apiError.includes('pending administrator approval')
        ) {
          setError(apiError)
        } else if (apiError === 'Invalid email or password' && emailRegex.test(formData.email)) {
          setValidFields({ email: true })
          setFieldErrors({ password: "Password doesn't match" })
        } else if (apiError === 'Please enter the registered email address') {
          setFieldErrors({ email: 'Please enter the registered email address' })
          setValidFields({})
        } else {
          setError(apiError)
        }
        return
      }

      setValidFields({ email: true })

      const accessToken = data.data?.accessToken ?? data.accessToken
      const refreshToken = data.data?.refreshToken ?? data.refreshToken
      const user = data.data?.user ?? data.user

      if (accessToken && refreshToken && user) {
        login(accessToken, refreshToken, user)
        navigate(getPostLoginPath(user.roles, redirect))
        return
      }

      if (accessToken) {
        localStorage.setItem('accessToken', accessToken)
      }
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken)
      }
      if (user) {
        localStorage.setItem('user', JSON.stringify(user))
        navigate(getPostLoginPath(user.roles, redirect))
        return
      }

      navigate('/profile')
    } catch (err) {
      setError('Network error. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <LoginRegisterLayout
      title="Welcome Back"
      subtitle="Sign in to your account"
      illustrationTitle="Kansara Premier League"
      illustrationSubtitle="Sign in to manage your profile"
      navigate={navigate}
    >
      <Form onSubmit={handleSubmit} className="login-form">
        {error && (
          <Alert variant="danger" onClose={() => setError('')} dismissible>
            {error}
          </Alert>
        )}
        <Form.Group className="mb-3">
          <div className="form-floating">
            <Form.Control
              type="email"
              name="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Email Address"
              isInvalid={!!fieldErrors.email}
              isValid={validFields.email && !fieldErrors.email}
              disabled={loading}
              required
            />
            <label htmlFor="email">Email Address</label>
            {validFields.email && !fieldErrors.email && (
              <span className="valid-checkmark" aria-hidden="true">✓</span>
            )}
          </div>
          {fieldErrors.email && <div className="field-error">{fieldErrors.email}</div>}
        </Form.Group>

        <Form.Group className="mb-3">
          <FloatingLabel
            controlId="password"
            label="Password"
          >
            <Form.Control
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Password"
              isInvalid={!!fieldErrors.password}
              disabled={loading}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              disabled={loading}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </FloatingLabel>
          {fieldErrors.password && <div className="field-error">{fieldErrors.password}</div>}
        </Form.Group>

        <Form.Group className="mb-3 form-group-checkbox">
          <Form.Check
            type="checkbox"
            id="remember"
            label="Remember me"
            disabled={loading}
          />
        </Form.Group>

        <Button type="submit" className="submit-btn w-100" disabled={loading}>
          {loading ? 'Signing In...' : 'Sign In'}
        </Button>
      </Form>

      <div className="form-footer">
        <p>
          Don't have an account?{' '}
          <Button
            variant="link"
            className="toggle-btn"
            onClick={() => navigate('/register')}
            disabled={loading}
          >
            Sign up
          </Button>
        </p>
        <Button variant="link" className="forgot-password-btn" disabled={loading}>
          Forgot password?
        </Button>
      </div>
    </LoginRegisterLayout>
  )
}

