import { Pressable, StyleSheet, View } from 'react-native'
import { AppText } from '@/components/ui/AppText'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { TeamMark } from '@/components/ui/TeamMark'
import type { PreviewMatch } from '@/fixtures/previewData'
import { formatMatchWhen } from '@/utils/datetime'
import { spacing } from '@/theme/spacing'

type Props = {
  match: PreviewMatch
  onPress?: () => void
}

export function MatchCard({ match, onPress }: Props) {
  const tone = match.status === 'live' ? 'live' : match.status === 'completed' ? 'neutral' : 'gold'
  const label = match.status === 'live' ? 'Live' : match.status === 'completed' ? 'Result' : 'Upcoming'

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${match.team1.name} vs ${match.team2.name}`}
    >
      <Card>
        <View style={styles.top}>
          <StatusBadge label={label} tone={tone} />
          <AppText variant="caption" muted>
            {formatMatchWhen(match.startsAt)}
          </AppText>
        </View>
        <View style={styles.teams}>
          <View style={styles.team}>
            <TeamMark code={match.team1.code} color={match.team1.color} name={match.team1.name} />
            <AppText weight="600" numberOfLines={2} style={styles.name}>
              {match.team1.name}
            </AppText>
          </View>
          <AppText muted variant="caption">
            vs
          </AppText>
          <View style={[styles.team, styles.teamRight]}>
            <AppText weight="600" numberOfLines={2} style={[styles.name, styles.nameRight]}>
              {match.team2.name}
            </AppText>
            <TeamMark code={match.team2.code} color={match.team2.color} name={match.team2.name} />
          </View>
        </View>
        {match.scoreSummary ? (
          <AppText weight="600" variant="body">
            {match.scoreSummary}
            {match.oversDisplay ? ` (${match.oversDisplay} ov)` : ''}
          </AppText>
        ) : null}
        {match.resultSummary ? (
          <AppText muted variant="caption">
            {match.resultSummary}
          </AppText>
        ) : null}
        <AppText muted variant="caption">
          {match.venue}
        </AppText>
      </Card>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  teams: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  team: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  teamRight: { justifyContent: 'flex-end' },
  name: { flex: 1, fontSize: 13 },
  nameRight: { textAlign: 'right' },
})
