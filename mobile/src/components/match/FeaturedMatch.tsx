import { StyleSheet, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { AppText } from '@/components/ui/AppText'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { TeamMark } from '@/components/ui/TeamMark'
import type { PreviewMatch } from '@/fixtures/previewData'
import { formatMatchWhen } from '@/utils/datetime'
import { useTheme } from '@/theme/ThemeProvider'
import { radii, spacing } from '@/theme/spacing'

export function FeaturedMatch({ match }: { match: PreviewMatch }) {
  const { theme } = useTheme()
  const router = useRouter()
  return (
    <LinearGradient
      colors={[theme.colors.deepNavy, theme.colors.magenta, theme.colors.rose]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <StatusBadge label={match.status === 'live' ? 'Live now' : 'Next up'} tone={match.status === 'live' ? 'live' : 'gold'} />
      <View style={styles.row}>
        <View style={styles.side}>
          <TeamMark code={match.team1.code} color={match.team1.color} name={match.team1.name} size={56} />
          <AppText color="#FFFFFF" weight="700" style={{ textAlign: 'center' }} numberOfLines={2}>
            {match.team1.name}
          </AppText>
        </View>
        <AppText color={theme.colors.highlight} weight="700">
          VS
        </AppText>
        <View style={styles.side}>
          <TeamMark code={match.team2.code} color={match.team2.color} name={match.team2.name} size={56} />
          <AppText color="#FFFFFF" weight="700" style={{ textAlign: 'center' }} numberOfLines={2}>
            {match.team2.name}
          </AppText>
        </View>
      </View>
      {match.scoreSummary ? (
        <AppText color="#FFFFFF" variant="title" weight="700">
          {match.scoreSummary}
          {match.oversDisplay ? ` · ${match.oversDisplay} ov` : ''}
        </AppText>
      ) : (
        <AppText color="#FFE8C8" muted>
          {formatMatchWhen(match.startsAt)}
        </AppText>
      )}
      <AppText color="#FFD6A8" variant="caption">
        {match.venue}
      </AppText>
      <Button
        label="View Match"
        variant="onDark"
        onPress={() => router.push(`/match/${match.id}`)}
      />
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  side: { alignItems: 'center', gap: spacing.sm, flex: 1 },
})
