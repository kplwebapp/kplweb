import { View, type ViewProps, StyleSheet } from 'react-native'
import { useTheme } from '@/theme/ThemeProvider'
import { radii, spacing } from '@/theme/spacing'

type Props = ViewProps & { padded?: boolean }

export function Card({ padded = true, style, children, ...rest }: Props) {
  const { theme } = useTheme()
  return (
    <View
      {...rest}
      style={[
        styles.base,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
        padded && styles.padded,
        style,
      ]}
    >
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#03015e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  padded: {
    padding: spacing.lg,
  },
})
