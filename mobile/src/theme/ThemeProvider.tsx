import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { useColorScheme } from 'react-native'
import { darkTheme, lightTheme } from './themes'
import type { AppTheme } from './types'

type ThemeContextValue = {
  theme: AppTheme
  toggleTheme: () => void
  setDark: (dark: boolean) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme()
  const [override, setOverride] = useState<boolean | null>(null)
  const dark = override ?? system === 'dark'
  const theme = dark ? darkTheme : lightTheme

  const value = useMemo(
    () => ({
      theme,
      toggleTheme: () => setOverride((prev) => !(prev ?? dark)),
      setDark: (next: boolean) => setOverride(next),
    }),
    [theme, dark],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
