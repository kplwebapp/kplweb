import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Alert, Badge, Button, Nav, Spinner } from 'react-bootstrap'
import AppToast from '@/components/common/AppToast'
import PageHeader, { AdminSection } from '@/admin/components/common/PageHeader'
import { auctionsItem } from '@/admin/config/sidebar'
import { auctionAdminApi, type AuctionStatus, type LifecycleAction } from '@/services/api/auctionApi'
import { auctionStatusLabel, auctionStatusVariant, formatAuctionDate } from '@/utils/auctionText'
import ConfirmModal, { type ConfirmRequest } from './ConfirmModal'
import { messageOf, useAuctionDetail, type RunAction, type TabProps } from './shared'
import OverviewTab from './OverviewTab'
import SettingsTab from './SettingsTab'
import TeamsTab from './TeamsTab'
import PlayersTab from './PlayersTab'
import LiveTab from './LiveTab'
import ResultsTab from './ResultsTab'
import HistoryTab from './HistoryTab'

type TabKey = 'overview' | 'settings' | 'teams' | 'players' | 'live' | 'results' | 'history'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'settings', label: 'Settings' },
  { key: 'teams', label: 'Teams & budgets' },
  { key: 'players', label: 'Player pool' },
  { key: 'live', label: 'Live auction' },
  { key: 'results', label: 'Results' },
  { key: 'history', label: 'History' },
]

type Step = {
  action: LifecycleAction
  label: string
  variant: string
  from: AuctionStatus[]
  needs: 'manage' | 'operate'
  confirm?: Omit<ConfirmRequest, 'onConfirm' | 'confirmLabel'>
}

const STEPS: Step[] = [
  { action: 'ready', label: 'Mark ready', variant: 'primary', from: ['DRAFT'], needs: 'manage' },
  { action: 'draft', label: 'Back to draft', variant: 'outline-secondary', from: ['READY'], needs: 'manage' },
  {
    action: 'start', label: 'Start auction', variant: 'success', from: ['READY'], needs: 'operate',
    confirm: {
      title: 'Start the auction?',
      body: 'Bidding opens and the public live screen shows it. Squad rules, categories and the default budget are then locked.',
    },
  },
  { action: 'pause', label: 'Pause', variant: 'warning', from: ['LIVE'], needs: 'operate' },
  { action: 'resume', label: 'Resume', variant: 'success', from: ['PAUSED'], needs: 'operate' },
  {
    action: 'complete', label: 'Complete auction', variant: 'dark', from: ['LIVE', 'PAUSED'], needs: 'operate',
    confirm: {
      title: 'Complete the auction?',
      body: 'Players still waiting are marked unsold and no more bids are taken. This cannot be undone.',
    },
  },
  {
    action: 'cancel', label: 'Cancel auction', variant: 'outline-danger', from: ['DRAFT', 'READY', 'LIVE', 'PAUSED'], needs: 'manage',
    confirm: {
      title: 'Cancel this auction?',
      body: 'The auction stops for good. Bids and results recorded so far stay in its history.',
      variant: 'danger',
      reason: 'required',
    },
  },
]

const defaultTab = (status: AuctionStatus): TabKey =>
  status === 'LIVE' || status === 'PAUSED' ? 'live' : status === 'COMPLETED' || status === 'CANCELLED' ? 'results' : 'overview'

/** /admin/auctions/:id — setup, live bidding, results and history of one auction. */
export default function AuctionManagePage() {
  const id = Number(useParams().id) || 0
  const { data, error, loading, reload, liveSync } = useAuctionDetail(id)
  const [tab, setTab] = useState<TabKey | null>(null)
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'danger' } | null>(null)
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null)

  const run: RunAction = async (action, success) => {
    try {
      const res = await action()
      setToast({ message: success ?? (messageOf(res) || 'Saved.'), variant: 'success' })
      reload()
      return true
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Something went wrong.', variant: 'danger' })
      reload()
      return false
    }
  }

  const backLink = <Link to={auctionsItem.path} className="btn btn-sm btn-outline-secondary">← All auctions</Link>

  if (loading) return <div className="text-center py-5"><Spinner animation="border" /></div>
  if (!data) {
    return (
      <AdminSection>
        <Alert variant="warning">{error || 'Auction not found.'}</Alert>
        {backLink}
      </AdminSection>
    )
  }

  const { auction, can } = data
  const activeTab = tab ?? defaultTab(auction.status)
  const meta = [auction.event_title, auction.season_name, formatAuctionDate(auction.auction_date), auction.venue]
    .filter(Boolean)
    .join(' · ')

  const step = (s: Step) => {
    const go = (reason?: string) =>
      run(() => auctionAdminApi.transition(id, s.action, reason), `${s.label}: done.`).then((ok) => {
        if (ok && (s.action === 'start' || s.action === 'resume')) setTab('live')
        return ok
      })
    if (!s.confirm) return void go()
    setConfirm({ ...s.confirm, confirmLabel: s.label, onConfirm: (reason) => go(reason || undefined) })
  }
  const steps = auction.is_legacy ? [] : STEPS.filter((s) => s.from.includes(auction.status) && can[s.needs])
  const tabProps: TabProps = { detail: data, auctionId: id, run, ask: setConfirm }

  return (
    <AdminSection>
      <PageHeader
        title={auction.title}
        description={meta}
        actions={
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <Badge bg={auctionStatusVariant(auction.status)} className="fs-6">{auctionStatusLabel(auction.status)}</Badge>
            {liveSync && <Badge bg="light" text="success" title="Updates appear automatically">● Live sync</Badge>}
            {steps.map((s) => (
              <Button key={s.action} size="sm" variant={s.variant} onClick={() => step(s)}>{s.label}</Button>
            ))}
            {!['DRAFT', 'CANCELLED'].includes(auction.status) && (
              <a href={`/auction?id=${id}`} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary">
                Public screen ↗
              </a>
            )}
            {backLink}
          </div>
        }
      />

      {auction.is_legacy && (
        <Alert variant="info">This auction was recorded before the auction system and is kept read-only as history.</Alert>
      )}
      {auction.status === 'CANCELLED' && (
        <Alert variant="danger">Cancelled{auction.cancel_reason ? `: ${auction.cancel_reason}` : '.'}</Alert>
      )}
      {error && <Alert variant="warning">Could not refresh: {error}</Alert>}

      <Nav variant="tabs" activeKey={activeTab} onSelect={(key) => key && setTab(key as TabKey)} className="mb-3">
        {TABS.map((t) => (
          <Nav.Item key={t.key}>
            <Nav.Link eventKey={t.key}>
              {t.label}
              {t.key === 'live' && auction.status === 'LIVE' && <span className="ms-1 text-success">●</span>}
            </Nav.Link>
          </Nav.Item>
        ))}
      </Nav>

      <TabBody tab={activeTab} props={tabProps} />

      <ConfirmModal request={confirm} onHide={() => setConfirm(null)} />
      <AppToast show={Boolean(toast)} onClose={() => setToast(null)} message={toast?.message ?? ''} variant={toast?.variant} />
    </AdminSection>
  )
}

function TabBody({ tab, props }: { tab: TabKey; props: TabProps }) {
  switch (tab) {
    case 'overview': return <OverviewTab {...props} />
    case 'settings': return <SettingsTab {...props} />
    case 'teams': return <TeamsTab {...props} />
    case 'players': return <PlayersTab {...props} />
    case 'live': return <LiveTab {...props} />
    case 'results': return <ResultsTab {...props} />
    case 'history': return <HistoryTab {...props} />
  }
}
