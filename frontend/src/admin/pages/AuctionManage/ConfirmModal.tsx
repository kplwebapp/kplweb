import { useState } from 'react'
import { Alert, Button, Form, Modal } from 'react-bootstrap'

export type ConfirmRequest = {
  title: string
  body: React.ReactNode
  confirmLabel: string
  variant?: string
  /** 'required' asks for a reason that is saved in the auction history. */
  reason?: 'required'
  onConfirm: (reason: string) => Promise<boolean>
}

const MIN_REASON = 3

export default function ConfirmModal({ request, onHide }: { request: ConfirmRequest | null; onHide: () => void }) {
  return (
    <Modal show={Boolean(request)} onHide={onHide} centered>
      {request && <ConfirmBody key={request.title} request={request} onHide={onHide} />}
    </Modal>
  )
}

function ConfirmBody({ request, onHide }: { request: ConfirmRequest; onHide: () => void }) {
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [touched, setTouched] = useState(false)
  const needsReason = request.reason === 'required'
  const reasonInvalid = needsReason && reason.trim().length < MIN_REASON

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (reasonInvalid) return
    setBusy(true)
    const ok = await request.onConfirm(reason.trim())
    setBusy(false)
    if (ok) onHide()
  }

  return (
    <Form onSubmit={submit} noValidate>
      <Modal.Header closeButton>
        <Modal.Title as="h5">{request.title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-3">{request.body}</div>
        {needsReason && (
          <Form.Group controlId="confirm-reason">
            <Form.Label>Reason (saved in the auction history)</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              maxLength={500}
              value={reason}
              autoFocus
              isInvalid={touched && reasonInvalid}
              onChange={(e) => setReason(e.target.value)}
            />
            <Form.Control.Feedback type="invalid">Please give a reason.</Form.Control.Feedback>
          </Form.Group>
        )}
        {busy && <Alert variant="light" className="mb-0 mt-3 py-2 small">Working…</Alert>}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onHide} disabled={busy}>Back</Button>
        <Button type="submit" variant={request.variant ?? 'primary'} disabled={busy}>{request.confirmLabel}</Button>
      </Modal.Footer>
    </Form>
  )
}
