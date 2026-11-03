import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { AppText } from '@/components/ui/AppText'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Screen } from '@/components/ui/Screen'
import { useTheme } from '@/theme/ThemeProvider'
import { spacing } from '@/theme/spacing'

export function PendingApprovalScreen() {
  const { theme } = useTheme()
  const router = useRouter()

  return (
    <Screen>
      <View style={{ gap: spacing.lg, marginTop: spacing.xxl }}>
        <AppText variant="title" weight="700" color={theme.colors.primary}>
          Awaiting approval
        </AppText>
        <Card>
          <AppText muted>
            Your registration was submitted successfully. A KPL super admin must approve community memberships before
            login is enabled.
          </AppText>
          <AppText muted style={{ marginTop: spacing.md }}>
            Once approved, return here and sign in with your mobile number and OTP.
          </AppText>
        </Card>
        <Button label="Back to login" onPress={() => router.replace('/login')} />
      </View>
    </Screen>
  )
}
