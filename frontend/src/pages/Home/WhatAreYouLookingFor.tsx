import { Container, Row, Col, Button } from 'react-bootstrap'
import './WhatAreYouLookingFor.scss'
import React from 'react'

const searchItems = ['Matches', 'Teams', 'Players', 'Highlights']

export default function WhatAreYouLookingFor() {
  return (
    <React.Fragment>
      <section className="whatareyoulookingfor-section py-4">
        <Container>
          <h2 className="section-title text-center mb-4">What are you looking for?</h2>
          <Row className="g-3 justify-content-center">
            {searchItems.map((item) => (
              <Col key={item} xs={6} md={3}>
                <Button variant="outline-primary" className="w-100 py-3">
                  {item}
              </Button>
            </Col>
          ))}
        </Row>
      </Container>
      </section>
    </React.Fragment>
  )
}
