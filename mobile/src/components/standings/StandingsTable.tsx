import { StyleSheet, View } from 'react-native'
import { AppText } from '@/components/ui/AppText'
import { Card } from '@/components/ui/Card'
import { TeamMark } from '@/components/ui/TeamMark'
import type { PreviewStanding } from '@/fixtures/previewData'
import { useTheme } from '@/theme/ThemeProvider'
import { spacing } from '@/theme/spacing'

export function StandingsTable({ rows, compact }: { rows: PreviewStanding[]; compact?: boolean }) {
  const { theme } = useTheme()
  const list = compact ? rows.slice(0, 4) : rows
  return (
    <Card padded={false}>
      <View style={[styles.head, { borderBottomColor: theme.colors.border }]}>
        <AppText variant="micro" muted style={styles.rank}>
          #
        </AppText>
        <AppText variant="micro" muted style={styles.team}>
          Team
        </AppText>
        <AppText variant="micro" muted style={styles.num}>
          P
        </AppText>
        <AppText variant="micro" muted style={styles.num}>
          Pts
        </AppText>
        {!compact ? (
          <AppText variant="micro" muted style={styles.nrr}>
            NRR
          </AppText>
        ) : null}
      </View>
      {list.map((row) => (
        <View key={row.team.id} style={[styles.row, { borderBottomColor: theme.colors.border }]}>
          <AppText weight="600" style={styles.rank}>
            {row.rank}
          </AppText>
          <View style={styles.teamCell}>
            <TeamMark code={row.team.code} color={row.team.color} name={row.team.name} size={28} />
            <AppText weight="600" numberOfLines={2} style={{ flex: 1 }}>
              {row.team.name}
            </AppText>
          </View>
          <AppText style={styles.num}>{row.played}</AppText>
          <AppText weight="700" style={styles.num}>
            {row.points}
          </AppText>
          {!compact ? (
            <AppText style={styles.nrr} muted>
              {row.nrr}
            </AppText>
          ) : null}
        </View>
      ))}
    </Card>
  )
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rank: { width: 24 },
  team: { flex: 1 },
  teamCell: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  num: { width: 36, textAlign: 'center' },
  nrr: { width: 64, textAlign: 'right' },
})
