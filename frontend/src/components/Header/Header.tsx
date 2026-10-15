import { useState } from 'react'
import { Nav, Navbar, Container, Dropdown, Offcanvas } from 'react-bootstrap'
import { useAuth } from '../../contexts/AuthContext'
import { getProfilePhotoUrl, handleProfilePhotoError } from '@/utils/profilePhoto'
import ActivityMenu from './ActivityMenu'
import './Header.scss'
import logoMain from '../../assets/img-logo-white.png'
import logoMainWhite from '../../assets/img-logo-white.png'

type Props = {
  navigate: (to: string) => void
  isDark: boolean
}

export default function Header({ navigate, isDark }: Props) {
  const { isAuthenticated, user, logout } = useAuth()
  const logo = isDark ? logoMainWhite : logoMain
  const photoUrl = getProfilePhotoUrl(user?.profile_photo_url)

  // Mobile: the menu is an off-canvas drawer; every navigation closes it.
  const [menuOpen, setMenuOpen] = useState(false)
  const go = (to: string) => {
    setMenuOpen(false)
    navigate(to)
  }

  const handleLogout = () => {
    logout()
    go('/logout')
  }

  return (
    <Navbar expand="lg" sticky="top" expanded={menuOpen} onToggle={setMenuOpen}>
      <Container>
        <Navbar.Brand href="/" onClick={(e) => { e.preventDefault(); go('/') }}>
          <img src={logo} alt="Kansara Premier League" className="header-logo" />
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="header-menu" className="header-menu-toggle" aria-label="Open menu" />
        <Navbar.Offcanvas
          id="header-menu"
          aria-labelledby="header-menu-title"
          placement="start"
          className="header-offcanvas"
        >
          <Offcanvas.Header closeButton closeVariant="white" className="header-offcanvas__header">
            <Offcanvas.Title id="header-menu-title">
              <img src={logoMainWhite} alt="Kansara Premier League" className="header-offcanvas__logo" />
            </Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body className="header-collapse">
          <div className="header-nav-row d-flex flex-column flex-lg-row align-items-start align-items-lg-center justify-content-between w-100">
            <div className="nav-section nav-center d-flex justify-content-center w-100 mb-3 mb-lg-0">
              <Nav className="flex-column flex-lg-row align-items-start align-items-lg-center gap-2">
                <Nav.Link href="#" onClick={(e) => { e.preventDefault(); go('/') }}>
                  Home
                </Nav.Link>
                <Nav.Link href="#" onClick={(e) => { e.preventDefault(); go('/about') }}>
                  About
                </Nav.Link>
                <ActivityMenu kind="EVENT" label="Events" path="/events" navigate={go} />
                <ActivityMenu kind="TOURNAMENT" label="Tournaments" path="/tournaments" navigate={go} />
                <Nav.Link href="#" onClick={(e) => { e.preventDefault(); go('/gallery') }}>
                  Gallery
                </Nav.Link>
                <Nav.Link href="#" onClick={(e) => { e.preventDefault(); go('/auction') }}>
                  Auction
                </Nav.Link>
                <Nav.Link href="#" onClick={(e) => { e.preventDefault(); go('/contact') }}>
                  Contact
                </Nav.Link>
              </Nav>
            </div>
            <div className="nav-section nav-right d-flex align-items-center gap-2">
              {isAuthenticated ? (
                <Dropdown align="end" className="header-profile-dropdown">
                  <Dropdown.Toggle
                    variant="link"
                    id="header-profile-dropdown"
                    className="header-profile-toggle p-0 border-0"
                  >
                    <img
                      key={user?.profile_photo_url ?? 'default'}
                      src={photoUrl}
                      alt="Profile"
                      className="header-profile-photo"
                      onError={handleProfilePhotoError}
                    />
                    <span className="visually-hidden">Account menu</span>
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item onClick={() => go('/profile')}>View Profile</Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item onClick={handleLogout}>Logout</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              ) : (
                <button className="btn btn-outline-white" onClick={() => go('/login')}>Login/Register</button>
              )}
            </div>
          </div>
          </Offcanvas.Body>
        </Navbar.Offcanvas>
      </Container>
    </Navbar>
  )
}
