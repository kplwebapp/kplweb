import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Alert, Button, Card, Col, Container, FloatingLabel, Form, Row, Spinner } from 'react-bootstrap'
import { useAuth } from '@/contexts/AuthContext'
import { UNAUTHORIZED_EVENT } from '@/services/api/client'
import { registrationApi, type CricketSkills, type RegistrationForm } from '@/services/api/registrationApi'
import { CRICKET_SELECT_FIELDS } from '@/constants/cricketSkills'
import { formatEventDateRange } from '@/utils/eventDate'
import { loginPathFor } from '@/utils/authRedirect'
import PageShell from '@/components/common/PageShell'
import { usePageTitle } from '@/hooks/usePageTitle'
import './TournamentRegister.scss'

type SkillsDraft = Record<keyof CricketSkills, string>

const EMPTY_SKILLS: SkillsDraft = {
  batting_style: '',
  bowling_style: '',
  is_wicketkeeper: '',
  tshirt_size: '',
  trouser_size: '',
  tshirt_number: '',
}

const toDraft = (skills: RegistrationForm['skills']): SkillsDraft => {
  const draft = { ...EMPTY_SKILLS }
  for (const key of Object.keys(draft) as (keyof SkillsDraft)[]) {
    const value = skills?.[key]
    if (value != null) draft[key] = String(value)
  }
  return draft
}

const formatDate = (value: string | null | undefined) => {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function ReadonlyField({ id, label, value }: { id: string; label: string; value: string | null | undefined }) {
  return (
    <FloatingLabel controlId={id} label={label}>
      <Form.Control type="text" value={value || '—'} readOnly className="tournament-register__readonly" />
    </FloatingLabel>
  )
}

type Loaded = { slug: string; form: RegistrationForm | null; error: string }

export default function TournamentRegister() {
  const { slug = '' } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, logout } = useAuth()
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [draft, setDraft] = useState<SkillsDraft>(EMPTY_SKILLS)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [showErrors, setShowErrors] = useState(false)
  const [saved, setSaved] = useState<{ created: boolean } | null>(null)

  useEffect(() => {
    const expired = () => {
      logout()
      navigate(loginPathFor(location.pathname), { replace: true })
    }
    window.addEventListener(UNAUTHORIZED_EVENT, expired)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, expired)
  }, [logout, navigate, location.pathname])

  useEffect(() => {
    if (!isAuthenticated) return
    let cancelled = false
    registrationApi
      .getForm(slug)
      .then((res) => {
        if (cancelled) return
        setLoaded({ slug, form: res.data, error: '' })
        setDraft(toDraft(res.data.skills))
      })
      .catch((err) => {
        if (!cancelled) setLoaded({ slug, form: null, error: err instanceof Error ? err.message : 'Failed to load.' })
      })
    return () => { cancelled = true }
  }, [slug, isAuthenticated])

  usePageTitle('Tournament Registration')

  if (!isAuthenticated) return <Navigate to={loginPathFor(location.pathname)} replace />

  const tournamentLink = `/tournaments/${slug}`

  if (loaded?.slug !== slug) {
    return (
      <PageShell title="Tournament Registration" showHeading={false}>
        <div className="text-center py-4"><Spinner animation="border" /></div>
      </PageShell>
    )
  }

  const { form } = loaded
  if (!form) {
    return (
      <PageShell title="Tournament Registration">
        <Alert variant="warning">{loaded.error}</Alert>
        <Link to={tournamentLink} className="btn btn-outline-primary btn-sm">Back to tournament</Link>
      </PageShell>
    )
  }

  const { tournament, personal, registration, is_open: isOpen } = form
  const meta = [formatEventDateRange(tournament.event_date, tournament.end_date), tournament.venue]
    .filter(Boolean)
    .join(' · ')

  const setField = (key: keyof SkillsDraft, value: string) => {
    setDraft((prev) => ({ ...prev, [key]: value }))
    setSaveError('')
  }

  const missing = (key: keyof SkillsDraft) => showErrors && !draft[key].trim()

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const firstMissing = (Object.keys(draft) as (keyof SkillsDraft)[]).find((key) => !draft[key].trim())
    if (firstMissing) {
      setShowErrors(true)
      setSaveError('')
      const field = e.currentTarget.querySelector<HTMLElement>(`#reg-${firstMissing}`)
      field?.scrollIntoView({ block: 'center' })
      field?.focus({ preventScroll: true })
      return
    }
    setSaving(true)
    setSaveError('')
    try {
      const res = await registrationApi.register(slug, { ...draft, tshirt_number: Number(draft.tshirt_number) })
      setSaved({ created: res.data.created })
      setLoaded({ slug, error: '', form: { ...form, skills: res.data.skills, registration: res.data.registration } })
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Registration failed. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (saved) {
    return (
      <Container as="section" className="tournament-register py-5">
        <Card className="border-0 shadow-sm text-center tournament-register__done">
          <Card.Body className="p-5">
            <div className="tournament-register__done-icon" aria-hidden="true">✓</div>
            <h2 className="mb-2">{saved.created ? "You're registered!" : 'Registration updated'}</h2>
            <p className="text-muted mb-4">
              {saved.created
                ? `Your registration for ${tournament.title} has been received.`
                : `Your details for ${tournament.title} have been saved.`}{' '}
              Your cricketing skills are also shown on your profile.
            </p>
            <div className="d-flex flex-wrap gap-2 justify-content-center">
              <Link to={tournamentLink} className="btn btn-primary">Back to tournament</Link>
              <Link to="/profile" className="btn btn-outline-primary">View my profile</Link>
            </div>
          </Card.Body>
        </Card>
      </Container>
    )
  }

  return (
    <Container as="section" className="tournament-register py-4">
      <div className="mb-4">
        <Link to={tournamentLink} className="small text-decoration-none">← {tournament.title}</Link>
        <header className="page-heading mt-2">
          <h1 className="page-heading__title">Tournament Registration</h1>
          <p className="page-heading__description">
            {tournament.title}{meta ? ` · ${meta}` : ''}
          </p>
        </header>
      </div>

      {registration && (
        <Alert variant="success">
          You registered for this tournament on <strong>{formatDate(registration.registered_at)}</strong>.
          {isOpen && ' You can update your cricketing details below.'}
        </Alert>
      )}
      {!isOpen && (
        <Alert variant="warning">Registration is closed because this tournament has already started.</Alert>
      )}

      <Form noValidate onSubmit={handleSubmit}>
        <Card className="border-0 shadow-sm mb-4">
          <Card.Body className="p-4">
            <div className="d-flex flex-wrap justify-content-between align-items-baseline gap-2 mb-3">
              <h5 className="mb-0">Personal Details</h5>
              <small className="text-muted">
                From your member profile. To change these, visit <Link to="/profile">My Profile</Link>.
              </small>
            </div>
            <Row className="g-3">
              <Col md={4}><ReadonlyField id="regFirstName" label="First Name" value={personal.first_name} /></Col>
              <Col md={4}><ReadonlyField id="regMiddleName" label="Middle Name" value={personal.middle_name} /></Col>
              <Col md={4}><ReadonlyField id="regLastName" label="Last Name" value={personal.last_name} /></Col>
              <Col md={4}><ReadonlyField id="regVibhaag" label="Vibhaag" value={personal.vibhaag} /></Col>
              <Col md={4}>
                <ReadonlyField id="regDob" label="Date of Birth" value={formatDate(personal.date_of_birth)} />
              </Col>
              <Col md={4}><ReadonlyField id="regMobile" label="Mobile Number" value={personal.mobile} /></Col>
              <Col md={8}><ReadonlyField id="regEmail" label="Email Address" value={personal.email} /></Col>
            </Row>
          </Card.Body>
        </Card>

        <Card className="border-0 shadow-sm mb-4">
          <Card.Body className="p-4">
            <h5 className="mb-3">Cricketing Skills</h5>
            <fieldset disabled={!isOpen || saving}>
              <Row className="g-3">
                {CRICKET_SELECT_FIELDS.map((field) => (
                  <Col md={4} key={field.key}>
                    <FloatingLabel controlId={`reg-${field.key}`} label={`${field.label} *`}>
                      <Form.Select
                        value={draft[field.key]}
                        onChange={(e) => setField(field.key, e.target.value)}
                        isInvalid={missing(field.key)}
                        required
                      >
                        <option value="">Select…</option>
                        {field.options.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {field.key === 'is_wicketkeeper'
                          ? 'Please select Yes or No.'
                          : `Please select ${field.label.toLowerCase()}.`}
                      </Form.Control.Feedback>
                    </FloatingLabel>
                  </Col>
                ))}
                <Col md={4}>
                  <FloatingLabel controlId="reg-tshirt_number" label="T-shirt Number *">
                    <Form.Control
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={999}
                      step={1}
                      placeholder="T-shirt Number"
                      value={draft.tshirt_number}
                      onChange={(e) => setField('tshirt_number', e.target.value.replace(/\D/g, '').slice(0, 3))}
                      isInvalid={missing('tshirt_number')}
                      required
                    />
                    <Form.Control.Feedback type="invalid">Please enter your t-shirt number.</Form.Control.Feedback>
                  </FloatingLabel>
                </Col>
              </Row>
            </fieldset>
          </Card.Body>
        </Card>

        {showErrors && Object.values(draft).some((v) => !v.trim()) && (
          <Alert variant="danger">Please fill in the fields highlighted in red.</Alert>
        )}
        {saveError && <Alert variant="danger">{saveError}</Alert>}

        {isOpen && (
          <div className="d-flex flex-wrap gap-2">
            <Button type="submit" variant="primary" size="lg" disabled={saving}>
              {saving ? 'Saving…' : registration ? 'Update Registration' : 'Register Now'}
            </Button>
            <Link to={tournamentLink} className="btn btn-outline-secondary btn-lg">Cancel</Link>
          </div>
        )}
      </Form>
    </Container>
  )
}
