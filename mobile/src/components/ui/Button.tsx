import { Pressable, StyleSheet, type PressableProps } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { AppText } from './AppText'
import { useTheme } from '@/theme/ThemeProvider'
import { radii, spacing } from '@/theme/spacing'

type Variant = 'primary' | 'secondary' | 'ghost' | 'onDark'

type Props = PressableProps & {
  label: string
  variant?: Variant
}

export function Button({ label, variant = 'primary', disabled, style, ...rest }: Props) {
  const { theme } = useTheme()

  if (variant === 'primary' || variant === 'onDark') {
    const colors =
      variant === 'onDark'
        ? [theme.colors.gold, theme.colors.highlight]
        : [theme.colors.magenta, theme.colors.rose, theme.colors.coral]
    const labelColor = variant === 'onDark' ? theme.colors.onAccent : '#FFFFFF'
    return (
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        style={({ pressed }) => [
          { opacity: disabled ? 0.5 : pressed ? 0.9 : 1, borderRadius: radii.md, overflow: 'hidden' },
          style as object,
        ]}
        {...rest}
      >
        <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.base}>
          <AppText weight="600" color={labelColor} variant="body">
            {label}
          </AppText>
        </LinearGradient>
      </Pressable>
    )
  }

  const bg = variant === 'secondary' ? theme.colors.surface : 'transparent'
  const text = theme.colors.primary
  const border = variant === 'secondary' ? theme.colors.magenta : 'transparent'

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: bg,
          borderColor: border,
          opacity: disabled ? 0.5 : pressed ? 0.88 : 1,
        },
        style as object,
      ]}
      {...rest}
    >
      <AppText weight="600" color={text} variant="body">
        {label}
      </AppText>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
