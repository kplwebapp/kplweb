import { View, StyleSheet } from 'react-native'
import { AppText } from './AppText'
import { USE_PREVIEW_FIXTURES } from '@/constants/config'
import { useTheme } from '@/theme/ThemeProvider'
import { radii, spacing } from '@/theme/spacing'

/** Only shown when fixtures are forced on — live browse uses the website API. */
export function PreviewBanner() {
  const { theme } = useTheme()
  if (!USE_PREVIEW_FIXTURES) return null
  return (
    <View style={[styles.wrap, { backgroundColor: theme.colors.gold }]}>
      <AppText variant="micro" weight="700" color="#111827">
        PREVIEW LAYOUT DATA — not live scores or production API
      </AppText>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
})
