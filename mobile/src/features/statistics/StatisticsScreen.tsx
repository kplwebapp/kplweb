import { View } from 'react-native'
import { AppText } from '@/components/ui/AppText'
import { Card } from '@/components/ui/Card'
import { PreviewBanner } from '@/components/ui/PreviewBanner'
import { Screen } from '@/components/ui/Screen'
import { useTheme } from '@/theme/ThemeProvider'

export function StatisticsScreen() {
  const { theme } = useTheme()
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Screen scroll>
        <PreviewBanner />
        <AppText variant="title" weight="700">
          Statistics
        </AppText>
        <Card>
          <AppText weight="700">Leaderboards</AppText>
          <AppText muted>
            Run scorers, wicket takers, and strike/economy rates will bind to `/api/stats/players` and related endpoints
            when Phase 3 starts. No invented stats are shown here.
          </AppText>
        </Card>
      </Screen>
    </View>
  )
}
