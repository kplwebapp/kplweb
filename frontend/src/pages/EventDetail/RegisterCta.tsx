import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge, Button } from 'react-bootstrap'
import { useAuth } from '@/contexts/AuthContext'
import { registrationApi } from '@/services/api/registrationApi'
import type { ActivityStatus } from '@/services/api/activitiesApi'
import { loginPathFor } from '@/utils/authRedirect'

type Props = { slug: string; status: ActivityStatus }

/** "Register Now" for cricket tournaments; signed-out visitors are sent to login first. */
export default function RegisterCta({ slug, status }: Props) {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [registered, setRegistered] = useState<{ slug: string; value: boolean } | null>(null)

  useEffect(() => {
    if (!isAuthenticated || status !== 'UPCOMING') return
    let cancelled = false
    registrationApi
      .getForm(slug)
      .then((res) => { if (!cancelled) setRegistered({ slug, value: !!res.data.registration }) })
      .catch(() => { /* status is a nicety; the button still works */ })
    return () => { cancelled = true }
  }, [slug, status, isAuthenticated])

  if (status === 'PAST') return null
  if (status === 'ONGOING') return <Badge bg="secondary" className="fw-normal">Registrations closed</Badge>

  const registerPath = `/tournaments/${slug}/register`
  const isRegistered = isAuthenticated && registered?.slug === slug && registered.value

  const handleClick = () => navigate(isAuthenticated ? registerPath : loginPathFor(registerPath))

  return (
    <div className="d-flex flex-wrap align-items-center gap-2">
      {isRegistered && <Badge bg="success" className="fw-normal">✓ You're registered</Badge>}
      <Button variant={isRegistered ? 'outline-primary' : 'primary'} onClick={handleClick}>
        {isRegistered ? 'Update Registration' : 'Register Now'}
      </Button>
    </div>
  )
}
