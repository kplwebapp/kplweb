import { palette, type AppTheme } from './types'

/** Light theme — colorful KPL palette. */
export const lightTheme: AppTheme = {
  dark: false,
  colors: {
    primary: palette.indigo,
    primaryMuted: palette.magenta,
    deepNavy: palette.indigo,
    magenta: palette.magenta,
    rose: palette.rose,
    coral: palette.coral,
    cricketGreen: palette.coral,
    gold: palette.gold,
    highlight: palette.highlight,
    background: '#FFF8EC',
    surface: '#FFFFFF',
    text: '#1A1040',
    textSecondary: '#6B5B7A',
    border: '#F0D9B8',
    danger: palette.rose,
    live: palette.rose,
    overlay: 'rgba(3, 1, 94, 0.55)',
    onAccent: palette.indigo,
  },
}

export const darkTheme: AppTheme = {
  dark: true,
  colors: {
    primary: '#A78BFA',
    primaryMuted: '#E879A9',
    deepNavy: '#120B3A',
    magenta: '#C84B9A',
    rose: '#F06292',
    coral: '#FF8A65',
    cricketGreen: '#FF8A65',
    gold: palette.gold,
    highlight: palette.highlight,
    background: '#0A0624',
    surface: '#16103A',
    text: '#FFF8EC',
    textSecondary: '#D4C4E0',
    border: '#3A2A5C',
    danger: '#F06292',
    live: '#F06292',
    overlay: 'rgba(10, 6, 36, 0.7)',
    onAccent: palette.indigo,
  },
}
