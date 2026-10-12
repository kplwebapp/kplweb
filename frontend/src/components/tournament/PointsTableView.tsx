import { Table } from 'react-bootstrap'
import type { PointsRow } from '@/services/api/tournamentApi'
import TeamBadge from './TeamBadge'

const formatNrr = (value: number | null) => (value === null ? '—' : `${value > 0 ? '+' : ''}${value.toFixed(3)}`)

/** Standings table; the NRR column only appears when at least one result has scores. */
export default function PointsTableView({ rows }: { rows: PointsRow[] }) {
  const showNrr = rows.some((row) => row.net_run_rate !== null)
  const showTied = rows.some((row) => row.tied > 0)
  const showNoResult = rows.some((row) => row.no_result > 0)

  return (
    <Table responsive hover className="points-table-view mb-0 align-middle">
      <thead>
        <tr>
          <th className="text-center">#</th>
          <th>Team</th>
          <th className="text-center" title="Played">P</th>
          <th className="text-center" title="Won">W</th>
          <th className="text-center" title="Lost">L</th>
          {showTied && <th className="text-center" title="Tied">T</th>}
          {showNoResult && <th className="text-center" title="No result">NR</th>}
          {showNrr && <th className="text-center" title="Net run rate">NRR</th>}
          <th className="text-center" title="Points">Pts</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.team_id}>
            <td className="text-center text-muted">{row.position}</td>
            <td>
              <div className="d-flex align-items-center gap-2">
                <TeamBadge name={row.team_name} logo={row.team_logo} size={28} />
                <span className="fw-semibold">{row.team_name}</span>
              </div>
            </td>
            <td className="text-center">{row.played}</td>
            <td className="text-center">{row.won}</td>
            <td className="text-center">{row.lost}</td>
            {showTied && <td className="text-center">{row.tied}</td>}
            {showNoResult && <td className="text-center">{row.no_result}</td>}
            {showNrr && <td className="text-center">{formatNrr(row.net_run_rate)}</td>}
            <td className="text-center fw-bold">{row.points}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  )
}
