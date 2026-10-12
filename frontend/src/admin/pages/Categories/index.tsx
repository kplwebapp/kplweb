import { useState, type FormEvent } from 'react'
import { Alert, Badge, Button, Form, InputGroup, Table } from 'react-bootstrap'
import PageHeader, { AdminSection } from '@/admin/components/common/PageHeader'
import { KIND_LABELS, categoryIcon } from '@/admin/config/sidebar'
import { useAdminContext } from '@/admin/context'
import { adminActivitiesApi, type ActivityKind, type Category } from '@/services/api/activitiesApi'

export default function CategoriesPage({ kind }: { kind: ActivityKind }) {
  const { categories, reloadCategories } = useAdminContext()
  const items = categories[kind]
  const labels = KIND_LABELS[kind]

  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true)
    setError('')
    try {
      await action()
      await reloadCategories()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed.')
      return false
    } finally {
      setBusy(false)
    }
  }

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return
    if (await run(() => adminActivitiesApi.createCategory(kind, name))) setNewName('')
  }

  const startEdit = (category: Category) => {
    setEditingId(category.category_id)
    setEditName(category.name)
  }

  const saveEdit = async (category: Category) => {
    const name = editName.trim()
    if (!name || name === category.name) {
      setEditingId(null)
      return
    }
    if (await run(() => adminActivitiesApi.updateCategory(category.category_id, { name }))) setEditingId(null)
  }

  const move = (index: number, direction: -1 | 1) => {
    const other = items[index + direction]
    const current = items[index]
    if (!other) return
    run(async () => {
      await adminActivitiesApi.updateCategory(current.category_id, { display_order: other.display_order })
      await adminActivitiesApi.updateCategory(other.category_id, { display_order: current.display_order })
    })
  }

  return (
    <AdminSection>
      <PageHeader
        title={`${labels.singular} Categories`}
        description={`These appear under "${labels.plural}"${kind === 'TOURNAMENT' ? ' and "Players"' : ''} in the left menu. Hidden categories are removed from the menu and the public website, but nothing inside them is deleted.`}
      />

      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

      <Form onSubmit={handleAdd} className="mb-3" style={{ maxWidth: 480 }}>
        <InputGroup>
          <Form.Control
            placeholder={kind === 'TOURNAMENT' ? 'e.g. Badminton' : 'e.g. Cultural Night'}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            maxLength={100}
            disabled={busy}
            required
            pattern=".*\S.*"
          />
          <Button type="submit" disabled={busy}>Add category</Button>
        </InputGroup>
      </Form>

      <Table responsive hover className="bg-white shadow-sm align-middle" style={{ maxWidth: 800 }}>
        <thead className="table-light">
          <tr>
            <th style={{ width: 90 }}>Order</th>
            <th>Name</th>
            <th>Status</th>
            <th className="text-end">Action</th>
          </tr>
        </thead>
        <tbody>
          {items.map((category, index) => (
            <tr key={category.category_id}>
              <td>
                <div className="d-inline-flex gap-1">
                  <Button size="sm" variant="light" disabled={busy || index === 0} onClick={() => move(index, -1)} aria-label="Move up">↑</Button>
                  <Button size="sm" variant="light" disabled={busy || index === items.length - 1} onClick={() => move(index, 1)} aria-label="Move down">↓</Button>
                </div>
              </td>
              <td>
                {editingId === category.category_id ? (
                  <InputGroup size="sm">
                    <Form.Control
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveEdit(category) } }}
                      maxLength={100}
                      autoFocus
                    />
                    <Button variant="primary" disabled={busy} onClick={() => saveEdit(category)}>Save</Button>
                    <Button variant="outline-secondary" onClick={() => setEditingId(null)}>Cancel</Button>
                  </InputGroup>
                ) : (
                  <span><span className="me-2">{categoryIcon(kind, category.slug)}</span>{category.name}</span>
                )}
              </td>
              <td>
                <Badge bg={category.is_active ? 'success' : 'secondary'}>
                  {category.is_active ? 'Shown' : 'Hidden'}
                </Badge>
              </td>
              <td className="text-end">
                <div className="d-inline-flex gap-2">
                  <Button size="sm" variant="outline-primary" disabled={busy} onClick={() => startEdit(category)}>
                    Rename
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-secondary"
                    disabled={busy}
                    onClick={() => run(() => adminActivitiesApi.updateCategory(category.category_id, { is_active: !category.is_active }))}
                  >
                    {category.is_active ? 'Hide' : 'Show'}
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </AdminSection>
  )
}
