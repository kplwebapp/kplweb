import { Redirect } from 'expo-router'
import { LoginScreen } from '@/features/auth/LoginScreen'
import { useAuth } from '@/services/AuthProvider'

export default function LoginRoute() {
  const { status, welcomeSeen } = useAuth()
  if (!welcomeSeen) return <Redirect href="/welcome" />
  if (status === 'authenticated') return <Redirect href="/(tabs)" />
  return <LoginScreen />
}
