import { useEffect, useState } from 'react'
import { Nav, NavDropdown } from 'react-bootstrap'
import { activitiesApi, type Activity, type ActivityKind } from '@/services/api/activitiesApi'

type Props = {
  kind: ActivityKind
  label: string
  path: string
  navigate: (to: string) => void
}

/**
 * Plain menu link when nothing is upcoming; otherwise a hover dropdown of upcoming titles.
 * Clicking the label itself always opens the list page.
 */
export default function ActivityMenu({ kind, label, path, navigate }: Props) {
  const [items, setItems] = useState<Activity[]>([])
  const [show, setShow] = useState(false)

  useEffect(() => {
    let cancelled = false
    activitiesApi
      .listPublic(kind)
      .then((res) => { if (!cancelled) setItems(res.data) })
      .catch(() => { if (!cancelled) setItems([]) })
    return () => { cancelled = true }
  }, [kind])

  if (items.length === 0) {
    return (
      <Nav.Link href={path} onClick={(e) => { e.preventDefault(); navigate(path) }}>
        {label}
      </Nav.Link>
    )
  }

  return (
    <NavDropdown
      title={label}
      id={`header-${kind.toLowerCase()}-dropdown`}
      className="header-activity-dropdown"
      show={show}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onToggle={(_next, meta) => {
        setShow(false)
        if (meta.source === 'click') navigate(path)
      }}
    >
      {items.map((item) => (
        <NavDropdown.Item
          key={item.event_id}
          href={`${path}/${item.slug}`}
          onClick={(e) => {
            e.preventDefault()
            setShow(false)
            navigate(`${path}/${item.slug}`)
          }}
        >
          {item.title}
        </NavDropdown.Item>
      ))}
    </NavDropdown>
  )
}
