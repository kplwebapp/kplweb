import { Table, Badge, Card } from 'react-bootstrap'
import PageShell from '@/components/common/PageShell'

const teams = [
  { name: 'Valsad Warriors', code: 'VWA', captain: 'TBD' },
  { name: 'Omisol Champions', code: 'OCH', captain: 'TBD' },
  { name: 'Super Strikers', code: 'SST', captain: 'TBD' },
  { name: 'Friends Cricketers', code: 'FRC', captain: 'TBD' },
  { name: 'Mahakali Tigers', code: 'MTK', captain: 'TBD' },
  { name: 'Fearless Falcons', code: 'FFC', captain: 'TBD' },
]

export default function Teams() {
  return (
    <PageShell title="Teams" description="Browse all KPL teams and squads.">
      <Card className="shadow-sm border-0">
        <Card.Body className="p-0">
          <Table responsive striped hover className="mb-0">
            <thead className="table-light">
              <tr>
                <th>Team</th>
                <th>Code</th>
                <th>Captain</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team) => (
                <tr key={team.code}>
                  <td>{team.name}</td>
                  <td><Badge bg="secondary">{team.code}</Badge></td>
                  <td>{team.captain}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </PageShell>
  )
}
