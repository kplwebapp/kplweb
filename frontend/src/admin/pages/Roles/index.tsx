import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  Alert,
  Badge,
  Button,
  Form,
  Modal,
  Spinner,
  Table,
} from 'react-bootstrap'
import { Navigate } from 'react-router-dom'
import PageHeader, { AdminSection } from '@/admin/components/common/PageHeader'
import { useAdminContext } from '@/admin/context'
import { ADMIN_BASE } from '@/admin/config/sidebar'
import { rolesApi, type AdminPanelArea, type AdminRole } from '@/services/api/rolesApi'
import { roleLabel } from '@/utils/adminSession'

type RoleFormState = {
  roleName: string
  roleCode: string
  description: string
  areas: string[]
}

const emptyForm = (): RoleFormState => ({
  roleName: '',
  roleCode: '',
  description: '',
  areas: ['dashboard'],
})

function toRoleCode(name: string) {
  return name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 49)
}

export default function RolesPage() {
  const { isSuperAdmin } = useAdminContext()
  const [roles, setRoles] = useState<AdminRole[]>([])
  const [areas, setAreas] = useState<AdminPanelArea[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [saving, setSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<AdminRole | null>(null)
  const [form, setForm] = useState<RoleFormState>(emptyForm)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [rolesRes, areasRes] = await Promise.all([rolesApi.list(), rolesApi.areas()])
      setRoles(rolesRes.data)
      setAreas(areasRes.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load roles')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isSuperAdmin) void load()
  }, [isSuperAdmin, load])

  const areaLabel = useMemo(() => {
    const map = new Map(areas.map((a) => [a.key, a.label]))
    return (key: string) => map.get(key) || key
  }, [areas])

  if (!isSuperAdmin) {
    return <Navigate to={ADMIN_BASE} replace />
  }

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm())
    setActionError('')
    setShowModal(true)
  }

  const openEdit = (role: AdminRole) => {
    setEditing(role)
    setForm({
      roleName: role.role_name,
      roleCode: role.role_code,
      description: role.description || '',
      areas: role.areas.length ? role.areas : ['dashboard'],
    })
    setActionError('')
    setShowModal(true)
  }

  const toggleArea = (key: string) => {
    setForm((prev) => ({
      ...prev,
      areas: prev.areas.includes(key)
        ? prev.areas.filter((a) => a !== key)
        : [...prev.areas, key],
    }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setActionError('')
    if (!form.areas.length) {
      setActionError('Select at least one admin panel area.')
      return
    }
    setSaving(true)
    try {
      if (editing) {
        await rolesApi.update(editing.role_id, {
          roleName: form.roleName.trim(),
          description: form.description.trim() || undefined,
          areas: form.areas,
        })
      } else {
        await rolesApi.create({
          roleName: form.roleName.trim(),
          roleCode: form.roleCode.trim().toUpperCase(),
          description: form.description.trim() || undefined,
          areas: form.areas,
        })
      }
      setShowModal(false)
      await load()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not save role')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (role: AdminRole) => {
    if (role.is_system) return
    if (!window.confirm(`Delete role “${role.role_name}”? This cannot be undone.`)) return
    setActionError('')
    try {
      await rolesApi.remove(role.role_id)
      await load()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not delete role')
    }
  }

  return (
    <AdminSection>
      <PageHeader
        title="Roles & access"
        description="Create roles and choose which admin panel areas each role can use. Only Super Admin can manage this."
        actions={
          <Button variant="primary" onClick={openCreate}>
            Add role
          </Button>
        }
      >
        {error && <Alert variant="danger" className="mb-0">{error}</Alert>}
        {actionError && !showModal && <Alert variant="danger">{actionError}</Alert>}
        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" />
          </div>
        ) : (
          <Table responsive hover className="mb-0 align-middle">
            <thead>
              <tr>
                <th>Role</th>
                <th>Admin panel areas</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => (
                <tr key={role.role_id}>
                  <td>
                    <div className="fw-semibold">{role.role_name}</div>
                    <div className="small text-muted">
                      {role.role_code}
                      {role.is_system && (
                        <Badge bg="secondary" className="ms-2">
                          Built-in
                        </Badge>
                      )}
                    </div>
                    {role.description && (
                      <div className="small text-muted mt-1">{role.description}</div>
                    )}
                  </td>
                  <td>
                    {role.role_code === 'SUPER_ADMIN' ? (
                      <span className="text-muted">All areas</span>
                    ) : role.areas.length ? (
                      <div className="d-flex flex-wrap gap-1">
                        {role.areas.map((key) => (
                          <Badge key={key} bg="light" text="dark" className="border">
                            {areaLabel(key)}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted">No panel areas mapped</span>
                    )}
                  </td>
                  <td className="text-end text-nowrap">
                    {role.role_code === 'SUPER_ADMIN' ? (
                      <span className="small text-muted">Protected</span>
                    ) : (
                      <>
                        <Button size="sm" variant="outline-primary" className="me-2" onClick={() => openEdit(role)}>
                          Edit access
                        </Button>
                        {!role.is_system && (
                          <Button size="sm" variant="outline-danger" onClick={() => void handleDelete(role)}>
                            Delete
                          </Button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </PageHeader>

      <Modal show={showModal} onHide={() => !saving && setShowModal(false)} size="lg" centered>
        <Form onSubmit={(e) => void handleSubmit(e)}>
          <Modal.Header closeButton={!saving}>
            <Modal.Title>{editing ? `Edit ${roleLabel(editing.role_code)}` : 'Add role'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {actionError && <Alert variant="danger">{actionError}</Alert>}
            <Form.Group className="mb-3">
              <Form.Label>Role name</Form.Label>
              <Form.Control
                value={form.roleName}
                required
                maxLength={100}
                onChange={(e) => {
                  const roleName = e.target.value
                  setForm((prev) => ({
                    ...prev,
                    roleName,
                    roleCode: editing ? prev.roleCode : toRoleCode(roleName) || prev.roleCode,
                  }))
                }}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Role code</Form.Label>
              <Form.Control
                value={form.roleCode}
                required
                disabled={Boolean(editing)}
                maxLength={50}
                pattern="[A-Za-z][A-Za-z0-9_]{1,48}"
                onChange={(e) => setForm((prev) => ({ ...prev, roleCode: e.target.value.toUpperCase() }))}
              />
              <Form.Text muted>Used internally (e.g. AUCTION_OPERATOR). Cannot change after create.</Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={form.description}
                maxLength={500}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </Form.Group>
            <fieldset>
              <legend className="fs-6 fw-semibold">Admin panel areas</legend>
              <p className="small text-muted">Choose which sections this role can open in the admin panel.</p>
              <div className="d-grid gap-2">
                {areas.map((area) => (
                  <Form.Check
                    key={area.key}
                    type="checkbox"
                    id={`area-${area.key}`}
                    checked={form.areas.includes(area.key)}
                    onChange={() => toggleArea(area.key)}
                    label={
                      <span>
                        <span className="fw-semibold">{area.label}</span>
                        {area.description ? (
                          <span className="text-muted"> — {area.description}</span>
                        ) : null}
                      </span>
                    }
                  />
                ))}
              </div>
            </fieldset>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" disabled={saving} onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save access' : 'Create role'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </AdminSection>
  )
}
