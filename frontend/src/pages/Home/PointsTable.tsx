import { useEffect, useState } from 'react'
import { Container, Card, Table, Form, Spinner } from 'react-bootstrap'
import { statsApi, type PointsTableRow, type Season } from '@/services/api/publicApi'
import { pickDefaultSeason } from '@/utils/season'
import './PointsTable.scss'
import React from 'react'
function sortByPointsDesc(rows: PointsTableRow[]) {
  return [...rows].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    return Number(b.net_run_rate) - Number(a.net_run_rate)
  })
}

export default function PointsTable() {
  const [seasons, setSeasons] = useState<Season[]>([])
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null)
  const [standings, setStandings] = useState<PointsTableRow[]>([])
  const [loadingSeasons, setLoadingSeasons] = useState(true)
  const [loadingStandings, setLoadingStandings] = useState(false)

  useEffect(() => {
    statsApi
      .getSeasons()
      .then((res) => {
        const list = res.data ?? []
        setSeasons(list)
        const defaultSeason = pickDefaultSeason(list)
        if (defaultSeason) {
          setSelectedSeasonId(defaultSeason.season_id)
        }
      })
      .catch(() => setSeasons([]))
      .finally(() => setLoadingSeasons(false))
  }, [])

  useEffect(() => {
    if (selectedSeasonId == null) {
      setStandings([])
      return
    }

    setLoadingStandings(true)
    statsApi
      .getPointsTable(selectedSeasonId)
      .then((res) => setStandings(sortByPointsDesc(res.data ?? [])))
      .catch(() => setStandings([]))
      .finally(() => setLoadingStandings(false))
  }, [selectedSeasonId])

  const isLoading = loadingSeasons || loadingStandings

  return (
    <React.Fragment>
      <section className="points-table py-4">
        <Container>
          <h2 className="section-title text-center mb-4">KPL Points Table</h2>
          {loadingSeasons ? (
            <div className="points-table__status text-center py-4">
              <Spinner animation="border" />
            </div>
          ) : seasons.length === 0 ? (
            <Card className="shadow-sm border-0">
              <Card.Body className="text-center text-muted py-4">
                No seasons available yet.
              </Card.Body>
            </Card>
          ) : (
            <>
              <div className="points-table__season-select mb-3">
                <Form.Select
                  aria-label="Select season"
                  value={selectedSeasonId ?? ''}
                  onChange={(e) => setSelectedSeasonId(Number(e.target.value))}
                >
                  {seasons.map((season) => (
                    <option key={season.season_id} value={season.season_id}>
                      {season.season_name}
                    </option>
                  ))}
                </Form.Select>
              </div>

              <div className="shadow-sm border-0 table-card">
                  {isLoading ? (
                    <div className="points-table__status text-center py-4">
                      <Spinner animation="border" size="sm" />
                    </div>
                  ) : standings.length === 0 ? (
                    <div className="text-center text-muted py-4">
                      No standings for this season yet.
                    </div>
                  ) : (
                    <Table responsive striped bordered hover className="mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Team</th>
                          <th>Played</th>
                          <th>Won</th>
                          <th>Pts</th>
                        </tr>
                      </thead>
                      <tbody>
                        {standings.map((row) => (
                          <tr key={row.points_table_id}>
                            <td>{row.team_name}</td>
                            <td>{row.matches_played}</td>
                            <td>{row.matches_won}</td>
                            <td><strong>{row.points}</strong></td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
              </div>
            </>
          )}
        </Container>
      </section>
    </React.Fragment>
    
  )
}
