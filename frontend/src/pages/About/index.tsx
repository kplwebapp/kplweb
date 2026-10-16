import { Row, Col, Card } from 'react-bootstrap'
import PageShell from '@/components/common/PageShell'
import { aboutContent } from '@/content'
import './About.scss'

export default function About() {
  const content = aboutContent

  return (
    <PageShell title={content.title} description={content.introduction}>
      <Row className="g-4">
        <Col md={4}>
          <Card className="h-100 shadow-sm border-0">
            <Card.Body>
              <Card.Title as="h2" className="h5">Our Mission</Card.Title>
              <Card.Text className="text-muted">{content.mission}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="h-100 shadow-sm border-0">
            <Card.Body>
              <Card.Title as="h2" className="h5">Our Vision</Card.Title>
              <Card.Text className="text-muted">{content.vision}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="h-100 shadow-sm border-0">
            <Card.Body>
              <Card.Title as="h2" className="h5">Community First</Card.Title>
              <Card.Text className="text-muted">{content.community}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </PageShell>
  )
}
