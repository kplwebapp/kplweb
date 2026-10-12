import '@/admin/styles/admin.css'
import { Routes, Route, Navigate } from 'react-router-dom'
import PageProgress from '@/components/common/PageProgress'
import { ADMIN_BASE, categoryPath, manageCategoriesPath, playersPath } from '@/admin/config/sidebar'
import { useAdminContext } from '@/admin/context'
import type { ActivityKind } from '@/services/api/activitiesApi'
import DashboardLayout from '@/admin/layouts/DashboardLayout'
import ProtectedRoute from '@/admin/components/ProtectedRoute'
import LoginPage from '@/admin/pages/Login'
import DashboardPage from '@/admin/pages/Dashboard'
import GalleryPage from '@/admin/pages/Gallery'
import SponsorsPage from '@/admin/pages/Sponsors'
import ActivitiesPage from '@/admin/pages/Activities'
import CategoriesPage from '@/admin/pages/Categories'
import TournamentManagePage from '@/admin/pages/TournamentManage'
import TeamsPage from '@/admin/pages/Teams'
import { TournamentsForPlayersPage, TournamentRegistrationsPage } from '@/admin/pages/TournamentPlayers'
import MatchesPage from '@/admin/pages/Matches'
import LiveScoringPage from '@/admin/pages/LiveScoring'
import PointsTablePage from '@/admin/pages/PointsTable'
import AuctionPage from '@/admin/pages/Auction'
import MembersPage from '@/admin/pages/Members'

const redirectToDashboard = <Navigate to={ADMIN_BASE} replace />

/** Sends /admin/tournaments, /admin/events and /admin/players to their first visible category. */
function FirstCategoryRedirect({ kind, players = false }: { kind: ActivityKind; players?: boolean }) {
  const { categories, categoriesLoaded } = useAdminContext()
  if (!categoriesLoaded) return <PageProgress />
  const first = categories[kind].find((c) => c.is_active)
  if (!first) return <Navigate to={manageCategoriesPath(kind)} replace />
  return <Navigate to={players ? playersPath(first.slug) : categoryPath(kind, first.slug)} replace />
}

export default function AdminRoutes() {
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<DashboardPage />} />

          <Route path="tournaments" element={<FirstCategoryRedirect kind="TOURNAMENT" />} />
          <Route path="tournaments/:category" element={<ActivitiesPage kind="TOURNAMENT" />} />
          <Route path="tournaments/:category/:id" element={<TournamentManagePage />} />
          <Route path="teams" element={<TeamsPage />} />
          <Route path="events" element={<FirstCategoryRedirect kind="EVENT" />} />
          <Route path="events/:category" element={<ActivitiesPage kind="EVENT" />} />
          <Route path="categories/tournaments" element={<CategoriesPage kind="TOURNAMENT" />} />
          <Route path="categories/events" element={<CategoriesPage kind="EVENT" />} />
          <Route path="players" element={<FirstCategoryRedirect kind="TOURNAMENT" players />} />
          <Route path="players/:category" element={<TournamentsForPlayersPage />} />
          <Route path="players/:category/:tournamentId" element={<TournamentRegistrationsPage />} />

          <Route path="sponsors" element={<SponsorsPage />} />
          <Route path="gallery" element={<GalleryPage />} />
          <Route path="members" element={<MembersPage />} />

          {/* KPL league pages: no longer in the menu, still reachable by URL */}
          <Route path="matches" element={<MatchesPage />} />
          <Route path="scoring" element={<LiveScoringPage />} />
          <Route path="points-table" element={<PointsTablePage />} />
          <Route path="auction" element={<AuctionPage />} />

          <Route path="about" element={redirectToDashboard} />
          <Route path="contact" element={redirectToDashboard} />
          <Route path="statistics" element={redirectToDashboard} />
          <Route path="users" element={redirectToDashboard} />
          <Route path="roles" element={redirectToDashboard} />
          <Route path="reports" element={redirectToDashboard} />
          <Route path="settings" element={redirectToDashboard} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to={ADMIN_BASE} replace />} />
    </Routes>
  )
}
