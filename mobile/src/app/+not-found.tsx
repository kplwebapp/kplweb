import { Link } from 'expo-router'
import { View } from 'react-native'
import { AppText } from '@/components/ui/AppText'
import { Screen } from '@/components/ui/Screen'

export default function NotFound() {
  return (
    <Screen>
      <View style={{ gap: 12, paddingTop: 40 }}>
        <AppText variant="title" weight="700">
          Screen not found
        </AppText>
        <Link href="/">
          <AppText weight="600" color="#7c0061">
            Go home
          </AppText>
        </Link>
      </View>
    </Screen>
  )
}
