import type { ImageSourcePropType } from 'react-native'
import valsadWarriors from '@/assets/teams/valsad-warriors.png'
import friendsCricketers from '@/assets/teams/friends-cricketers.png'
import omisolChampions from '@/assets/teams/omisol-champions.png'
import mahakaliTigers from '@/assets/teams/mahakali-tigers.png'
import fearlessFalcons from '@/assets/teams/fearless-falcons.png'
import superStrikers from '@/assets/teams/super-strikers.png'

const TEAM_LOGOS: { match: RegExp; source: ImageSourcePropType; color: string }[] = [
  { match: /valsad|warrior/i, source: valsadWarriors, color: '#03015e' },
  { match: /friend/i, source: friendsCricketers, color: '#feb148' },
  { match: /omisol|champion/i, source: omisolChampions, color: '#0B3D91' },
  { match: /mahakali|tiger/i, source: mahakaliTigers, color: '#ec6948' },
  { match: /fearless|falcon/i, source: fearlessFalcons, color: '#1E90FF' },
  { match: /super|striker/i, source: superStrikers, color: '#c11f56' },
]

export function resolveTeamLogo(nameOrCode?: string | null): ImageSourcePropType | null {
  if (!nameOrCode) return null
  const hit = TEAM_LOGOS.find((entry) => entry.match.test(nameOrCode))
  return hit?.source ?? null
}

export function resolveTeamBrandColor(nameOrCode?: string | null, fallback = '#03015e') {
  if (!nameOrCode) return fallback
  const hit = TEAM_LOGOS.find((entry) => entry.match.test(nameOrCode))
  return hit?.color ?? fallback
}
