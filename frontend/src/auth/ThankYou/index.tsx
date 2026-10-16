import { useEffect, useState } from 'react'
import { Button, Alert } from 'react-bootstrap'
import LoginRegisterLayout from '../../layouts/LoginRegisterLayout'
import './ThankYou.scss'

type Props = {
  navigate: (to: string) => void
}

export default function ThankYou({ navigate }: Props) {
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
      title="Thank You"
      subtitle="Your account has been created successfully"
      illustrationTitle="Welcome to KPL"
      illustrationSubtitle="You're now part of the Kansara Premier League community"
    >
      <div className="thank-you-content text-center">
        <Alert variant="success" className="mb-4">
          Registration completed successfully. You can sign in anytime to manage your profile and join league activities.
        </Alert>
        <p className="thank-you-countdown">
          Redirecting to homepage in <strong>{secondsLeft}</strong> second{secondsLeft !== 1 ? 's' : ''}...
        </p>
        <Button variant="primary" className="submit-btn w-100" onClick={() => navigate('/')}>
          Go to Homepage Now
        </Button>
      </div>
    </LoginRegisterLayout>
  )
}
