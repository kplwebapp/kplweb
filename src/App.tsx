import './App.scss'
import { useEffect, useState } from 'react'
import MainLayout from './layouts/MainLayout'
import Home from './pages/Home'
import About from './pages/About'
import Gallery from './pages/Gallery'
import Contact from './pages/Contact'
import Login from './pages/Login'
import Register from './pages/Register'

function App() {
  const [path, setPath] = useState(window.location.pathname)

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const navigate = (to: string) => {
    if (to === path) return
    window.history.pushState({}, '', to)
    setPath(to)
  }

  const page = () => {
    switch (path) {
      case '/login':
        return <Login navigate={navigate} />
      case '/register':
        return <Register navigate={navigate} />
      case '/about':
        return <About />
      case '/gallery':
        return <Gallery />
      case '/contact':
        return <Contact />
      case '/':
      default:
        return <Home />
    }
  }

  return <MainLayout navigate={navigate}>{page()}</MainLayout>
}

export default App
