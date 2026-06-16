import { Nav } from 'react-bootstrap'
import { Navbar, Container } from 'react-bootstrap'
import './Header.scss'
import logoMain from '../../assets/img-logo.png'
import logoMainWhite from '../../assets/img-logo-white.png'

type Props = {
  navigate: (to: string) => void
  isDark: boolean
}

export default function Header({ navigate, isDark }: Props) {
  const logo = isDark ? logoMainWhite : logoMain

  return (
    <Navbar expand="lg" className="" sticky="top">
      <Container>
        <Navbar.Brand href="/"><img src={logo} alt="Kansara Premier League" className="header-logo" /></Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav" className="header-collapse">
          <div className="header-nav-row d-flex flex-column flex-lg-row align-items-start align-items-lg-center justify-content-between w-100">
            <div className="nav-section nav-center d-flex justify-content-center w-100 mb-3 mb-lg-0">
              <Nav className="flex-column flex-lg-row align-items-start align-items-lg-center gap-2">
                <Nav.Link href="#" onClick={(e) => { e.preventDefault(); navigate('/') }}>
                  Home
                </Nav.Link>
                <Nav.Link href="#" onClick={(e) => { e.preventDefault(); navigate('/about') }}>
                  About
                </Nav.Link>
                <Nav.Link href="#" onClick={(e) => { e.preventDefault(); navigate('/gallery') }}>
                  Gallery
                </Nav.Link>
                <Nav.Link href="#" onClick={(e) => { e.preventDefault(); navigate('/contact') }}>
                  Contact
                </Nav.Link>
              </Nav>
            </div>
            <div className="nav-section nav-right d-flex gap-2">
              <button className="btn btn-primary" onClick={() => navigate('/login')}>Login/Register</button>
            </div>
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  )
}
