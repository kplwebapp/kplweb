import { RefreshControl, ScrollView, StyleSheet, View, type ViewProps } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTheme } from '@/theme/ThemeProvider'
import { spacing } from '@/theme/spacing'

type Props = ViewProps & {
  scroll?: boolean
  refreshing?: boolean
  onRefresh?: () => void
  /** Include top inset when this screen has no AppHeader / stack header above it. */
  includeTopSafeArea?: boolean
}

export function Screen({
  scroll,
  refreshing,
  onRefresh,
  includeTopSafeArea = false,
  style,
  children,
  ...rest
}: Props) {
  const { theme } = useTheme()
  const edges = includeTopSafeArea
    ? (['top', 'left', 'right'] as const)
    : (['left', 'right'] as const)
  const body = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.content, style]}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, style]} {...rest}>
      {children}
    </View>
  )

  return (
    <SafeAreaView edges={[...edges]} style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      {body}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
})
