import { useCallback } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Alert, Spinner } from 'react-bootstrap'
import PageHeader, { AdminSection } from '@/admin/components/common/PageHeader'
import { auctionPath, auctionsItem } from '@/admin/config/sidebar'
import { useReloadable } from '@/admin/hooks/useReloadable'
import { auctionAdminApi } from '@/services/api/auctionApi'
import EmptyState from '@/components/tournament/EmptyState'

/** /admin/auctions/live — opens the single live (or paused) auction desk, or explains when none is running. */
export default function LiveDeskPage() {
  const load = useCallback(() => auctionAdminApi.list().then((res) => res.data), [])
  const { data, error, loading } = useReloadable(load, 'auctions-live-desk')

  if (loading) {
    return (
      <AdminSection>
        <div className="text-center py-5"><Spinner animation="border" /></div>
      </AdminSection>
    )
  }

  if (!data) {
    return (
      <AdminSection>
        <Alert variant="danger">{error || 'Could not load auctions.'}</Alert>
        <Link to={auctionsItem.path} className="btn btn-outline-secondary btn-sm">← All auctions</Link>
      </AdminSection>
    )
  }

  if (data.live) {
    return <Navigate to={auctionPath(data.live.auction_id)} replace />
  }

  return (
    <AdminSection>
      <PageHeader
        title="Live auction"
        description="Only one auction can be live at a time. Start a ready auction to open the live desk."
        actions={<Link to={auctionsItem.path} className="btn btn-sm btn-outline-secondary">All auctions</Link>}
      />
      <EmptyState art="auction" title="No auction is live right now" compact className="tournament-empty--admin">
        {data.can.operate ? (
          <>
            Open a <strong>Ready</strong> auction and choose <strong>Start auction</strong>.
          </>
        ) : (
          'Only one auction can run live at a time. Check back when an auction has been started.'
        )}
      </EmptyState>
      <div className="mt-3">
        <Link to={auctionsItem.path} className="btn btn-primary">Go to auctions</Link>
      </div>
    </AdminSection>
  )
}
