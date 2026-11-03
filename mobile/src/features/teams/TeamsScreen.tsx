import { Pressable, StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import { AppHeader } from '@/components/layout/AppHeader'
import { AppText } from '@/components/ui/AppText'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Screen } from '@/components/ui/Screen'
import { TeamMark } from '@/components/ui/TeamMark'
import { useTeams } from '@/hooks/useKplData'
import { useTheme } from '@/theme/ThemeProvider'
import { spacing } from '@/theme/spacing'

export function TeamsScreen() {
  const router = useRouter()
  const { theme } = useTheme()
  const teamsQuery = useTeams()

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <AppHeader title="Teams" />
      <Screen scroll refreshing={teamsQuery.isRefetching} onRefresh={() => teamsQuery.refetch()}>
        <AppText muted>
          Teams load from the same `/api/teams` data used by the admin/website (requires your approved login).
        </AppText>
        {teamsQuery.isError ? (
          <AppText color={theme.colors.danger}>Could not load teams. Confirm your account can read teams.</AppText>
        ) : null}
        {(teamsQuery.data?.length ?? 0) === 0 && !teamsQuery.isLoading ? (
          <EmptyState title="No teams" description="No teams returned from the API yet." />
        ) : (
          (teamsQuery.data ?? []).map((team) => (
            <Pressable key={team.id} onPress={() => router.push(`/team/${team.id}`)}>
              <Card style={styles.row}>
                <TeamMark code={team.code} color={team.color} name={team.name} size={56} />
                <View style={{ flex: 1 }}>
                  <AppText weight="700">{team.name}</AppText>
                </View>
              </Card>
            </Pressable>
          ))
        )}
      </Screen>
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
})
