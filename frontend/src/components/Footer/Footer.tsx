import { Container } from 'react-bootstrap'
import './Footer.scss'

export default function Footer() {
  return (
    <footer className="py-4">
      <Container className="text-center small">
        © {new Date().getFullYear()} Kansara Premier League. All rights reserved. 
      </Container>
    </footer>
  )
}
