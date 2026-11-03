import { View, StyleSheet } from 'react-native'
import { AppText } from './AppText'
import { useTheme } from '@/theme/ThemeProvider'
import { radii, spacing } from '@/theme/spacing'

type Props = { label: string; tone?: 'live' | 'neutral' | 'success' | 'gold' }

export function StatusBadge({ label, tone = 'neutral' }: Props) {
  const { theme } = useTheme()
  const bg =
    tone === 'live'
      ? theme.colors.live
      : tone === 'success'
        ? theme.colors.coral
        : tone === 'gold'
          ? theme.colors.gold
          : theme.colors.border
  const color =
    tone === 'neutral'
      ? theme.colors.text
      : tone === 'gold'
        ? theme.colors.onAccent
        : '#FFFFFF'
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <AppText variant="micro" weight="700" color={color}>
        {label.toUpperCase()}
      </AppText>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
})
