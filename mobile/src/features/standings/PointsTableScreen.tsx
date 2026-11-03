import { View } from 'react-native'
import { AppText } from '@/components/ui/AppText'
import { Screen } from '@/components/ui/Screen'
import { StandingsTable } from '@/components/standings/StandingsTable'
import { usePointsTable } from '@/hooks/useKplData'
import { useSeason } from '@/services/SeasonProvider'
import { useTheme } from '@/theme/ThemeProvider'

export function PointsTableScreen() {
  const { theme } = useTheme()
  const { seasonId, seasonLabel } = useSeason()
  const standingsQuery = usePointsTable(seasonId)

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Screen scroll refreshing={standingsQuery.isRefetching} onRefresh={() => standingsQuery.refetch()}>
        <AppText variant="title" weight="700">
          Points Table
        </AppText>
        <AppText muted>{seasonLabel}</AppText>
        <AppText muted variant="caption">
          Sourced from GET /api/stats/points-table — same standings as the website.
        </AppText>
        {standingsQuery.isError ? (
          <AppText color={theme.colors.danger}>Could not load standings.</AppText>
        ) : null}
        {(standingsQuery.data?.length ?? 0) > 0 ? (
          <StandingsTable rows={standingsQuery.data ?? []} />
        ) : !standingsQuery.isLoading ? (
          <AppText muted>No points table rows for this season yet.</AppText>
        ) : null}
      </Screen>
    </View>
  )
}
