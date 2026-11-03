import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import { AppHeader } from '@/components/layout/AppHeader'
import { FeaturedMatch } from '@/components/match/FeaturedMatch'
import { MatchCard } from '@/components/match/MatchCard'
import { StandingsTable } from '@/components/standings/StandingsTable'
import { AppText } from '@/components/ui/AppText'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Screen } from '@/components/ui/Screen'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { useMatches, usePointsTable, useSponsors } from '@/hooks/useKplData'
import { useSeason } from '@/services/SeasonProvider'
import { useTheme } from '@/theme/ThemeProvider'
import { radii, spacing } from '@/theme/spacing'
import { palette } from '@/theme/types'

const quickLinks = [
  { label: 'Fixtures', href: '/(tabs)/matches', bg: palette.magenta, fg: '#FFFFFF' },
  { label: 'Points Table', href: '/points-table', bg: palette.rose, fg: '#FFFFFF' },
  { label: 'Teams', href: '/(tabs)/teams', bg: palette.coral, fg: '#FFFFFF' },
  { label: 'Auction', href: '/(tabs)/auction', bg: palette.gold, fg: palette.indigo },
] as const

export function HomeScreen() {
  const router = useRouter()
  const { theme } = useTheme()
  const { seasonId } = useSeason()
  const matchesQuery = useMatches(seasonId)
  const standingsQuery = usePointsTable(seasonId)
  const sponsorsQuery = useSponsors()

  const matches = matchesQuery.data ?? []
  const featured =
    matches.find((m) => m.status === 'live') ?? matches.find((m) => m.status === 'upcoming') ?? matches[0]
  const upcoming = matches.filter((m) => m.status === 'upcoming').slice(0, 6)
  const results = matches.filter((m) => m.status === 'completed').slice(0, 4)
  const refreshing = matchesQuery.isRefetching || standingsQuery.isRefetching

  const onRefresh = () => {
    matchesQuery.refetch()
    standingsQuery.refetch()
    sponsorsQuery.refetch()
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <AppHeader />
      <Screen scroll refreshing={refreshing} onRefresh={onRefresh}>
        {matchesQuery.isError || standingsQuery.isError ? (
          <Card>
            <AppText color={theme.colors.danger}>
              Could not load league data. Check API URL and that the backend is running.
            </AppText>
          </Card>
        ) : null}

        {featured ? (
          <FeaturedMatch match={featured} />
        ) : !matchesQuery.isLoading ? (
          <EmptyState title="No matches yet" description="Fixtures from the website API will appear here." />
        ) : null}

        <View style={styles.quickRow}>
          {quickLinks.map((item) => (
            <Pressable
              key={item.label}
              accessibilityRole="button"
              onPress={() => router.push(item.href)}
              style={[styles.quick, { backgroundColor: item.bg, borderColor: item.bg }]}
            >
              <AppText weight="600" variant="caption" color={item.fg}>
                {item.label}
              </AppText>
            </Pressable>
          ))}
        </View>

        <SectionHeader title="Upcoming" actionLabel="All" onAction={() => router.push('/(tabs)/matches')} />
        {upcoming.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontal}>
            {upcoming.map((match) => (
              <View key={match.id} style={styles.horizontalCard}>
                <MatchCard match={match} onPress={() => router.push(`/match/${match.id}`)} />
              </View>
            ))}
          </ScrollView>
        ) : (
          <AppText muted variant="caption">
            No upcoming fixtures for this season.
          </AppText>
        )}

        <SectionHeader title="Recent results" />
        {results.length > 0 ? (
          results.map((match) => (
            <MatchCard key={match.id} match={match} onPress={() => router.push(`/match/${match.id}`)} />
          ))
        ) : (
          <AppText muted variant="caption">
            No completed matches yet.
          </AppText>
        )}

        <SectionHeader title="Points table" actionLabel="Full table" onAction={() => router.push('/points-table')} />
        {(standingsQuery.data?.length ?? 0) > 0 ? (
          <StandingsTable rows={standingsQuery.data ?? []} compact />
        ) : (
          <AppText muted variant="caption">
            Standings will match the website points table when data exists.
          </AppText>
        )}

        <SectionHeader title="Sponsors" actionLabel="All" onAction={() => router.push('/sponsors')} />
        <View style={styles.sponsors}>
          {(sponsorsQuery.data ?? []).length > 0 ? (
            (sponsorsQuery.data ?? []).slice(0, 6).map((s) => (
              <View
                key={s.sponsor_id}
                style={[styles.sponsor, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
              >
                <AppText variant="caption" weight="600" muted>
                  {s.sponsor_name}
                </AppText>
              </View>
            ))
          ) : (
            <AppText muted variant="caption">
              Sponsors load from the same public API as the website.
            </AppText>
          )}
        </View>
      </Screen>
    </View>
  )
}

const styles = StyleSheet.create({
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  quick: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minWidth: '47%',
    alignItems: 'center',
  },
  horizontal: { gap: spacing.md, paddingRight: spacing.lg },
  horizontalCard: { width: 300 },
  sponsors: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  sponsor: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.md,
    padding: spacing.md,
    minWidth: '30%',
    flexGrow: 1,
    alignItems: 'center',
  },
})
