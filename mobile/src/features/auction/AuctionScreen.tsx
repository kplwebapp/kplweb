import { Pressable, View } from 'react-native'
import { useRouter } from 'expo-router'
import { AppHeader } from '@/components/layout/AppHeader'
import { AppText } from '@/components/ui/AppText'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Screen } from '@/components/ui/Screen'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useAuctions } from '@/hooks/useKplData'
import { useTheme } from '@/theme/ThemeProvider'

export function AuctionScreen() {
  const router = useRouter()
  const { theme } = useTheme()
  const auctionsQuery = useAuctions()

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <AppHeader title="Auction" />
      <Screen scroll refreshing={auctionsQuery.isRefetching} onRefresh={() => auctionsQuery.refetch()}>
        <AppText muted>Auction cards come from GET /api/auctions/public — same source as the website.</AppText>
        {auctionsQuery.isError ? (
          <AppText color={theme.colors.danger}>Could not load auctions.</AppText>
        ) : null}
        {(auctionsQuery.data?.length ?? 0) === 0 && !auctionsQuery.isLoading ? (
          <EmptyState title="No auctions" description="No public auctions are available yet." />
        ) : (
          (auctionsQuery.data ?? []).map((auction) => (
            <Pressable key={auction.id} onPress={() => router.push(`/auction/${auction.id}`)}>
              <Card>
                <StatusBadge
                  label={auction.status}
                  tone={auction.status === 'Live' ? 'live' : auction.status === 'Completed' ? 'neutral' : 'gold'}
                />
                <AppText weight="700" variant="subtitle">
                  {auction.title}
                </AppText>
                <AppText muted variant="caption">
                  {auction.dateLabel} · {auction.venue}
                </AppText>
                {auction.description ? <AppText muted>{auction.description}</AppText> : null}
              </Card>
            </Pressable>
          ))
        )}
      </Screen>
    </View>
  )
}
