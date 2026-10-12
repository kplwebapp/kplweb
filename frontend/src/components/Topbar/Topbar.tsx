import { useState } from 'react'
import { Navbar, Container, Nav } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMoon, faSun } from '@fortawesome/free-solid-svg-icons'
import { FONT_LEVEL_MAX, FONT_LEVEL_MIN, getFontLevel, setFontLevel } from '@/utils/fontScale'
import './Topbar.scss'

type Props = {
  onToggleTheme: () => void
  onSetTheme?: (isDark: boolean) => void
  isDark?: boolean
}

export default function Topbar({ onToggleTheme, onSetTheme, isDark }: Props) {
  const [fontLevel, setLevel] = useState(getFontLevel)

  const changeFont = (level: number) => setLevel(setFontLevel(level))
  const increaseFont = () => changeFont(getFontLevel() + 1)
  const decreaseFont = () => changeFont(getFontLevel() - 1)
  const resetFont = () => changeFont(0)

  return (
    <Navbar expand="lg" className="topbar-bar py-0">
      <Container className="d-flex align-items-center">
        <div className="name">KANSARA PREMIER LEAGUE</div>
        <Nav className="ms-auto align-items-center">
          <Nav.Link href="#accessibility" className="text-white">
            Accessibility
          </Nav.Link>
          <div className="theme-switch d-flex align-items-center" role="tablist" aria-label="Theme switch">
            <button
              type="button"
              className={`switch ${isDark ? 'dark' : 'light'}`}
              onClick={() => {
                const next = !isDark
                if (onSetTheme) onSetTheme(next)
                else onToggleTheme()
              }}
              aria-pressed={!!isDark}
              aria-label="Toggle theme"
            >
              <span className="knob" aria-hidden>
                <FontAwesomeIcon icon={isDark ? faMoon : faSun} />
              </span>
            </button>
          </div>
          <div className="font-controls d-flex align-items-center">
            <Nav.Link
              onClick={increaseFont}
              className="text-white font-link"
              title="Increase font size"
              disabled={fontLevel >= FONT_LEVEL_MAX}
            >
              A+
            </Nav.Link>
            <Nav.Link
              onClick={resetFont}
              className="text-white font-link"
              title="Reset font size"
              active={fontLevel === 0}
            >
              A
            </Nav.Link>
            <Nav.Link
              onClick={decreaseFont}
              className="text-white font-link"
              title="Decrease font size"
              disabled={fontLevel <= FONT_LEVEL_MIN}
            >
              A-
            </Nav.Link>
          </div>
        </Nav>
      </Container>
    </Navbar>
  )
}
