/**
 * Accessibility text size (A+ / A / A-). Stored as a step and applied as a multiplier on top of the
 * fluid root font size, so text keeps adapting to the screen while honouring the user's choice.
 */
const STORAGE_KEY = 'kpl-font-level'
const LEGACY_KEY = 'kpl-font-size'
const STEP = 0.08
export const FONT_LEVEL_MIN = -3
export const FONT_LEVEL_MAX = 3

const clampLevel = (level: number) => Math.min(FONT_LEVEL_MAX, Math.max(FONT_LEVEL_MIN, Math.round(level)))

export function getFontLevel(): number {
  try {
    const stored = Number(localStorage.getItem(STORAGE_KEY))
    return Number.isFinite(stored) ? clampLevel(stored) : 0
  } catch {
    return 0
  }
}

export function setFontLevel(level: number): number {
  const next = clampLevel(level)
  document.documentElement.style.setProperty('--font-scale', String(1 + next * STEP))
  try {
    localStorage.setItem(STORAGE_KEY, String(next))
  } catch {
    /* storage unavailable: the choice just won't persist */
  }
  return next
}

/** Applies the saved level on startup and clears the old fixed-pixel setting. */
export function initFontScale() {
  document.documentElement.style.removeProperty('font-size')
  try {
    localStorage.removeItem(LEGACY_KEY)
  } catch {
    /* ignore */
  }
  setFontLevel(getFontLevel())
}
