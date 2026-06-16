import React, { useState, useEffect } from 'react'
import Topbar from '../components/Topbar/Topbar'
import Header from '../components/Header/Header'
import Footer from '../components/Footer/Footer'

type Props = {
  navigate: (to: string) => void
  children?: React.ReactNode
}

export default function MainLayout({ navigate, children }: Props) {
  const [isDark, setIsDark] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const handleToggleTheme = () => setIsDark((current) => !current)
  const setTheme = (v: boolean) => setIsDark(v)

  // persist theme
  useEffect(() => {
    try {
      const s = localStorage.getItem('kpl-theme')
      if (s === 'dark') setIsDark(true)
      else if (s === 'light') setIsDark(false)
    } catch (e) {
      /* ignore */
    }
    setInitialized(true)
  }, [])

  useEffect(() => {
    if (!initialized) return
    try {
      localStorage.setItem('kpl-theme', isDark ? 'dark' : 'light')
    } catch (e) {
      /* ignore */
    }
  }, [isDark, initialized])

  return (
    <div
      className={isDark ? 'app-shell theme-dark' : 'app-shell theme-light'}
      data-theme={isDark ? 'theme-dark' : 'theme-light'}
    >
      <Topbar onToggleTheme={handleToggleTheme} onSetTheme={setTheme} isDark={isDark} />
      <Header navigate={navigate} isDark={isDark} />
      <main className="container py-4">{children}</main>
      <Footer />
    </div>
  )
}
