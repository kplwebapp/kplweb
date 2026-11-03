export type ThemeColors = {
  primary: string
  primaryMuted: string
  deepNavy: string
  magenta: string
  rose: string
  coral: string
  cricketGreen: string
  gold: string
  highlight: string
  background: string
  surface: string
  text: string
  textSecondary: string
  border: string
  danger: string
  live: string
  overlay: string
  /** Readable text on gold / highlight chips */
  onAccent: string
}

export type AppTheme = {
  dark: boolean
  colors: ThemeColors
}

/** Official KPL mobile palette */
export const palette = {
  indigo: '#03015e',
  magenta: '#7c0061',
  rose: '#c11f56',
  coral: '#ec6948',
  gold: '#feb148',
  highlight: '#f9f871',
} as const
