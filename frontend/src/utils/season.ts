import type { Season } from '@/services/api/publicApi'

/** Prefer KPL Season 4 (2026) when present; otherwise fall back to first season from API. */
export function pickDefaultSeason(seasons: Season[]): Season | null {
  if (seasons.length === 0) return null

  const season4 = seasons.find(
    (s) =>
      s.season_year === 2026 ||
      s.season_year === 4 ||
      /season\s*4/i.test(s.season_name)
  )
  return season4 ?? seasons[0]
}
