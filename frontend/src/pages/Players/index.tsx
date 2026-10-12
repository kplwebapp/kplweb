import { Table, Badge } from 'react-bootstrap'
import PageShell from '@/components/common/PageShell'

const players = [
  { name: 'Rahul Sharma', team: 'Valsad Warriors', role: 'Batsman' },
  { name: 'Amit Patel', team: 'Omisol Champions', role: 'Bowler' },
  { name: 'Vikram Singh', team: 'Super Strikers', role: 'All-rounder' },
]

export default function Players() {
  return (
    <PageShell title="Players" description="Player profiles and season statistics.">
      <Table responsive striped bordered hover className="mb-0">
        <thead className="table-light">
          <tr>
            <th>Player</th>
            <th>Team</th>
            <th>Role</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player) => (
            <tr key={player.name}>
              <td>{player.name}</td>
              <td>{player.team}</td>
              <td><Badge bg="info">{player.role}</Badge></td>
            </tr>
          ))}
        </tbody>
      </Table>
    </PageShell>
  )
}
