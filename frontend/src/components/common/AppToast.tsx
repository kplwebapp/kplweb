import { Toast, ToastContainer } from 'react-bootstrap'
import './AppToast.scss'

type Props = {
  show: boolean
  onClose: () => void
  message: string
  variant?: 'success' | 'danger' | 'info' | 'warning'
  delay?: number
}

export default function AppToast({
  show,
  onClose,
  message,
  variant = 'success',
  delay = 4000,
}: Props) {
  const lightText = variant === 'success' || variant === 'danger'

  return (
    <ToastContainer position="top-end" className="app-toast-container">
      <Toast bg={variant} onClose={onClose} show={show} delay={delay} autohide>
        <Toast.Body className={lightText ? 'text-white' : undefined}>{message}</Toast.Body>
      </Toast>
    </ToastContainer>
  )
}
