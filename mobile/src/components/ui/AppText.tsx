import { Text, type TextProps, type TextStyle } from 'react-native'
import { useTheme } from '@/theme/ThemeProvider'
import { typography } from '@/theme/spacing'

type Variant = 'hero' | 'title' | 'subtitle' | 'body' | 'caption' | 'micro'

const sizeMap: Record<Variant, number> = {
  hero: typography.hero,
  title: typography.title,
  subtitle: typography.subtitle,
  body: typography.body,
  caption: typography.caption,
  micro: typography.micro,
}

type Props = TextProps & {
  variant?: Variant
  muted?: boolean
  weight?: TextStyle['fontWeight']
  color?: string
}

export function AppText({
  variant = 'body',
  muted,
  weight = '400',
  color,
  style,
  ...rest
}: Props) {
  const { theme } = useTheme()
  return (
    <Text
      {...rest}
      style={[
        {
          fontFamily: 'Poppins_400Regular',
          fontSize: sizeMap[variant],
          fontWeight: weight,
          color: color ?? (muted ? theme.colors.textSecondary : theme.colors.text),
        },
        weight === '600' || weight === '700' ? { fontFamily: 'Poppins_600SemiBold' } : null,
        weight === '500' ? { fontFamily: 'Poppins_500Medium' } : null,
        style,
      ]}
    />
  )
}
