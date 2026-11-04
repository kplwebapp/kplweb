import { ActivityIndicator, View } from 'react-native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { QueryClientProvider } from '@tanstack/react-query'
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  useFonts,
} from '@expo-google-fonts/poppins'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider'
import { SeasonProvider } from '@/services/SeasonProvider'
import { AuthProvider } from '@/services/AuthProvider'
import { queryClient } from '@/services/queryClient'

function RootNavigator() {
  const { theme } = useTheme()
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.primary },
          headerTintColor: '#FFF8EC',
          headerTitleStyle: { fontFamily: 'Poppins_600SemiBold', color: '#FFF8EC' },
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: 'Login', headerBackVisible: false }} />
        <Stack.Screen name="register" options={{ title: 'Register' }} />
        <Stack.Screen name="pending-approval" options={{ title: 'Pending approval', headerBackVisible: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="match/[id]" options={{ title: 'Match' }} />
        <Stack.Screen name="team/[id]" options={{ title: 'Team' }} />
        <Stack.Screen name="auction/[id]" options={{ title: 'Auction' }} />
        <Stack.Screen name="points-table" options={{ title: 'Points Table' }} />
        <Stack.Screen name="statistics" options={{ title: 'Statistics' }} />
        <Stack.Screen name="gallery" options={{ title: 'Gallery' }} />
        <Stack.Screen name="events" options={{ title: 'Events' }} />
        <Stack.Screen name="sponsors" options={{ title: 'Sponsors' }} />
        <Stack.Screen name="about" options={{ title: 'About' }} />
        <Stack.Screen name="contact" options={{ title: 'Contact' }} />
        <Stack.Screen name="legal" options={{ title: 'Legal' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
        <Stack.Screen name="account" options={{ title: 'Account' }} />
        <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
        <Stack.Screen name="+not-found" options={{ title: 'Not found' }} />
        <Stack.Screen name="+error" options={{ title: 'Error', headerShown: false }} />
      </Stack>
    </>
  )
}

export default function RootLayout() {
  const [loaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
  })

  if (!loaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF8EC' }}>
        <ActivityIndicator size="large" color="#7c0061" />
      </View>
    )
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AuthProvider>
              <SeasonProvider>
                <RootNavigator />
              </SeasonProvider>
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
