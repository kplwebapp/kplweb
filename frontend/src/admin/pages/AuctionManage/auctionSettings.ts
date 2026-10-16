import {
  AUCTION_PLAYER_CATEGORIES,
  DEFAULT_MAX_PLAYERS_PER_TEAM,
  DEFAULT_POINTS_PER_TEAM,
} from '@/constants/auctionOptions'
import type { AuctionCategory, AuctionDetailRecord, AuctionSettingsInput, CategoryInput } from '@/services/api/auctionApi'

/** Form values as typed (strings), converted to API input on save. */
export type SettingsDraft = {
  title: string
  description: string
  rules: string
  auction_date: string
  venue: string
  season_id: string
  event_id: string
  budget_per_team: string
  max_players_per_team: string
  min_players_per_team: string
  min_bid_increment: string
  default_base_price: string
}

export type SettingKey = keyof SettingsDraft

export const EMPTY_SETTINGS: SettingsDraft = {
  title: '',
  description: '',
  rules: '',
  auction_date: '',
  venue: '',
  season_id: '',
  event_id: '',
  budget_per_team: String(DEFAULT_POINTS_PER_TEAM),
  max_players_per_team: String(DEFAULT_MAX_PLAYERS_PER_TEAM),
  min_players_per_team: '11',
  min_bid_increment: '500',
  default_base_price: '1000',
}

/** Settings that can still change once bidding has started (matches the API). */
export const LIVE_EDITABLE: SettingKey[] = ['title', 'description', 'rules', 'auction_date', 'venue', 'min_bid_increment']

const pad = (n: number) => String(n).padStart(2, '0')
const toLocalInput = (iso: string | null) => {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function settingsFromAuction(a: AuctionDetailRecord): SettingsDraft {
  return {
    title: a.title,
    description: a.description ?? '',
    rules: a.rules ?? '',
    auction_date: toLocalInput(a.auction_date),
    venue: a.venue ?? '',
    season_id: String(a.season_id),
    event_id: a.event_id ? String(a.event_id) : '',
    budget_per_team: String(Number(a.budget_per_team)),
    max_players_per_team: String(a.max_players_per_team),
    min_players_per_team: String(a.min_players_per_team),
    min_bid_increment: String(a.min_bid_increment),
    default_base_price: String(a.default_base_price),
  }
}

const text = (v: string) => (v.trim() ? v.trim() : null)
const int = (v: string) => Number.parseInt(v, 10)

export function settingsToInput(d: SettingsDraft): AuctionSettingsInput {
  return {
    title: d.title.trim(),
    description: text(d.description),
    rules: text(d.rules),
    auction_date: d.auction_date ? new Date(d.auction_date).toISOString() : null,
    venue: text(d.venue),
    ...(d.season_id ? { season_id: int(d.season_id) } : {}),
    event_id: d.event_id ? int(d.event_id) : null,
    budget_per_team: int(d.budget_per_team),
    max_players_per_team: int(d.max_players_per_team),
    min_players_per_team: int(d.min_players_per_team),
    min_bid_increment: int(d.min_bid_increment),
    default_base_price: int(d.default_base_price),
  }
}

/** Returns a message for the first problem, or '' when the settings can be saved. */
export function validateSettings(d: SettingsDraft): string {
  if (!d.title.trim()) return 'Please enter a title.'
  const numbers: [SettingKey, string, number][] = [
    ['budget_per_team', 'Points per team', 0],
    ['max_players_per_team', 'Maximum squad size', 1],
    ['min_players_per_team', 'Minimum squad size', 0],
    ['min_bid_increment', 'Minimum bid increment', 1],
    ['default_base_price', 'Default base points', 0],
  ]
  for (const [key, label, min] of numbers) {
    const value = Number(d[key])
    if (d[key] === '' || !Number.isInteger(value) || value < min) return `${label} must be a whole number of at least ${min}.`
  }
  if (int(d.min_players_per_team) > int(d.max_players_per_team)) return 'Minimum squad size cannot be more than the maximum.'
  return ''
}

// ---------- Player categories ----------

export type CategoryDraft = {
  key: string
  auction_category_id?: number
  name: string
  base_price: string
  min_per_team: string
  max_per_team: string
}

let draftKey = 0
export const newCategory = (): CategoryDraft => ({
  key: `new-${(draftKey += 1)}`,
  name: '',
  base_price: '',
  min_per_team: '0',
  max_per_team: '',
})

export const DEFAULT_CATEGORIES: CategoryDraft[] = AUCTION_PLAYER_CATEGORIES.map((name) => ({ ...newCategory(), key: name, name }))

export const categoriesFromApi = (list: AuctionCategory[]): CategoryDraft[] =>
  list.map((c) => ({
    key: `id-${c.auction_category_id}`,
    auction_category_id: c.auction_category_id,
    name: c.name,
    base_price: c.base_price == null ? '' : String(c.base_price),
    min_per_team: String(c.min_per_team),
    max_per_team: c.max_per_team == null ? '' : String(c.max_per_team),
  }))

export function categoriesToInput(list: CategoryDraft[]): CategoryInput[] {
  return list.map((c) => ({
    ...(c.auction_category_id ? { auction_category_id: c.auction_category_id } : {}),
    name: c.name.trim(),
    base_price: c.base_price === '' ? null : int(c.base_price),
    min_per_team: c.min_per_team === '' ? 0 : int(c.min_per_team),
    max_per_team: c.max_per_team === '' ? null : int(c.max_per_team),
  }))
}

export function validateCategories(list: CategoryDraft[]): string {
  const names = list.map((c) => c.name.trim().toLowerCase())
  if (names.some((n) => !n)) return 'Every category needs a name.'
  if (new Set(names).size !== names.length) return 'Category names must be different.'
  for (const c of list) {
    for (const v of [c.base_price, c.min_per_team, c.max_per_team]) {
      if (v !== '' && (!Number.isInteger(Number(v)) || Number(v) < 0)) return `${c.name}: numbers must be whole and not negative.`
    }
    if (c.max_per_team !== '' && int(c.max_per_team) < int(c.min_per_team || '0')) {
      return `${c.name}: the maximum per team cannot be below the minimum.`
    }
  }
  return ''
}
