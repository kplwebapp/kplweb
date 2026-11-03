import { Pressable, StyleSheet, View } from 'react-native'
import { AppText } from './AppText'
import { useTheme } from '@/theme/ThemeProvider'

type Props = {
  title: string
  actionLabel?: string
  onAction?: () => void
}

export function SectionHeader({ title, actionLabel, onAction }: Props) {
  const { theme } = useTheme()
  return (
    <View style={styles.row}>
      <AppText variant="subtitle" weight="700">
        {title}
      </AppText>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} accessibilityRole="button" hitSlop={8}>
          <AppText variant="caption" weight="600" color={theme.colors.primary}>
            {actionLabel}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
})
