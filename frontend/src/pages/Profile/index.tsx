import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  FloatingLabel,
  Spinner,
  Modal,
} from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPen } from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '@/contexts/AuthContext'
import {
  profileApi,
  getProfilePhotoUrl,
  handleProfilePhotoError,
  type MemberProfile,
  type ProfileChangeRequest,
} from '@/services/api/profileApi'
import { VIBHAAG_OPTIONS } from '@/constants/profileOptions'
import AppToast from '@/components/common/AppToast'
import CricketSkillsCard from './CricketSkillsCard'
import './Profile.scss'

const ALLOWED_PROFILE_PHOTO_TYPES = ['image/jpeg', 'image/png'] as const
const ALLOWED_PROFILE_PHOTO_EXTENSIONS = ['.jpg', '.jpeg', '.png'] as const
const PROFILE_PHOTO_FORMAT_ERROR = 'Only JPG, JPEG, and PNG image files are allowed.'

function isAllowedProfilePhoto(file: File): boolean {
  const extension = file.name.includes('.')
    ? file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
    : ''
  const typeAllowed = (ALLOWED_PROFILE_PHOTO_TYPES as readonly string[]).includes(file.type)
  const extensionAllowed = (ALLOWED_PROFILE_PHOTO_EXTENSIONS as readonly string[]).includes(extension)
  return typeAllowed && extensionAllowed
}

function toAuthUser(profile: MemberProfile) {
  return {
    user_id: profile.user_id,
    email: profile.email,
    full_name: profile.full_name,
    first_name: profile.first_name,
    last_name: profile.last_name,
    profile_photo_url: profile.profile_photo_url,
    roles: profile.roles,
  }
}

function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

type DetailField = {
  label: string
  value: string
}

function DetailItem({ label, value }: DetailField) {
  return (
    <Col sm={6} md={4}>
      <div className="profile-field">
        <span className="profile-field__label">{label}</span>
        <span className="profile-field__value">{value || '—'}</span>
      </div>
    </Col>
  )
}

function ReadonlyFloatingField({
  id,
  label,
  value,
}: {
  id: string
  label: string
  value: string
}) {
  return (
    <FloatingLabel controlId={id} label={label} className="profile-floating-readonly">
      <Form.Control
        type="text"
        value={value || '—'}
        readOnly
        plaintext
        className="profile-floating-readonly__control"
      />
    </FloatingLabel>
  )
}

export default function Profile() {
  const { updateUser } = useAuth()
  const [profile, setProfile] = useState<MemberProfile | null>(null)
  const [editVibhaag, setEditVibhaag] = useState('')
  const [pendingChanges, setPendingChanges] = useState<ProfileChangeRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState<{ show: boolean; message: string; variant: 'success' | 'danger' }>({
    show: false,
    message: '',
    variant: 'success',
  })
  const [showEditModal, setShowEditModal] = useState(false)
  const [showOtpModal, setShowOtpModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [otp, setOtp] = useState('')
  const [pendingVibhaag, setPendingVibhaag] = useState('')
  const [photoVersion, setPhotoVersion] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadProfile = async () => {
    setLoading(true)
    setError('')
    try {
      const [profileRes, pendingRes] = await Promise.all([
        profileApi.get(),
        profileApi.getPendingChanges(),
      ])
      const data = profileRes.data
      setProfile(data)
      setEditVibhaag(data.vibhaag || '')
      setPendingChanges(pendingRes.data)
      updateUser(toAuthUser(data))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
  }, [updateUser])

  const pendingVibhaagRequest = pendingChanges.find(
    (r) => r.field_name === 'vibhaag' && r.status === 'PENDING'
  )

  const openEditModal = () => {
    setEditVibhaag(profile?.vibhaag || '')
    setError('')
    setShowEditModal(true)
  }

  const closeEditModal = () => {
    setShowEditModal(false)
    setEditVibhaag(profile?.vibhaag || '')
  }

  const handleSubmitVibhaagChange = async (e: FormEvent) => {
    e.preventDefault()
    if (!editVibhaag) return
    if (pendingVibhaagRequest) {
      setError('You already have a pending vibhaag change awaiting admin review.')
      return
    }
    if ((profile?.vibhaag || '') === editVibhaag) {
      setShowEditModal(false)
      return
    }

    setSubmitting(true)
    setError('')
    try {
      await profileApi.initiateVibhaagChange(editVibhaag)
      setPendingVibhaag(editVibhaag)
      setOtp('')
      setShowEditModal(false)
      setShowOtpModal(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start verification')
    } finally {
      setSubmitting(false)
    }
  }

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault()
    if (!otp.trim()) return

    setVerifying(true)
    setError('')
    try {
      const response = await profileApi.verifyOtp({ vibhaag: pendingVibhaag, otp: otp.trim() })
      setPendingChanges((prev) => [
        response.data,
        ...prev.filter((r) => r.request_id !== response.data.request_id),
      ])
      setShowOtpModal(false)
      setShowSuccessModal(true)
      setOtp('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setVerifying(false)
    }
  }

  const handleOtpModalClose = () => {
    setShowOtpModal(false)
    setOtp('')
    setEditVibhaag(profile?.vibhaag || '')
  }

  const handlePhotoSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!isAllowedProfilePhoto(file)) {
      setToast({
        show: true,
        message: PROFILE_PHOTO_FORMAT_ERROR,
        variant: 'danger',
      })
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setUploading(true)
    try {
      const response = await profileApi.uploadPhoto(file)
      const photoUrl = response.data.profile_photo_url
      setProfile((prev) => {
        if (!prev) return prev
        const nextProfile = { ...prev, profile_photo_url: photoUrl }
        updateUser(toAuthUser(nextProfile))
        return nextProfile
      })
      setPhotoVersion((v) => v + 1)
      setToast({
        show: true,
        message: 'Profile photo updated successfully.',
        variant: 'success',
      })
    } catch (err) {
      setToast({
        show: true,
        message: err instanceof Error ? err.message : 'Failed to upload photo',
        variant: 'danger',
      })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const photoUrl = getProfilePhotoUrl(profile?.profile_photo_url, photoVersion)

  if (loading) {
    return (
      <Container className="profile-page py-5 text-center">
        <Spinner animation="border" role="status" />
        <p className="mt-3 text-muted">Loading your profile...</p>
      </Container>
    )
  }

  return (
    <Container as="section" className="profile-page py-4">
      <div className="profile-page-header mb-4">
        <h2 className="mb-1">My Profile</h2>
        <p className="text-muted mb-0">
          View your member details and cricketing skills.
        </p>
      </div>

      {error && !showEditModal && !showOtpModal && <Alert variant="danger">{error}</Alert>}

      <AppToast
        show={toast.show}
        message={toast.message}
        variant={toast.variant}
        onClose={() => setToast((prev) => ({ ...prev, show: false }))}
      />

      {pendingVibhaagRequest && (
        <Alert variant="info">
          Pending vibhaag change: <strong>{pendingVibhaagRequest.old_value || '—'}</strong>
          {' → '}
          <strong>{pendingVibhaagRequest.new_value}</strong> (awaiting admin review)
        </Alert>
      )}

      <Card className="shadow-sm border-0 profile-main-card mb-4">
        <Card.Body className="p-4">
          <Row className="g-4">
            <Col md={4} lg={3} className="profile-main-card__photo">
              <h5 className="mb-3">Profile Photo</h5>
              <div className="profile-photo-wrap">
                <img
                  key={`${profile?.profile_photo_url ?? 'default'}-${photoVersion}`}
                  src={photoUrl}
                  alt="Profile"
                  className="profile-photo"
                  onError={handleProfilePhotoError}
                />
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                className="photo-upload-input"
                onChange={handlePhotoSelect}
              />
              <Button
                variant="outline-primary"
                size="sm"
                className="photo-upload-btn"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? 'Uploading...' : 'Change Photo'}
              </Button>
            </Col>

            <Col md={8} lg={9} className="profile-main-card__details">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Personal Details</h5>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={openEditModal}
                  disabled={!!pendingVibhaagRequest}
                >
                  <FontAwesomeIcon icon={faPen} className="me-2" />
                  Edit
                </Button>
              </div>

              <Row className="g-3">
                <DetailItem label="First Name" value={profile?.first_name || ''} />
                <DetailItem label="Middle Name" value={profile?.middle_name || ''} />
                <DetailItem label="Last Name" value={profile?.last_name || ''} />
                <DetailItem label="Mobile Number" value={profile?.mobile || ''} />
                <DetailItem label="Email Address" value={profile?.email || ''} />
                <DetailItem label="Vibhaag" value={profile?.vibhaag || ''} />
                <DetailItem label="Blood Group" value={profile?.blood_group || ''} />
                <DetailItem label="Date of Birth" value={formatDate(profile?.date_of_birth)} />
              </Row>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <CricketSkillsCard />

      <Modal size='lg' show={showEditModal} onHide={closeEditModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Personal Details</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmitVibhaagChange}>
          <Modal.Body>
            <p className="text-muted small">
              Only vibhaag can be updated here. Other details are managed by the admin. Vibhaag
              changes require OTP verification and admin approval.
            </p>
            <hr />
            {error && <Alert variant="danger">{error}</Alert>}
            <Row className="g-3">
              <Col sm={6}>
                <ReadonlyFloatingField
                  id="editFirstName"
                  label="First Name"
                  value={profile?.first_name || ''}
                />
              </Col>
              <Col sm={6}>
                <ReadonlyFloatingField
                  id="editLastName"
                  label="Last Name"
                  value={profile?.last_name || ''}
                />
              </Col>
              <Col sm={6}>
                <ReadonlyFloatingField
                  id="editEmail"
                  label="Email Address"
                  value={profile?.email || ''}
                />
              </Col>
              <Col sm={6}>
                <ReadonlyFloatingField
                  id="editMobile"
                  label="Mobile Number"
                  value={profile?.mobile || ''}
                />
              </Col>
              <Col xs={6}>
                <FloatingLabel controlId="editVibhaag" label="Vibhaag">
                  <Form.Select
                    name="vibhaag"
                    value={editVibhaag}
                    onChange={(e) => setEditVibhaag(e.target.value)}
                    aria-label="Vibhaag"
                    required
                  >
                    <option value="">Select Vibhaag</option>
                    {VIBHAAG_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </Form.Select>
                </FloatingLabel>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closeEditModal}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Sending OTP...' : 'Submit Change'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal show={showOtpModal} onHide={handleOtpModalClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>Verify Your Identity</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleVerifyOtp}>
          <Modal.Body>
            <p className="text-muted">
              A verification code has been sent to your registered email and mobile number. Enter
              the code below to submit your vibhaag change for admin review.
            </p>
            {error && <Alert variant="danger">{error}</Alert>}
            <FloatingLabel controlId="otp" label="Verification Code">
              <Form.Control
                type="text"
                inputMode="numeric"
                maxLength={6}
                pattern="\d{6}"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="Verification Code"
                required
                autoFocus
              />
            </FloatingLabel>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleOtpModalClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={verifying}>
              {verifying ? 'Verifying...' : 'Verify & Submit'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal show={showSuccessModal} onHide={() => setShowSuccessModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Change Submitted</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-0">Your changes have been sent for review.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => setShowSuccessModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  )
}
