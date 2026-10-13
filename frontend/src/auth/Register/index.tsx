import { useState } from 'react'
import { Form, Button, FloatingLabel, Alert, Row, Col } from 'react-bootstrap'
import LoginRegisterLayout from '../../layouts/LoginRegisterLayout'
import { VIBHAAG_OPTIONS, BLOOD_GROUP_OPTIONS } from '@/constants/profileOptions'
import './Register.scss'

type Props = {
  navigate: (to: string) => void
}

type FormData = {
  firstName: string
  middleName: string
  lastName: string
  email: string
  mobile: string
  dateOfBirth: string
  vibhaag: string
  bloodGroup: string
  password: string
  confirmPassword: string
}

const FORM_FIELDS: (keyof FormData)[] = [
  'firstName',
  'middleName',
  'lastName',
  'email',
  'mobile',
  'dateOfBirth',
  'vibhaag',
  'bloodGroup',
  'password',
  'confirmPassword',
]

export default function Register({ navigate }: Props) {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    mobile: '',
    dateOfBirth: '',
    vibhaag: '',
    bloodGroup: '',
    password: '',
    confirmPassword: '',
  })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const mobileRegex = /^[0-9+\-\s()]{7,15}$/

  const getPasswordErrors = (value: string): string[] => {
    const errors: string[] = []
    if (!value) return ['Password is required']
    if (!/[a-z]/.test(value)) errors.push('at least 1 lowercase letter')
    if (!/[A-Z]/.test(value)) errors.push('at least 1 uppercase letter')
    if (!/\d/.test(value)) errors.push('at least 1 number')
    if (!/[@$!%*?&]/.test(value)) errors.push('at least 1 special character (@$!%*?&)')
    if (value.length < 8) errors.push('at least 8 characters')
    return errors
  }

  const validateField = (
    name: keyof FormData | 'terms',
    value: string,
    data: FormData = formData
  ): Record<string, string> => {
    const errors: Record<string, string> = {}

    if (name === 'firstName' && !value.trim()) {
      errors.firstName = 'First name is required'
    } else if (name === 'middleName' && !value.trim()) {
      errors.middleName = 'Middle name is required'
    } else if (name === 'lastName' && !value.trim()) {
      errors.lastName = 'Last name is required'
    } else if (name === 'email') {
      if (!value.trim()) {
        errors.email = 'Email is required'
      } else if (!emailRegex.test(value)) {
        errors.email = 'Enter a valid email address'
      }
    } else if (name === 'mobile') {
      if (!value.trim()) {
        errors.mobile = 'Mobile number is required'
      } else if (!mobileRegex.test(value)) {
        errors.mobile = 'Enter a valid mobile number'
      }
    } else if (name === 'dateOfBirth' && !value) {
      errors.dateOfBirth = 'Date of birth is required'
    } else if (name === 'vibhaag' && !value) {
      errors.vibhaag = 'Vibhaag is required'
    } else if (name === 'bloodGroup' && !value) {
      errors.bloodGroup = 'Blood group is required'
    } else if (name === 'password') {
      const passwordErrors = getPasswordErrors(value)
      if (passwordErrors.length > 0) {
        errors.password = `Password must contain ${passwordErrors.join(', ')}`
      }
    } else if (name === 'confirmPassword') {
      if (!value) {
        errors.confirmPassword = 'Confirm your password'
      } else if (value !== data.password) {
        errors.confirmPassword = 'Passwords do not match'
      }
    } else if (name === 'terms' && value !== 'true') {
      errors.terms = 'You must agree to the Terms of Service and Privacy Policy'
    }

    return errors
  }

  const validateAll = (acceptedTerms = termsAccepted) => {
    const errors: Record<string, string> = {}

    for (const field of FORM_FIELDS) {
      Object.assign(errors, validateField(field, formData[field]))
    }

    Object.assign(errors, validateField('terms', acceptedTerms ? 'true' : ''))

    return errors
  }

  const handleChange = (e: { target: { name: string; value: string } }) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    setFieldErrors((prev) => ({ ...prev, [name]: '' }))
    setError('')
  }

  const handleBlur = (
    e: React.FocusEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target
    const newErrors = validateField(name as keyof FormData, value)

    setFieldErrors((prev) => ({
      ...prev,
      ...newErrors,
      ...(name in newErrors ? {} : { [name]: '' }),
    }))
  }

  const handleTermsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked
    setTermsAccepted(checked)
    setFieldErrors((prev) => ({ ...prev, terms: '' }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const errors = validateAll()
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setLoading(true)

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
      const response = await fetch(`${apiUrl}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          middleName: formData.middleName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim(),
          mobile: formData.mobile.trim(),
          dateOfBirth: formData.dateOfBirth,
          vibhaag: formData.vibhaag,
          bloodGroup: formData.bloodGroup,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || data.error || 'Registration failed')
        return
      }

      navigate('/thank-you')
    } catch (err) {
      setError('Network error. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <LoginRegisterLayout
      title="Create Your Account"
      subtitle="Join Kansara Premier League today"
      illustrationTitle="Join the Community"
      illustrationSubtitle="Be part of the cricket revolution"
      navigate={navigate}
    >
      {error && (
        <Alert variant="danger" onClose={() => setError('')} dismissible>
          {error}
        </Alert>
      )}

      <Form onSubmit={handleSubmit} className="register-form" noValidate>
        <Row className="g-3">
          <Col md={12}>
            <Form.Group>
              <FloatingLabel controlId="firstName" label="First Name">
                <Form.Control
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="First Name"
                  isInvalid={!!fieldErrors.firstName}
                />
              </FloatingLabel>
              {fieldErrors.firstName && <div className="field-error">{fieldErrors.firstName}</div>}
            </Form.Group>
          </Col>
          <Col md={12}>
            <Form.Group>
              <FloatingLabel controlId="middleName" label="Middle Name">
                <Form.Control
                  type="text"
                  name="middleName"
                  value={formData.middleName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Middle Name"
                  isInvalid={!!fieldErrors.middleName}
                />
              </FloatingLabel>
              {fieldErrors.middleName && <div className="field-error">{fieldErrors.middleName}</div>}
            </Form.Group>
          </Col>
          <Col md={12}>
            <Form.Group>
              <FloatingLabel controlId="lastName" label="Last Name">
                <Form.Control
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Last Name"
                  isInvalid={!!fieldErrors.lastName}
                />
              </FloatingLabel>
              {fieldErrors.lastName && <div className="field-error">{fieldErrors.lastName}</div>}
            </Form.Group>
          </Col>
        </Row>

        <Form.Group className="mb-3 mt-3">
          <FloatingLabel controlId="email" label="Email Address">
            <Form.Control
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Email Address"
              isInvalid={!!fieldErrors.email}
            />
          </FloatingLabel>
          {fieldErrors.email && <div className="field-error">{fieldErrors.email}</div>}
        </Form.Group>

        <Row className="g-3 mb-3">
          <Col md={12}>
            <Form.Group>
              <FloatingLabel controlId="mobile" label="Mobile Number">
                <Form.Control
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Mobile Number"
                  isInvalid={!!fieldErrors.mobile}
                />
              </FloatingLabel>
              {fieldErrors.mobile && <div className="field-error">{fieldErrors.mobile}</div>}
            </Form.Group>
          </Col>
          <Col md={12}>
            <Form.Group>
              <FloatingLabel controlId="dateOfBirth" label="Date of Birth">
                <Form.Control
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Date of Birth"
                  isInvalid={!!fieldErrors.dateOfBirth}
                />
              </FloatingLabel>
              {fieldErrors.dateOfBirth && <div className="field-error">{fieldErrors.dateOfBirth}</div>}
            </Form.Group>
          </Col>
        </Row>

        <Row className="g-3 mb-3">
          <Col md={12}>
            <Form.Group>
              <FloatingLabel controlId="vibhaag" label="Vibhaag">
                <Form.Select
                  name="vibhaag"
                  value={formData.vibhaag}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  aria-label="Vibhaag"
                  isInvalid={!!fieldErrors.vibhaag}
                >
                  <option value="">Select Vibhaag</option>
                  {VIBHAAG_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Form.Select>
              </FloatingLabel>
              {fieldErrors.vibhaag && <div className="field-error">{fieldErrors.vibhaag}</div>}
            </Form.Group>
          </Col>
          <Col md={12}>
            <Form.Group>
              <FloatingLabel controlId="bloodGroup" label="Blood Group">
                <Form.Select
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  aria-label="Blood Group"
                  isInvalid={!!fieldErrors.bloodGroup}
                >
                  <option value="">Select Blood Group</option>
                  {BLOOD_GROUP_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Form.Select>
              </FloatingLabel>
              {fieldErrors.bloodGroup && <div className="field-error">{fieldErrors.bloodGroup}</div>}
            </Form.Group>
          </Col>
        </Row>

        <Form.Group className="mb-3">
          <FloatingLabel controlId="password" label="Password">
            <Form.Control
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Password"
              isInvalid={!!fieldErrors.password}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </FloatingLabel>
          {fieldErrors.password && <div className="field-error">{fieldErrors.password}</div>}
        </Form.Group>

        <Form.Group className="mb-3">
          <FloatingLabel controlId="confirmPassword" label="Confirm Password">
            <Form.Control
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Confirm Password"
              isInvalid={!!fieldErrors.confirmPassword}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              tabIndex={-1}
            >
              {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </FloatingLabel>
          {fieldErrors.confirmPassword && (
            <div className="field-error">{fieldErrors.confirmPassword}</div>
          )}
        </Form.Group>

        <Form.Group className="mb-3 form-group-checkbox">
          <Form.Check
            type="checkbox"
            id="terms"
            checked={termsAccepted}
            onChange={handleTermsChange}
            isInvalid={!!fieldErrors.terms}
            label="I agree to the Terms of Service and Privacy Policy"
          />
          {fieldErrors.terms && <div className="field-error">{fieldErrors.terms}</div>}
        </Form.Group>

        <Button type="submit" className="submit-btn w-100" disabled={loading}>
          {loading ? 'Creating Account...' : 'Create Account'}
        </Button>
      </Form>

      <div className="form-footer">
        <p>
          Already have an account?{' '}
          <Button variant="link" className="toggle-btn" onClick={() => navigate('/login')}>
            Sign in
          </Button>
        </p>
      </div>
    </LoginRegisterLayout>
  )
}
