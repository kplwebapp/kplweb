import { ActivityIndicator, View } from 'react-native'
import { Redirect } from 'expo-router'
import { useAuth } from '@/services/AuthProvider'

export default function IndexGate() {
  const { status, welcomeSeen } = useAuth()

  if (status === 'loading') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF8EC' }}>
        <ActivityIndicator size="large" color="#7c0061" />
      </View>
    )
  }

  if (!welcomeSeen) return <Redirect href="/welcome" />
  if (status !== 'authenticated') return <Redirect href="/login" />
  return <Redirect href="/(tabs)" />
}
