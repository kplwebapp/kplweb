import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, Badge, Button, ButtonGroup, Spinner, Tab, Table } from 'react-bootstrap'
import PageHeader, { AdminSection } from '@/admin/components/common/PageHeader'
import {
  adminApi,
  type AdminUser,
  type ProfileChangeRequest,
} from '@/services/api/adminApi'

type StatusFilter = 'all' | 'pending' | 'active'

export default function MembersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [changeRequests, setChangeRequests] = useState<ProfileChangeRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [filter, setFilter] = useState<StatusFilter>('pending')
  const [actingOn, setActingOn] = useState<number | null>(null)

  const loadUsers = useCallback(() => {
    setLoading(true)
    setError('')
    return Promise.all([
      adminApi.listUsers(),
      adminApi.listProfileChangeRequests('PENDING'),
    ])
      .then(([usersRes, requestsRes]) => {
        setUsers(usersRes.data)
        setChangeRequests(requestsRes.data)
      })
      .catch(() =>
        setError('Could not load registered members. Sign in with an admin account that has user read access.')
      )
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const filtered = useMemo(() => {
    if (filter === 'pending') return users.filter((u) => !u.is_active)
    if (filter === 'active') return users.filter((u) => u.is_active)
    return users
  }, [users, filter])

  const displayName = (user: AdminUser) =>
    user.full_name?.trim() || `${user.first_name} ${user.last_name}`.trim()

  const handleApprove = async (userId: number) => {
    setActionError('')
    setActingOn(userId)
    try {
      const res = await adminApi.approveUser(userId)
      setUsers((prev) => prev.map((u) => (u.user_id === userId ? res.data : u)))
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not approve member.')
    } finally {
      setActingOn(null)
    }
  }

  const handleReject = async (userId: number) => {
    setActionError('')
    setActingOn(userId)
    try {
      const res = await adminApi.rejectUser(userId)
      setUsers((prev) => prev.map((u) => (u.user_id === userId ? res.data : u)))
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not reject member.')
    } finally {
      setActingOn(null)
    }
  }

  const handleApproveRequest = async (requestId: number) => {
    setActionError('')
    setActingOn(requestId)
    try {
      await adminApi.approveProfileChangeRequest(requestId)
      setChangeRequests((prev) => prev.filter((r) => r.request_id !== requestId))
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not approve change request.')
    } finally {
      setActingOn(null)
    }
  }

  const handleRejectRequest = async (requestId: number) => {
    setActionError('')
    setActingOn(requestId)
    try {
      await adminApi.rejectProfileChangeRequest(requestId)
      setChangeRequests((prev) => prev.filter((r) => r.request_id !== requestId))
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not reject change request.')
    } finally {
      setActingOn(null)
    }
  }

  return (
    <AdminSection>
      <PageHeader
        title="Registered Members"
        description="Review and approve members who register via the public site."
        actions={
          <ButtonGroup size="sm">
            <Button
              variant={filter === 'pending' ? 'primary' : 'outline-primary'}
              onClick={() => setFilter('pending')}
            >
              Pending
            </Button>
            <Button
              variant={filter === 'active' ? 'primary' : 'outline-primary'}
              onClick={() => setFilter('active')}
            >
              Active
            </Button>
            <Button
              variant={filter === 'all' ? 'primary' : 'outline-primary'}
              onClick={() => setFilter('all')}
            >
              All
            </Button>
          </ButtonGroup>
        }
      />

      {error && <Alert variant="danger">{error}</Alert>}
      {actionError && (
        <Alert variant="danger" onClose={() => setActionError('')} dismissible>
          {actionError}
        </Alert>
      )}

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      ) : (
        <Tab.Container defaultActiveKey="registrations">
          <Tab.Content>
            <Tab.Pane eventKey="registrations">
              <Table responsive striped bordered hover className="bg-white shadow-sm mb-4">
                <thead className="table-light">
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Registered</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-muted text-center py-4">
                        No {filter === 'all' ? '' : filter} members found.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((user) => {
                      const isActing = actingOn === user.user_id
                      return (
                        <tr key={user.user_id}>
                          <td>{displayName(user)}</td>
                          <td>{user.email}</td>
                          <td>{new Date(user.created_at).toLocaleDateString()}</td>
                          <td>
                            <Badge bg={user.is_active ? 'success' : 'warning'}>
                              {user.is_active ? 'Active' : 'Pending'}
                            </Badge>
                          </td>
                          <td>
                            <div className="d-flex gap-2">
                              <Button
                                size="sm"
                                variant="success"
                                disabled={user.is_active || isActing}
                                onClick={() => handleApprove(user.user_id)}
                              >
                                {isActing ? '…' : 'Approve'}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline-danger"
                                disabled={isActing}
                                onClick={() => handleReject(user.user_id)}
                              >
                                Reject
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </Table>
            </Tab.Pane>
          </Tab.Content>

          {changeRequests.length > 0 && (
            <>
              <h5 className="mb-3">Pending profile change requests</h5>
              <Table responsive striped bordered hover className="bg-white shadow-sm">
                <thead className="table-light">
                  <tr>
                    <th>Member</th>
                    <th>Field</th>
                    <th>Change</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {changeRequests.map((req) => {
                    const isActing = actingOn === req.request_id
                    const memberName = req.user
                      ? req.user.full_name || `${req.user.first_name} ${req.user.last_name}`.trim()
                      : `User #${req.user_id}`
                    return (
                      <tr key={req.request_id}>
                        <td>{memberName}</td>
                        <td>{req.field_name}</td>
                        <td>
                          {req.old_value || '—'} → <strong>{req.new_value}</strong>
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <Button
                              size="sm"
                              variant="success"
                              disabled={isActing}
                              onClick={() => handleApproveRequest(req.request_id)}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-danger"
                              disabled={isActing}
                              onClick={() => handleRejectRequest(req.request_id)}
                            >
                              Reject
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </Table>
            </>
          )}
        </Tab.Container>
      )}
    </AdminSection>
  )
}
