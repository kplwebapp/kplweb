import { useEffect, useState, type ReactNode } from 'react'
import { Alert, Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import PageHeader, { AdminSection } from '@/admin/components/common/PageHeader'
import { dashboardApi, type DashboardStats } from '@/services/api/dashboardApi'
import { VIBHAAG_OPTIONS } from '@/constants/profileOptions'

const PRIMARY = '#000066'
const PALETTE = ['#2563eb', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16', '#64748b', '#000066']
const STATUS_COLORS = { Approved: '#10b981', 'Pending approval': '#f59e0b' }

/** One colour per vibhaag (in VIBHAAG_OPTIONS order), the same in every chart. */
const VIBHAAG_COLORS: Record<string, string> = Object.fromEntries(
  VIBHAAG_OPTIONS.map((name, i) => [name, PALETTE[i % PALETTE.length]]),
)
const vibhaagColor = (name: string) => VIBHAAG_COLORS[name] ?? '#cbd5e1'

const total = (rows: { count: number }[]) => rows.reduce((sum, r) => sum + r.count, 0)

const monthLabel = (ym: string) => {
  const [year, month] = ym.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
}

const truncate = (text: string, max = 22) => (text.length > max ? `${text.slice(0, max - 1)}…` : text)

type Result = { key: number; stats: DashboardStats | null; error: string }

export default function DashboardPage() {
  const [reloadToken, setReloadToken] = useState(0)
  const [result, setResult] = useState<Result | null>(null)

  useEffect(() => {
    let cancelled = false
    dashboardApi
      .stats()
      .then((res) => { if (!cancelled) setResult({ key: reloadToken, stats: res.data, error: '' }) })
      .catch((err) => {
        if (!cancelled) setResult({ key: reloadToken, stats: null, error: err instanceof Error ? err.message : 'Could not load statistics.' })
      })
    return () => { cancelled = true }
  }, [reloadToken])

  // keep showing the previous charts while a refresh is in flight
  const loading = result?.key !== reloadToken

  return (
    <AdminSection>
      <PageHeader
        title="Dashboard"
        description="Website and tournament registrations at a glance."
        actions={
          <Button variant="outline-secondary" size="sm" onClick={() => setReloadToken((t) => t + 1)} disabled={loading}>
            Refresh
          </Button>
        }
      />

      {!result ? (
        <div className="text-center py-5"><Spinner animation="border" /></div>
      ) : result.stats ? (
        <Charts stats={result.stats} />
      ) : (
        <Alert variant="danger">{result.error}</Alert>
      )}
    </AdminSection>
  )
}

function Charts({ stats }: { stats: DashboardStats }) {
  const { totals } = stats

  const monthly = stats.monthlyRegistrations.map((m) => ({ ...m, label: monthLabel(m.month) }))
  const statusData = [
    { name: 'Approved', count: totals.approved },
    { name: 'Pending approval', count: totals.pending },
  ].filter((d) => d.count > 0)
  const tournaments = stats.registrationsByTournament.map((t) => ({
    ...t,
    label: truncate(t.title),
    fullTitle: t.category_name ? `${t.title} (${t.category_name})` : t.title,
  }))

  return (
    <>
      <Row className="g-3 mb-3">
        <Col lg={6}>
          <ChartCard title="Website registrations" subtitle="Members by vibhaag">
            <VibhaagDonut data={stats.membersByVibhaag} caption="Registrations" />
          </ChartCard>
        </Col>
        <Col lg={6}>
          <TournamentVibhaagCard tournaments={stats.tournamentsByVibhaag} />
        </Col>
      </Row>

      <Row className="g-3 mb-3">
        <StatCard label="Website members" value={totals.members} note={`${totals.approved} approved · ${totals.pending} pending`} />
        <StatCard label="Joined this month" value={totals.this_month} note="New website registrations" />
        <StatCard label="Tournament registrations" value={totals.tournament_registrations} note={`${totals.registered_players} unique players`} />
        <StatCard label="Upcoming & ongoing tournaments" value={totals.active_tournaments} note="Not archived" />
      </Row>

      <Row className="g-3 mb-3">
        <Col lg={8}>
          <ChartCard title="Website registrations" subtitle="New members per month, last 12 months">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthly} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => [v, 'Registrations']} />
                <Bar dataKey="count" name="Registrations" fill={PRIMARY} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Col>
        <Col lg={4}>
          <ChartCard title="Member approval" subtitle="Approved vs pending accounts">
            {statusData.length === 0 ? (
              <Empty />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={statusData} dataKey="count" nameKey="name" innerRadius="50%" outerRadius="80%" paddingAngle={2} label>
                    {statusData.map((d) => (
                      <Cell key={d.name} fill={STATUS_COLORS[d.name as keyof typeof STATUS_COLORS]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </Col>
      </Row>

      <Row className="g-3">
        <Col lg={7}>
          <ChartCard title="Player registrations by tournament" subtitle="Latest tournaments (archived ones excluded)">
            {tournaments.length === 0 ? (
              <Empty text="No tournaments yet." />
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(220, tournaments.length * 40)}>
                <BarChart data={tournaments} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="label" width={150} tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(v) => [v, 'Players']}
                    labelFormatter={(_label, payload) => payload?.[0]?.payload?.fullTitle ?? _label}
                  />
                  <Bar dataKey="count" name="Players" fill="#2563eb" radius={[0, 4, 4, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </Col>
        <Col lg={5}>
          <ChartCard title="Tournament players by vibhaag" subtitle="All active tournaments combined">
            {total(stats.playersByVibhaag) === 0 ? (
              <Empty text="No tournament registrations yet." />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={stats.playersByVibhaag} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="vibhaag" tick={{ fontSize: 11 }} interval={0} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => [v, 'Registrations']} />
                  <Bar dataKey="count" name="Registrations" radius={[4, 4, 0, 0]}>
                    {stats.playersByVibhaag.map((d) => (
                      <Cell key={d.vibhaag} fill={vibhaagColor(d.vibhaag)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </Col>
      </Row>
    </>
  )
}

function StatCard({ label, value, note }: { label: string; value: number; note: string }) {
  return (
    <Col sm={6} xl={3}>
      <Card className="border-0 shadow-sm h-100 dashboard-stat">
        <Card.Body>
          <div className="text-muted small text-uppercase fw-semibold">{label}</div>
          <div className="dashboard-stat__value">{value.toLocaleString('en-IN')}</div>
          <div className="text-muted small">{note}</div>
        </Card.Body>
      </Card>
    </Col>
  )
}

function ChartCard({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string
  subtitle: string
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <Card className="border-0 shadow-sm h-100">
      <Card.Header className="bg-white d-flex align-items-center gap-2">
        <div className="me-auto" style={{ minWidth: 0 }}>
          <div className="fw-semibold">{title}</div>
          <small className="text-muted">{subtitle}</small>
        </div>
        {actions}
      </Card.Header>
      <Card.Body>{children}</Card.Body>
    </Card>
  )
}

type TournamentVibhaag = DashboardStats['tournamentsByVibhaag'][number]

const tournamentLabel = (t: TournamentVibhaag) =>
  `${t.title}${t.category_name ? ` (${t.category_name})` : ''}${t.is_archived ? ' — archived' : ''}`

function TournamentVibhaagCard({ tournaments }: { tournaments: TournamentVibhaag[] }) {
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const selected = tournaments.find((t) => t.event_id === selectedId) ?? tournaments[0]

  return (
    <ChartCard
      title="Tournament players"
      subtitle="Players registered by vibhaag"
      actions={
        selected && (
          <Form.Select
            size="sm"
            className="dashboard-select w-auto"
            aria-label="Tournament"
            value={selected.event_id}
            onChange={(e) => setSelectedId(Number(e.target.value))}
          >
            {tournaments.map((t) => (
              <option key={t.event_id} value={t.event_id}>{tournamentLabel(t)}</option>
            ))}
          </Form.Select>
        )
      }
    >
      {selected ? (
        <VibhaagDonut key={selected.event_id} data={selected.byVibhaag} caption="Players" />
      ) : (
        <Empty text="No tournaments yet." />
      )}
    </ChartCard>
  )
}

const EMPTY_RING = [{ vibhaag: '', count: 1 }]

/** Donut of counts per vibhaag with the total in the middle and every vibhaag listed below. */
function VibhaagDonut({ data, caption }: { data: DashboardStats['membersByVibhaag']; caption: string }) {
  const sum = total(data)
  return (
    <>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={sum ? data : EMPTY_RING}
            dataKey="count"
            nameKey="vibhaag"
            innerRadius="62%"
            outerRadius="90%"
            paddingAngle={sum ? 1 : 0}
            stroke="none"
            isAnimationActive={!!sum}
          >
            {sum
              ? data.map((d) => <Cell key={d.vibhaag} fill={vibhaagColor(d.vibhaag)} />)
              : <Cell fill="#e9ecef" />}
            {/* the pie is centred, so the chart's midpoint is the donut's centre */}
            <Label
              position="center"
              content={() => (
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central">
                  <tspan x="50%" dy="-0.45em" className="dashboard-donut__total">{sum.toLocaleString('en-IN')}</tspan>
                  <tspan x="50%" dy="1.7em" className="dashboard-donut__caption">{caption}</tspan>
                </text>
              )}
            />
          </Pie>
          {sum > 0 && <Tooltip formatter={(v, name) => [v, name]} />}
        </PieChart>
      </ResponsiveContainer>
      <ul className="dashboard-legend">
        {data.map((d) => (
          <li key={d.vibhaag} className={d.count ? undefined : 'is-empty'}>
            <span className="dashboard-legend__swatch" style={{ background: vibhaagColor(d.vibhaag) }} />
            {d.vibhaag}
            <strong>{d.count}</strong>
          </li>
        ))}
      </ul>
    </>
  )
}

function Empty({ text = 'No data yet.' }: { text?: string }) {
  return <div className="text-muted text-center py-5">{text}</div>
}
