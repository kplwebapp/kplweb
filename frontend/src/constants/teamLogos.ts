import valsadWarriors from '@/assets/teams/valsad-warriors.png'
import friendsCricketers from '@/assets/teams/friends-cricketers.png'
import omisolChampions from '@/assets/teams/omisol-champions.png'
import mahakaliTigers from '@/assets/teams/mahakali-tigers.png'
import fearlessFalcons from '@/assets/teams/fearless-falcons.png'
import superStrikers from '@/assets/teams/super-strikers.png'

const TEAM_LOGOS: { match: RegExp; src: string }[] = [
  { match: /valsad|warrior/i, src: valsadWarriors },
  { match: /friend/i, src: friendsCricketers },
  { match: /omisol|champion/i, src: omisolChampions },
  { match: /mahakali|tiger/i, src: mahakaliTigers },
  { match: /fearless|falcon/i, src: fearlessFalcons },
  { match: /super|striker/i, src: superStrikers },
]

/** Bundled KPL team crests — used when API has no uploaded logo. */
export function resolveTeamLogoSrc(name?: string | null): string | null {
  if (!name) return null
  const hit = TEAM_LOGOS.find((entry) => entry.match.test(name))
  return hit?.src ?? null
}
