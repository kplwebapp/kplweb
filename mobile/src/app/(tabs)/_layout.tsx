import { ActivityIndicator, View } from 'react-native'
import { Redirect, Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '@/theme/ThemeProvider'
import { useAuth } from '@/services/AuthProvider'

function tabIcon(name: keyof typeof Ionicons.glyphMap, color: string, size: number) {
  return <Ionicons name={name} color={color} size={size} />
}

export default function TabsLayout() {
  const { theme } = useTheme()
  const { status } = useAuth()
  const inactive = theme.colors.textSecondary

  if (status === 'loading') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    )
  }
  if (status !== 'authenticated') return <Redirect href="/login" />

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.magenta,
        tabBarInactiveTintColor: inactive,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.gold,
          borderTopWidth: 2,
        },
        tabBarLabelStyle: { fontFamily: 'Poppins_500Medium', fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) =>
            tabIcon('home-outline', typeof color === 'string' ? color : inactive, size),
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: 'Matches',
          tabBarIcon: ({ color, size }) =>
            tabIcon('baseball-outline', typeof color === 'string' ? color : inactive, size),
        }}
      />
      <Tabs.Screen
        name="teams"
        options={{
          title: 'Teams',
          tabBarIcon: ({ color, size }) =>
            tabIcon('people-outline', typeof color === 'string' ? color : inactive, size),
        }}
      />
      <Tabs.Screen
        name="auction"
        options={{
          title: 'Auction',
          tabBarIcon: ({ color, size }) =>
            tabIcon('pricetag-outline', typeof color === 'string' ? color : inactive, size),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color, size }) =>
            tabIcon('menu-outline', typeof color === 'string' ? color : inactive, size),
        }}
      />
    </Tabs>
  )
}
