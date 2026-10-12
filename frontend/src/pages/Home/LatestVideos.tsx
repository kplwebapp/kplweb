import { Container, Row, Col, Card } from 'react-bootstrap'
import './LatestVideos.scss'
import React from 'react'

const videos = [
  { title: 'Highlights reel', label: 'Video 1' },
  { title: 'Post-match reactions', label: 'Video 2' },
  { title: 'Best wickets', label: 'Video 3' },
]

export default function LatestVideos() {
  return (
    <React.Fragment>
      <section className="latest-videos py-4">
        <Container>
          <h2 className="section-title text-center mb-4">Latest Videos</h2>
          <Row className="g-4">
            {videos.map((video) => (
              <Col key={video.label} md={4}>
                <Card className="h-100 shadow-sm border-0">
                  <Card.Header className="bg-dark text-white text-center py-4">
                    {video.label}
                  </Card.Header>
                  <Card.Body>
                    <Card.Text className="mb-0">{video.title}</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>
    </React.Fragment>
  )
}
