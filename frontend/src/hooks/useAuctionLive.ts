import { useEffect, useState } from 'react'
import { auctionPublicApi, type AuctionSnapshot } from '@/services/api/auctionApi'

export type LiveMode = 'connecting' | 'live' | 'reconnecting' | 'polling'

/** Fallback poll when the live stream is unavailable. */
const POLL_MS = 4000
/** Always re-fetch the board at least this often, including while streaming. */
const REFRESH_MS = 2 * 60 * 1000
const NOT_FOUND = 'Auction not found'
export const UNAVAILABLE = 'This auction is not available.'

type State = { id: number; snapshot: AuctionSnapshot | null; mode: LiveMode; error: string }

/**
 * The public view of an auction, kept up to date. Listens to the server's live stream so that
 * sold / unsold / next-player changes appear immediately; also refreshes every 2 minutes as a
 * safety net. If the stream is refused or unavailable, polls every few seconds instead.
 */
export function useAuctionLive(auctionId: number | null) {
  const [state, setState] = useState<State | null>(null)

  useEffect(() => {
    if (!auctionId) return
    let closed = false
    let poll: number | undefined
    let refresh: number | undefined
    let source: EventSource | null = null

    const update = (patch: Partial<State>) => {
      if (closed) return
      setState((prev) => {
        const current = prev?.id === auctionId ? prev : { id: auctionId, snapshot: null, mode: 'connecting' as LiveMode, error: '' }
        const incoming = patch.snapshot
        if (patch.error === UNAVAILABLE) return { ...current, ...patch }
        if (incoming && current.snapshot && incoming.auction.version < current.snapshot.auction.version) {
          return { ...current, mode: patch.mode ?? current.mode }
        }
        return { ...current, ...patch }
      })
    }

    const fetchOnce = () =>
      auctionPublicApi
        .snapshot(auctionId)
        .then((res) => update({ snapshot: res.data, error: '' }))
        .catch((err) => {
          const message = err instanceof Error ? err.message : ''
          if (message === NOT_FOUND) gone()
          else update({ error: message || 'Could not load the auction.' })
        })

    const gone = () => {
      source?.close()
      stopPolling()
      stopRefresh()
      update({ snapshot: null, error: UNAVAILABLE })
    }

    const startPolling = () => {
      if (poll) return
      update({ mode: 'polling' })
      fetchOnce()
      poll = window.setInterval(fetchOnce, POLL_MS)
    }
    const stopPolling = () => {
      window.clearInterval(poll)
      poll = undefined
    }

    const startRefresh = () => {
      if (refresh) return
      refresh = window.setInterval(fetchOnce, REFRESH_MS)
    }
    const stopRefresh = () => {
      window.clearInterval(refresh)
      refresh = undefined
    }

    // Immediate load, then a 2-minute refresh for the whole board (player panel included).
    fetchOnce()
    startRefresh()

    if (typeof EventSource === 'undefined') {
      startPolling()
    } else {
      source = new EventSource(auctionPublicApi.streamUrl(auctionId))
      source.addEventListener('snapshot', (event) => {
        stopPolling()
        update({
          snapshot: JSON.parse((event as MessageEvent<string>).data) as AuctionSnapshot,
          mode: 'live',
          error: '',
        })
      })
      source.addEventListener('gone', gone)
      source.onerror = () => {
        // A refused stream closes for good; a dropped one reconnects by itself.
        if (source?.readyState === EventSource.CLOSED) {
          startPolling()
        } else {
          update({ mode: 'reconnecting' })
          fetchOnce()
        }
      }
    }

    return () => {
      closed = true
      source?.close()
      stopPolling()
      stopRefresh()
    }
  }, [auctionId])

  const current = auctionId && state?.id === auctionId ? state : null
  return {
    snapshot: current?.snapshot ?? null,
    mode: current?.mode ?? ('connecting' as LiveMode),
    error: current?.error ?? '',
    loading: !current?.snapshot && !current?.error,
  }
}
