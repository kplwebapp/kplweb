import { View } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { AppText } from '@/components/ui/AppText'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Screen } from '@/components/ui/Screen'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useAuctions } from '@/hooks/useKplData'
import { useTheme } from '@/theme/ThemeProvider'

export function AuctionDetailScreen() {
  const { id = '' } = useLocalSearchParams<{ id: string }>()
  const { theme } = useTheme()
  const auctionsQuery = useAuctions()
  const auction = (auctionsQuery.data ?? []).find((a) => a.id === id)

  if (!auction && !auctionsQuery.isLoading) {
    return (
      <Screen>
        <EmptyState title="Auction not found" />
      </Screen>
    )
  }

  if (!auction) {
    return (
      <Screen>
        <AppText muted>Loading…</AppText>
      </Screen>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Screen scroll>
        <StatusBadge label={auction.status} tone={auction.status === 'Live' ? 'live' : 'neutral'} />
        <Card>
          <AppText variant="title" weight="700">
            {auction.title}
          </AppText>
          <AppText muted>
            {auction.dateLabel} · {auction.venue}
          </AppText>
          {auction.description ? <AppText muted>{auction.description}</AppText> : null}
        </Card>
        <Card>
          <AppText weight="700">Live board</AppText>
          <AppText muted>
            Full live snapshot/SSE board can use the same public auction endpoints as the website auction page.
          </AppText>
        </Card>
      </Screen>
    </View>
  )
}
