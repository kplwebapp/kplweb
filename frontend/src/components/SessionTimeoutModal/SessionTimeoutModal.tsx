import { Modal, Button } from 'react-bootstrap'
import { SESSION_IDLE_MINUTES } from '@/hooks/useIdleSession'
import './SessionTimeoutModal.css'

type Props = {
  show: boolean
  secondsLeft: number
  onStay: () => void
  onSignOut: () => void
}

function formatCountdown(totalSeconds: number) {
  const s = Math.max(0, totalSeconds)
  const m = Math.floor(s / 60)
  const r = s % 60
  return m > 0 ? `${m}:${String(r).padStart(2, '0')}` : `${r}s`
}

/** Asks whether to stay signed in shortly before idle timeout. */
export default function SessionTimeoutModal({ show, secondsLeft, onStay, onSignOut }: Props) {
  return (
    <Modal
      show={show}
      backdrop="static"
      keyboard={false}
      centered
      className="session-timeout-modal"
      aria-labelledby="session-timeout-title"
    >
      <Modal.Body className="text-center p-4">
        <div className="session-timeout-modal__art" aria-hidden="true">
          <svg viewBox="0 0 120 90" width="96" height="72">
            <circle cx="60" cy="42" r="28" fill="#fef3c7" stroke="#d97706" strokeWidth="3" />
            <circle cx="60" cy="42" r="3" fill="#92400e" />
            <line x1="60" y1="42" x2="60" y2="24" stroke="#92400e" strokeWidth="3" strokeLinecap="round" />
            <line x1="60" y1="42" x2="74" y2="48" stroke="#b45309" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
        <h5 id="session-timeout-title" className="mb-2">
          Still there?
        </h5>
        <p className="text-muted small mb-3">
          Your session will expire after {SESSION_IDLE_MINUTES} minutes of inactivity. Stay logged in to keep working,
          or you will be signed out automatically.
        </p>
        <div className="session-timeout-modal__countdown mb-4" aria-live="polite">
          Signing out in <strong>{formatCountdown(secondsLeft)}</strong>
        </div>
        <div className="d-flex flex-column flex-sm-row gap-2 justify-content-center">
          <Button variant="primary" onClick={onStay}>
            Stay logged in
          </Button>
          <Button variant="outline-secondary" onClick={onSignOut}>
            Sign out
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  )
}
