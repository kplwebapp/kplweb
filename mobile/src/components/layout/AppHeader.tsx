import { Image, Pressable, StyleSheet, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { spacing } from '@/theme/spacing'
import { palette } from '@/theme/types'
import logoWhite from '@/assets/kpl-logo-white.png'

type Props = {
  /** Kept for call-site compatibility; title text is not shown in the header. */
  title?: string
}

export function AppHeader(_props: Props) {
  const router = useRouter()
  const insets = useSafeAreaInsets()

  return (
    <View style={styles.shell}>
      <LinearGradient
        colors={[palette.indigo, palette.magenta, palette.rose]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.wrap, { paddingTop: Math.max(insets.top, spacing.sm) + spacing.sm }]}
      >
        <Image source={logoWhite} style={styles.logo} accessibilityLabel="Kansara Premier League" />
        <View style={styles.actions}>
          <Pressable
            accessibilityLabel="Notifications"
            hitSlop={8}
            onPress={() => router.push('/notifications')}
            style={styles.iconBtn}
          >
            <Ionicons name="notifications-outline" size={20} color="#FFF8EC" />
          </Pressable>
          <Pressable
            accessibilityLabel="Account"
            hitSlop={8}
            onPress={() => router.push('/account')}
            style={styles.iconBtn}
          >
            <Ionicons name="person-circle-outline" size={24} color="#FFF8EC" />
          </Pressable>
        </View>
      </LinearGradient>
      <LinearGradient
        colors={[palette.coral, palette.gold, palette.highlight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.accentRule}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  shell: {
    zIndex: 10,
    elevation: 8,
    shadowColor: palette.indigo,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
  },
  wrap: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  accentRule: {
    height: 4,
  },
  logo: { width: 55, height: 55, resizeMode: 'contain' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 0 },
  iconBtn: {
    width: 36,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 248, 236, 0.16)',
    marginLeft: 6,
  },
})
