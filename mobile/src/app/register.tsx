import { Redirect } from 'expo-router'
import { RegisterScreen } from '@/features/auth/RegisterScreen'
import { useAuth } from '@/services/AuthProvider'

export default function RegisterRoute() {
  const { status } = useAuth()
  if (status === 'authenticated') return <Redirect href="/(tabs)" />
  return <RegisterScreen />
}
