import { View } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { AppText } from '@/components/ui/AppText'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Screen } from '@/components/ui/Screen'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { TeamMark } from '@/components/ui/TeamMark'
import { useMatch } from '@/hooks/useKplData'
import { formatMatchWhen } from '@/utils/datetime'
import { useTheme } from '@/theme/ThemeProvider'

export function MatchDetailScreen() {
  const { id = '' } = useLocalSearchParams<{ id: string }>()
  const { theme } = useTheme()
  const matchQuery = useMatch(id)
  const match = matchQuery.data

  if (matchQuery.isLoading) {
    return (
      <Screen>
        <AppText muted>Loading match…</AppText>
      </Screen>
    )
  }

  if (!match) {
    return (
      <Screen>
        <EmptyState title="Match not found" description="This match is not available from the API." />
      </Screen>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Screen scroll>
        <StatusBadge
          label={match.status}
          tone={match.status === 'live' ? 'live' : match.status === 'completed' ? 'success' : 'gold'}
        />
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ alignItems: 'center', gap: 8, flex: 1 }}>
              <TeamMark code={match.team1.code} color={match.team1.color} name={match.team1.name} size={64} />
              <AppText weight="700" style={{ textAlign: 'center' }} numberOfLines={2}>
                {match.team1.name}
              </AppText>
            </View>
            <AppText muted>vs</AppText>
            <View style={{ alignItems: 'center', gap: 8, flex: 1 }}>
              <TeamMark code={match.team2.code} color={match.team2.color} name={match.team2.name} size={64} />
              <AppText weight="700" style={{ textAlign: 'center' }} numberOfLines={2}>
                {match.team2.name}
              </AppText>
            </View>
          </View>
        </Card>
        <Card>
          <AppText weight="700" variant="subtitle">
            Overview
          </AppText>
          <AppText muted>{formatMatchWhen(match.startsAt)}</AppText>
          <AppText muted>{match.venue}</AppText>
          {match.resultSummary ? <AppText weight="600">{match.resultSummary}</AppText> : null}
        </Card>
        <Card>
          <AppText weight="700">Scorecard</AppText>
          <AppText muted>
            Detailed batting/bowling tables use the same match records as the website when scoring data is available.
          </AppText>
        </Card>
      </Screen>
    </View>
  )
}
