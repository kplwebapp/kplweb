import { Pressable, StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { AppHeader } from '@/components/layout/AppHeader'
import { AppText } from '@/components/ui/AppText'
import { Card } from '@/components/ui/Card'
import { PreviewBanner } from '@/components/ui/PreviewBanner'
import { Screen } from '@/components/ui/Screen'
import { useTheme } from '@/theme/ThemeProvider'
import { spacing } from '@/theme/spacing'

const links = [
  { label: 'Points Table', href: '/points-table', icon: 'podium-outline' as const },
  { label: 'Statistics', href: '/statistics', icon: 'stats-chart-outline' as const },
  { label: 'Gallery', href: '/gallery', icon: 'images-outline' as const },
  { label: 'Events', href: '/events', icon: 'calendar-outline' as const },
  { label: 'Sponsors', href: '/sponsors', icon: 'ribbon-outline' as const },
  { label: 'About KPL', href: '/about', icon: 'information-circle-outline' as const },
  { label: 'Contact', href: '/contact', icon: 'mail-outline' as const },
  { label: 'Legal', href: '/legal', icon: 'document-text-outline' as const },
  { label: 'Settings', href: '/settings', icon: 'settings-outline' as const },
  { label: 'Account', href: '/account', icon: 'person-outline' as const },
]

export function MoreScreen() {
  const router = useRouter()
  const { theme } = useTheme()
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <AppHeader title="More" />
      <Screen scroll>
        <PreviewBanner />
        <Card padded={false}>
          {links.map((item, index) => (
            <Pressable
              key={item.href}
              onPress={() => router.push(item.href)}
              style={[
                styles.row,
                {
                  borderBottomColor: theme.colors.border,
                  borderBottomWidth: index === links.length - 1 ? 0 : StyleSheet.hairlineWidth,
                },
              ]}
            >
              <Ionicons name={item.icon} size={20} color={theme.colors.primary} />
              <AppText weight="600" style={{ flex: 1 }}>
                {item.label}
              </AppText>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
            </Pressable>
          ))}
        </Card>
      </Screen>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
})
