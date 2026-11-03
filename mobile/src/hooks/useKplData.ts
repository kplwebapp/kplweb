import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/services/AuthProvider'
import { kplApi } from '@/services/api/kplApi'
import { mapAuction, mapMatch, mapStanding, mapTeam } from '@/services/mappers'

export function useSeasons() {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: ['seasons'],
    queryFn: () => kplApi.getSeasons({ token: accessToken }),
  })
}

export function usePointsTable(seasonId?: number | null) {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: ['points-table', seasonId ?? 'all'],
    queryFn: async () => {
      const rows = await kplApi.getPointsTable(seasonId, { token: accessToken })
      return rows.map((row, index) => mapStanding(row, index + 1))
    },
  })
}

export function useMatches(seasonId?: number | null) {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: ['matches', seasonId ?? 'all'],
    queryFn: async () => {
      const rows = await kplApi.listMatches({ seasonId }, { token: accessToken })
      return rows.map(mapMatch)
    },
  })
}

export function useMatch(id: string) {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: ['match', id],
    enabled: Boolean(id),
    queryFn: async () => mapMatch(await kplApi.getMatch(id, { token: accessToken })),
  })
}

export function useTeams() {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const rows = await kplApi.listTeams({ token: accessToken })
      return rows.filter((row) => row.is_active !== false).map(mapTeam)
    },
  })
}

export function useAuctions() {
  return useQuery({
    queryKey: ['auctions-public'],
    queryFn: async () => {
      const rows = await kplApi.listAuctions()
      return rows.map(mapAuction)
    },
  })
}

export function useSponsors() {
  return useQuery({
    queryKey: ['sponsors'],
    queryFn: () => kplApi.listSponsors(),
  })
}
