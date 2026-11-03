import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

const WELCOME_KEY = 'kpl.welcomeSeen'
const ACCESS_KEY = 'kpl.accessToken'
const REFRESH_KEY = 'kpl.refreshToken'

async function setSecure(key: string, value: string) {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(key, value)
    return
  }
  await SecureStore.setItemAsync(key, value)
}

async function getSecure(key: string) {
  if (Platform.OS === 'web') return AsyncStorage.getItem(key)
  return SecureStore.getItemAsync(key)
}

async function deleteSecure(key: string) {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(key)
    return
  }
  await SecureStore.deleteItemAsync(key)
}

export const authStorage = {
  getWelcomeSeen: () => AsyncStorage.getItem(WELCOME_KEY).then((v) => v === '1'),
  setWelcomeSeen: () => AsyncStorage.setItem(WELCOME_KEY, '1'),
  clearWelcomeSeen: () => AsyncStorage.removeItem(WELCOME_KEY),

  getTokens: async () => {
    const [accessToken, refreshToken] = await Promise.all([getSecure(ACCESS_KEY), getSecure(REFRESH_KEY)])
    return { accessToken, refreshToken }
  },

  setTokens: async (accessToken: string, refreshToken: string) => {
    await Promise.all([setSecure(ACCESS_KEY, accessToken), setSecure(REFRESH_KEY, refreshToken)])
  },

  clearTokens: async () => {
    await Promise.all([deleteSecure(ACCESS_KEY), deleteSecure(REFRESH_KEY)])
  },
}
