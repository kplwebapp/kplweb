import { AuthProvider } from './contexts/AuthContext'
import AppRouter from './routes/AppRouter'
import './App.scss'

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  )
}
