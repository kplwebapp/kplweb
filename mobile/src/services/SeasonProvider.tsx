import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useSeasons } from '@/hooks/useKplData'

type SeasonContextValue = {
  seasonId: number | null
  seasonLabel: string
  setSeasonId: (id: number | null) => void
}

const SeasonContext = createContext<SeasonContextValue | null>(null)

export function SeasonProvider({ children }: { children: ReactNode }) {
  const seasonsQuery = useSeasons()
  const [seasonId, setSeasonId] = useState<number | null>(null)

  useEffect(() => {
    if (seasonId != null) return
    const first = seasonsQuery.data?.[0]
    if (first) setSeasonId(first.season_id)
  }, [seasonsQuery.data, seasonId])

  const seasonLabel = useMemo(() => {
    const match = seasonsQuery.data?.find((s) => s.season_id === seasonId)
    if (!match) return seasonsQuery.isLoading ? 'Loading season…' : 'All seasons'
    return `${match.season_name} (${match.season_year})`
  }, [seasonsQuery.data, seasonsQuery.isLoading, seasonId])

  const value = useMemo(
    () => ({
      seasonId,
      seasonLabel,
      setSeasonId,
    }),
    [seasonId, seasonLabel],
  )

  return <SeasonContext.Provider value={value}>{children}</SeasonContext.Provider>
}

export function useSeason() {
  const ctx = useContext(SeasonContext)
  if (!ctx) throw new Error('useSeason must be used within SeasonProvider')
  return ctx
}
