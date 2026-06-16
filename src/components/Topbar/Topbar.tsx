import { useEffect } from 'react'
import { Navbar, Container, Nav } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMoon, faSun } from '@fortawesome/free-solid-svg-icons'
import './Topbar.scss'

type Props = {
  onToggleTheme: () => void
  onSetTheme?: (isDark: boolean) => void
  isDark?: boolean
}

const FONT_KEY = 'kpl-font-size'
const DEFAULT_FONT = 18
const FONT_STEP_LIMIT = 3
const MIN_ALLOWED_FONT = 12

function getStoredFont() {
  try {
    const s = localStorage.getItem(FONT_KEY)
    if (s) return Number(s)
  } catch (e) {
    /* ignore */
  }
  const computed = getComputedStyle(document.documentElement).fontSize
  return parseFloat(computed) || DEFAULT_FONT
}

function applyFont(px: number) {
  document.documentElement.style.fontSize = `${px}px`
  try {
    localStorage.setItem(FONT_KEY, String(px))
  } catch (e) {
    /* ignore */
  }
}

export default function Topbar({ onToggleTheme, onSetTheme, isDark }: Props) {
  useEffect(() => {
    const stored = getStoredFont()
    const minFont = Math.max(MIN_ALLOWED_FONT, DEFAULT_FONT - FONT_STEP_LIMIT)
    const maxFont = DEFAULT_FONT + FONT_STEP_LIMIT
    const clamped = Math.min(maxFont, Math.max(minFont, stored))
    applyFont(clamped)
  }, [])

  const increaseFont = () => {
    const cur = getStoredFont()
    const maxFont = DEFAULT_FONT + FONT_STEP_LIMIT
    if (cur >= maxFont) return
    applyFont(Math.min(maxFont, cur + 1))
  }

  const decreaseFont = () => {
    const cur = getStoredFont()
    const minFont = Math.max(MIN_ALLOWED_FONT, DEFAULT_FONT - FONT_STEP_LIMIT)
    if (cur <= minFont) return
    applyFont(Math.max(minFont, cur - 1))
  }

  const resetFont = () => {
    applyFont(DEFAULT_FONT)
  }

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="topbar-bar py-0">
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
            <Nav.Link onClick={increaseFont} className="text-white font-link" title="Increase font size">
              A+
            </Nav.Link>
            <Nav.Link onClick={resetFont} className="text-white font-link" title="Reset font size">
              A
            </Nav.Link>
            <Nav.Link onClick={decreaseFont} className="text-white font-link" title="Decrease font size">
              A-
            </Nav.Link>
          </div>
        </Nav>
      </Container>
    </Navbar>
  )
}
