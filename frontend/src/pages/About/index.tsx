import { Container, Row, Col, Card } from 'react-bootstrap'
import { aboutContent } from '@/content'
import './About.scss'

export default function About() {
  const content = aboutContent

  return (
    <Container as="section" className="about-page py-4">

      <Card className="shadow-sm border-0 mb-4">
        <Card.Body className="p-4">
          <Card.Title as="h2">{content.title}</Card.Title>
          <Card.Text className="lead text-muted">{content.introduction}</Card.Text>
        </Card.Body>
      </Card>

      <Row className="g-4">
        <Col md={4}>
          <Card className="h-100 shadow-sm border-0">
            <Card.Body>
              <Card.Title as="h5">Our Mission</Card.Title>
              <Card.Text className="text-muted">{content.mission}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="h-100 shadow-sm border-0">
            <Card.Body>
              <Card.Title as="h5">Our Vision</Card.Title>
              <Card.Text className="text-muted">{content.vision}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="h-100 shadow-sm border-0">
            <Card.Body>
              <Card.Title as="h5">Community First</Card.Title>
              <Card.Text className="text-muted">{content.community}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}
