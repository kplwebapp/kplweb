import { useCallback } from 'react'
import { Alert, Card, Spinner } from 'react-bootstrap'
import { useReloadable } from '@/admin/hooks/useReloadable'
import PointsTableView from '@/components/tournament/PointsTableView'
import { tournamentAdminApi } from '@/services/api/tournamentApi'

export default function PointsTab({ tournamentId }: { tournamentId: number }) {
  const load = useCallback(() => tournamentAdminApi.getPointsTable(tournamentId).then((res) => res.data), [tournamentId])
  const { data, error, loading } = useReloadable(load, String(tournamentId))

  if (loading) return <div className="text-center py-5"><Spinner animation="border" /></div>
  if (!data) return <Alert variant="danger">{error}</Alert>

  const hasResults = data.some((row) => row.played > 0)

  return (
    <>
      <p className="text-muted">
        Calculated automatically from completed league matches: win 2 points, tie or no result 1, loss 0.
        Ties on points are separated by net run rate (when scores are entered), then wins.
        {!hasResults && ' The table appears on the website once the first league result is recorded.'}
      </p>
      {data.length === 0 ? (
        <Alert variant="info">Add teams to this tournament to start the points table.</Alert>
      ) : (
        <Card className="border-0 shadow-sm overflow-hidden">
          <PointsTableView rows={data} />
        </Card>
      )}
    </>
  )
}
