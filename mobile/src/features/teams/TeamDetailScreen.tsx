import { View } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { AppText } from '@/components/ui/AppText'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Screen } from '@/components/ui/Screen'
import { TeamMark } from '@/components/ui/TeamMark'
import { useTeams } from '@/hooks/useKplData'
import { useTheme } from '@/theme/ThemeProvider'

export function TeamDetailScreen() {
  const { id = '' } = useLocalSearchParams<{ id: string }>()
  const { theme } = useTheme()
  const teamsQuery = useTeams()
  const team = (teamsQuery.data ?? []).find((t) => t.id === id)

  if (teamsQuery.isLoading) {
    return (
      <Screen>
        <AppText muted>Loading team…</AppText>
      </Screen>
    )
  }

  if (!team) {
    return (
      <Screen>
        <EmptyState title="Team not found" />
      </Screen>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Screen scroll>
        <Card style={{ alignItems: 'center', gap: 12 }}>
          <TeamMark code={team.code} color={team.color} name={team.name} size={96} />
          <AppText variant="title" weight="700" style={{ textAlign: 'center' }}>
            {team.name}
          </AppText>
          <AppText muted>Team profile from the shared KPL database.</AppText>
        </Card>
      </Screen>
    </View>
  )
}
