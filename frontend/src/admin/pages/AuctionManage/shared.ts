import { useCallback, useEffect, useState } from 'react'
import { useAuctionLive } from '@/hooks/useAuctionLive'
import { auctionAdminApi, type AuctionDetail } from '@/services/api/auctionApi'
import type { ConfirmRequest } from './ConfirmModal'

/** Runs an auction action, reports the result and refreshes. Resolves true on success. */
export type RunAction = (action: () => Promise<unknown>, success?: string) => Promise<boolean>

export type TabProps = {
  detail: AuctionDetail
  auctionId: number
  run: RunAction
  ask: (request: ConfirmRequest) => void
}

type State = { id: number; data: AuctionDetail | null; error: string }

const PUBLIC_STATUSES = ['READY', 'LIVE', 'PAUSED', 'COMPLETED']

/**
 * The admin view of one auction. Once the auction is public it also follows the live stream and
 * refetches whenever another operator changes something; `reload` refetches on demand. The
 * previous data stays on screen meanwhile.
 */
export function useAuctionDetail(id: number) {
  const [token, setToken] = useState(0)
  const [state, setState] = useState<State | null>(null)
  const auction = state?.id === id ? state.data?.auction : undefined
  const followLive = Boolean(auction && !auction.is_legacy && PUBLIC_STATUSES.includes(auction.status))
  const live = useAuctionLive(followLive ? id : null)
  const version = live.snapshot?.auction.version

  useEffect(() => {
    if (!id) return
    let cancelled = false
    auctionAdminApi
      .detail(id)
      .then((res) => { if (!cancelled) setState({ id, data: res.data, error: '' }) })
      .catch((err) => {
        if (cancelled) return
        const error = err instanceof Error ? err.message : 'Failed to load the auction.'
        setState((prev) => ({ id, data: prev?.id === id ? prev.data : null, error }))
      })
    return () => { cancelled = true }
  }, [id, version, token])

  const reload = useCallback(() => setToken((t) => t + 1), [])
  const current = state?.id === id ? state : null
  return {
    data: current?.data ?? null,
    error: current?.error ?? '',
    loading: !current,
    reload,
    liveSync: followLive && live.mode === 'live',
  }
}

export const messageOf = (value: unknown) =>
  value && typeof value === 'object' && 'message' in value && typeof value.message === 'string' ? value.message : ''
