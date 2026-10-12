import { useEffect, useState } from 'react'
import { Button, Alert } from 'react-bootstrap'
import LoginRegisterLayout from '../../layouts/LoginRegisterLayout'
import './Logout.scss'

type Props = {
  navigate: (to: string) => void
}

export default function Logout({ navigate }: Props) {
  const [secondsLeft, setSecondsLeft] = useState(5)

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          navigate('/')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [navigate])

  return (
    <LoginRegisterLayout
      title="Signed Out"
      subtitle="You have been logged out successfully"
      illustrationTitle="See You Soon"
      illustrationSubtitle="Thanks for visiting Kansara Premier League"
    >
      <div className="logout-content text-center">
        <div className="logout-icon" aria-hidden="true">
          ✓
        </div>
        <Alert variant="info" className="mb-4">
          Your session has ended. Sign in again anytime to access your profile and league updates.
        </Alert>
        <p className="logout-countdown">
          Redirecting to homepage in <strong>{secondsLeft}</strong> second{secondsLeft !== 1 ? 's' : ''}...
        </p>
        <Button variant="primary" className="submit-btn w-100" onClick={() => navigate('/')}>
          Go to Homepage Now
        </Button>
      </div>
    </LoginRegisterLayout>
  )
}
