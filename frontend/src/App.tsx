import { AuthProvider } from './contexts/AuthContext'
import AppRouter from './routes/AppRouter'
import ErrorBoundary from './components/errors/ErrorBoundary'
import OfflineGate from './components/errors/OfflineGate'
import './App.scss'

export default function App() {
  return (
    <ErrorBoundary homeTo="/" homeLabel="Back to home">
      <OfflineGate>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </OfflineGate>
    </ErrorBoundary>
  )
}
