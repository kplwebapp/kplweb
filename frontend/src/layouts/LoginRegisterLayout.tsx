import type { ReactNode } from 'react'
import { Container, Row, Col, Card } from 'react-bootstrap'
import './LoginRegisterLayout.scss'

type Props = {
  title: string
  subtitle: string
  illustrationTitle: string
  illustrationSubtitle: string
  children: ReactNode
  navigate?: (to: string) => void
}

export default function LoginRegisterLayout({
  title,
  subtitle,
  illustrationTitle,
  illustrationSubtitle,
  children,
}: Props) {
  return (
    <Container fluid className="login-register-container px-0">
      <Row className="w-100 h-100 gx-0">
        <Col lg={6} className="illustration-col d-none d-lg-flex align-items-center justify-content-center">
          <div className="illustration">
            <div className="illustration-content">
              <h2>{illustrationTitle}</h2>
              <p>{illustrationSubtitle}</p>
            </div>
          </div>
        </Col>
        <Col lg={6} xs={12} className="d-flex align-items-start justify-content-center form-col">
          <Card className="border-0 shadow-none form-card w-100">
            <Card.Body>
              <div className="form-header">
                <h1>{title}</h1>
                <p>{subtitle}</p>
              </div>
              {children}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}
