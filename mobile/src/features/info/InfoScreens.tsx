import type { ReactNode } from 'react'
import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { AppText } from '@/components/ui/AppText'
import { Card } from '@/components/ui/Card'
import { PreviewBanner } from '@/components/ui/PreviewBanner'
import { Screen } from '@/components/ui/Screen'
import { Button } from '@/components/ui/Button'
import { useSponsors } from '@/hooks/useKplData'
import { useAuth } from '@/services/AuthProvider'
import { useTheme } from '@/theme/ThemeProvider'

function InfoShell({
  title,
  body,
  children,
}: {
  title: string
  body: string
  children?: ReactNode
}) {
  const { theme } = useTheme()
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Screen scroll>
        <PreviewBanner />
        <AppText variant="title" weight="700">
          {title}
        </AppText>
        <Card>
          <AppText muted>{body}</AppText>
          {children}
        </Card>
      </Screen>
    </View>
  )
}

export function GalleryScreen() {
  return (
    <InfoShell
      title="Gallery"
      body="Public gallery images will load from GET /api/gallery in Phase 5. Full-screen viewer comes with that wiring."
    />
  )
}

export function EventsScreen() {
  return (
    <InfoShell
      title="Events"
      body="Tournaments and events will use GET /api/events and slug detail routes already available on the backend."
    />
  )
}

export function SponsorsScreen() {
  const { theme } = useTheme()
  const sponsorsQuery = useSponsors()

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Screen scroll refreshing={sponsorsQuery.isRefetching} onRefresh={() => sponsorsQuery.refetch()}>
        <AppText variant="title" weight="700">
          Sponsors
        </AppText>
        <AppText muted variant="caption">
          Same public sponsors list as the website (GET /api/sponsors).
        </AppText>
        {sponsorsQuery.isError ? (
          <AppText color={theme.colors.danger}>Could not load sponsors.</AppText>
        ) : null}
        {(sponsorsQuery.data ?? []).length === 0 && !sponsorsQuery.isLoading ? (
          <Card>
            <AppText muted>No sponsors published yet.</AppText>
          </Card>
        ) : (
          (sponsorsQuery.data ?? []).map((s) => (
            <Card key={s.sponsor_id}>
              <AppText weight="700">{s.sponsor_name}</AppText>
              {s.tier ? (
                <AppText muted variant="caption">
                  {s.tier}
                </AppText>
              ) : null}
              {s.website_url ? (
                <AppText muted variant="caption">
                  {s.website_url}
                </AppText>
              ) : null}
            </Card>
          ))
        )}
      </Screen>
    </View>
  )
}

export function AboutScreen() {
  return (
    <InfoShell
      title="About KPL"
      body="About content can reuse GET /api/pages/about (or the site CMS slug). Kansara Premier League is a community cricket tournament platform."
    />
  )
}

export function ContactScreen() {
  return (
    <InfoShell
      title="Contact"
      body="Contact submissions can POST to /api/contact. Forms and validation arrive in a later phase."
    />
  )
}

export function LegalScreen() {
  return (
    <InfoShell
      title="Legal"
      body="Privacy Policy and Terms placeholders. Publish official copy before store release."
    />
  )
}

export function SettingsScreen() {
  const { theme, toggleTheme } = useTheme()
  return (
    <InfoShell title="Settings" body="Theme preference and future notification toggles.">
      <View style={{ marginTop: 12 }}>
        <Button label={theme.dark ? 'Switch to light theme' : 'Switch to dark theme'} onPress={toggleTheme} />
      </View>
    </InfoShell>
  )
}

export function AccountScreen() {
  const { theme } = useTheme()
  const { user, signOut } = useAuth()
  const router = useRouter()

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Screen scroll>
        <PreviewBanner />
        <AppText variant="title" weight="700">
          Account
        </AppText>
        <Card>
          <AppText weight="700">{user?.full_name || 'Member'}</AppText>
          <AppText muted>{user?.email}</AppText>
          <AppText muted>{user?.mobile || 'No mobile on file'}</AppText>
          <AppText muted variant="caption" style={{ marginTop: 8 }}>
            Community membership. Privileged admin tools remain on the website.
          </AppText>
          <View style={{ marginTop: 16 }}>
            <Button
              label="Sign out"
              variant="secondary"
              onPress={async () => {
                await signOut()
                router.replace('/login')
              }}
            />
          </View>
        </Card>
      </Screen>
    </View>
  )
}

export function NotificationsScreen() {
  return (
    <InfoShell
      title="Notifications"
      body="Push delivery is not implemented. Backend /api/notifications is staff-oriented today. Preferences and triggers need explicit approval before Phase 5 work."
    />
  )
}
