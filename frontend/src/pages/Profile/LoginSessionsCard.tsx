import { useCallback, useEffect, useState } from 'react'
import { Alert, Badge, Button, Card, Spinner } from 'react-bootstrap'
import { authApi, type LoginSession } from '@/services/api/authApi'

const CLIENT_LABEL: Record<string, string> = {
  web: 'Website',
  admin: 'Admin panel',
  mobile: 'Mobile app',
}

function formatWhen(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function deviceHint(session: LoginSession) {
  const ua = session.user_agent || ''
  if (/Mobile|Android|iPhone|iPad/i.test(ua)) return 'Mobile browser'
  if (/Edg\//i.test(ua)) return 'Edge'
  if (/Chrome\//i.test(ua)) return 'Chrome'
  if (/Firefox\//i.test(ua)) return 'Firefox'
  if (/Safari\//i.test(ua)) return 'Safari'
  return ua ? ua.slice(0, 60) : 'Unknown device'
}

export default function LoginSessionsCard() {
  const [sessions, setSessions] = useState<LoginSession[] | null>(null)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<string | 'all' | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await authApi.listSessions()
      setSessions(res.data)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load login sessions')
      setSessions([])
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const revoke = async (sessionId: string) => {
    setBusyId(sessionId)
    try {
      await authApi.revokeSession(sessionId)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not revoke session')
    } finally {
      setBusyId(null)
    }
  }

  const revokeOthers = async () => {
    setBusyId('all')
    try {
      await authApi.logoutAll(true)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not revoke other sessions')
    } finally {
      setBusyId(null)
    }
  }

  const others = (sessions ?? []).filter((s) => !s.is_current)

  return (
    <Card className="shadow-sm border-0 mb-4">
      <Card.Body className="p-4">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
          <h5 className="mb-0">Login sessions</h5>
          {others.length > 0 && (
            <Button
              size="sm"
              variant="outline-danger"
              disabled={busyId !== null}
              onClick={() => void revokeOthers()}
            >
              {busyId === 'all' ? 'Signing out…' : 'Sign out other devices'}
            </Button>
          )}
        </div>
        <p className="text-muted small mb-3">
          Devices and browsers where your account is currently signed in.
        </p>
        {error && <Alert variant="danger">{error}</Alert>}
        {sessions === null ? (
          <div className="text-center py-3">
            <Spinner animation="border" size="sm" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-muted mb-0">No active sessions.</p>
        ) : (
          <ul className="list-unstyled mb-0">
            {sessions.map((session) => (
              <li
                key={session.session_id}
                className="d-flex flex-wrap align-items-start justify-content-between gap-2 py-3 border-top"
              >
                <div className="min-w-0">
                  <div className="fw-semibold">
                    {CLIENT_LABEL[session.client_type] || session.client_type}
                    {' · '}
                    {deviceHint(session)}
                    {session.is_current && (
                      <Badge bg="success" className="ms-2 align-middle">
                        This device
                      </Badge>
                    )}
                  </div>
                  <div className="small text-muted">
                    {session.ip_address || 'IP unknown'}
                    {' · Last active '}
                    {formatWhen(session.last_seen_at)}
                    {' · Signed in '}
                    {formatWhen(session.created_at)}
                  </div>
                </div>
                {!session.is_current && (
                  <Button
                    size="sm"
                    variant="outline-secondary"
                    disabled={busyId !== null}
                    onClick={() => void revoke(session.session_id)}
                  >
                    {busyId === session.session_id ? '…' : 'Sign out'}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card.Body>
    </Card>
  )
}
