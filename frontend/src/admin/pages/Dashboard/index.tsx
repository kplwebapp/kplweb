import { Row, Col, Card } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import PageHeader, { AdminSection } from '@/admin/components/common/PageHeader'
import { ADMIN_BASE } from '@/admin/config/sidebar'

const quickLinks = [
  { label: 'Tournaments', path: `${ADMIN_BASE}/tournaments` },
  { label: 'Events', path: `${ADMIN_BASE}/events` },
  { label: 'Players', path: `${ADMIN_BASE}/players` },
  { label: 'Registered Members', path: `${ADMIN_BASE}/members` },
  { label: 'Sponsors', path: `${ADMIN_BASE}/sponsors` },
  { label: 'Gallery', path: `${ADMIN_BASE}/gallery` },
]

export default function DashboardPage() {
  return (
    <AdminSection>
      <PageHeader
        title="Dashboard"
        description="Overview of tournaments, events, content, and member approvals."
      />

      <Row className="g-3">
        <Col lg={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header>Quick links</Card.Header>
            <Card.Body>
              <ul className="mb-0">
                {quickLinks.map((link) => (
                  <li key={link.path}>
                    <Link to={link.path}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header>Activity</Card.Header>
            <Card.Body className="text-muted">
              Connect to <code>/api/dashboard/summary</code> for live metrics when available.
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </AdminSection>
  )
}
