import { Image, View, StyleSheet, type ImageSourcePropType } from 'react-native'
import { AppText } from './AppText'
import { radii } from '@/theme/spacing'
import { resolveTeamLogo } from '@/constants/teamLogos'

type Props = {
  code: string
  color: string
  size?: number
  name?: string
  logo?: ImageSourcePropType | null
}

export function TeamMark({ code, color, size = 40, name, logo }: Props) {
  const source = logo ?? resolveTeamLogo(name) ?? resolveTeamLogo(code)

  if (source) {
    return (
      <Image
        source={source}
        accessibilityLabel={name || `Team ${code}`}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    )
  }

  return (
    <View
      accessibilityLabel={name || `Team ${code}`}
      style={[
        styles.mark,
        {
          width: size,
          height: size,
          borderRadius: radii.md,
          backgroundColor: color,
        },
      ]}
    >
      <AppText variant="caption" weight="700" color="#FFFFFF">
        {code.slice(0, 3)}
      </AppText>
    </View>
  )
}

const styles = StyleSheet.create({
  mark: {
    alignItems: 'center',
    justifyContent: 'center',
  },
})
