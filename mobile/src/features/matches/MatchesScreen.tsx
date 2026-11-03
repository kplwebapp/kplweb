import { useMemo, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import { AppHeader } from '@/components/layout/AppHeader'
import { MatchCard } from '@/components/match/MatchCard'
import { AppText } from '@/components/ui/AppText'
import { EmptyState } from '@/components/ui/EmptyState'
import { Screen } from '@/components/ui/Screen'
import { useMatches } from '@/hooks/useKplData'
import { useSeason } from '@/services/SeasonProvider'
import { useTheme } from '@/theme/ThemeProvider'
import { radii, spacing } from '@/theme/spacing'

const tabs = [
  { key: 'live', label: 'Live' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Results' },
] as const

type TabKey = (typeof tabs)[number]['key']

export function MatchesScreen() {
  const [tab, setTab] = useState<TabKey>('upcoming')
  const router = useRouter()
  const { theme } = useTheme()
  const { seasonId } = useSeason()
  const matchesQuery = useMatches(seasonId)
  const list = useMemo(
    () => (matchesQuery.data ?? []).filter((m) => m.status === tab),
    [matchesQuery.data, tab],
  )

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <AppHeader title="Matches" />
      <Screen
        scroll
        refreshing={matchesQuery.isRefetching}
        onRefresh={() => matchesQuery.refetch()}
      >
        <View style={styles.tabs}>
          {tabs.map((item) => {
            const active = item.key === tab
            return (
              <Pressable
                key={item.key}
                onPress={() => setTab(item.key)}
                style={[
                  styles.tab,
                  {
                    backgroundColor: active ? theme.colors.primary : theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <AppText weight="600" color={active ? '#FFFFFF' : theme.colors.text} variant="caption">
                  {item.label}
                </AppText>
              </Pressable>
            )
          })}
        </View>
        {matchesQuery.isError ? (
          <AppText color={theme.colors.danger}>Could not load matches from the API.</AppText>
        ) : null}
        {list.length === 0 && !matchesQuery.isLoading ? (
          <EmptyState title="No matches" description="No fixtures in this tab for the selected season." />
        ) : (
          list.map((match) => (
            <MatchCard key={match.id} match={match} onPress={() => router.push(`/match/${match.id}`)} />
          ))
        )}
      </Screen>
    </View>
  )
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: spacing.sm },
  tab: {
    flex: 1,
    minHeight: 40,
    borderRadius: radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
