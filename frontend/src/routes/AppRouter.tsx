import { BrowserRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import MainLayout from '@/layouts/MainLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import PageProgress from '@/components/common/PageProgress';

const Home = lazy(() => import('@/pages/Home/Home'));
const About = lazy(() => import('@/pages/About'));
const ActivityList = lazy(() => import('@/pages/Events'));
const ActivityDetail = lazy(() => import('@/pages/EventDetail'));
const TournamentRegister = lazy(() => import('@/pages/TournamentRegister'));
const Gallery = lazy(() => import('@/pages/Gallery'));
const Contact = lazy(() => import('@/pages/Contact'));
const Login = lazy(() => import('@/auth/Login'));
const Register = lazy(() => import('@/auth/Register'));
const ThankYou = lazy(() => import('@/auth/ThankYou'));
const Logout = lazy(() => import('@/auth/Logout'));
const Profile = lazy(() => import('@/pages/Profile'));
const Teams = lazy(() => import('@/pages/Teams'));
const Players = lazy(() => import('@/pages/Players'));
const Fixtures = lazy(() => import('@/pages/Fixtures'));
const LiveScores = lazy(() => import('@/pages/LiveScores'));
const Results = lazy(() => import('@/pages/Results'));
const Statistics = lazy(() => import('@/pages/Statistics'));
const SponsorsPage = lazy(() => import('@/pages/SponsorsPage'));
const Auction = lazy(() => import('@/pages/Auction'));
const AdminRoutes = lazy(() => import('@/routes/AdminRoutes'));

function LayoutRoute({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  return <MainLayout navigate={(to) => navigate(to)}>{children}</MainLayout>;
}

function LoginRoute() {
  const navigate = useNavigate();
  return <Login navigate={(to) => navigate(to)} />;
}

function RegisterRoute() {
  const navigate = useNavigate();
  return <Register navigate={(to) => navigate(to)} />;
}

function ThankYouRoute() {
  const navigate = useNavigate();
  return <ThankYou navigate={(to) => navigate(to)} />;
}

function LogoutRoute() {
  const navigate = useNavigate();
  return <Logout navigate={(to) => navigate(to)} />;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageProgress />}>
        <Routes>
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/register" element={<RegisterRoute />} />
          <Route path="/thank-you" element={<ThankYouRoute />} />
          <Route path="/logout" element={<LogoutRoute />} />
          <Route path="/" element={<LayoutRoute><Home /></LayoutRoute>} />
          <Route path="/about" element={<LayoutRoute><About /></LayoutRoute>} />
          <Route path="/events" element={<LayoutRoute><ActivityList kind="EVENT" label="Events" path="/events" /></LayoutRoute>} />
          <Route
            path="/events/:slug"
            element={<LayoutRoute><ActivityDetail kind="EVENT" singular="Event" label="Events" path="/events" /></LayoutRoute>}
          />
          <Route
            path="/tournaments"
            element={<LayoutRoute><ActivityList kind="TOURNAMENT" label="Tournaments" path="/tournaments" tabbed /></LayoutRoute>}
          />
          <Route
            path="/tournaments/:slug"
            element={<LayoutRoute><ActivityDetail kind="TOURNAMENT" singular="Tournament" label="Tournaments" path="/tournaments" /></LayoutRoute>}
          />
          <Route path="/tournaments/:slug/register" element={<LayoutRoute><TournamentRegister /></LayoutRoute>} />
          <Route path="/teams" element={<LayoutRoute><Teams /></LayoutRoute>} />
          <Route path="/players" element={<LayoutRoute><Players /></LayoutRoute>} />
          <Route path="/fixtures" element={<LayoutRoute><Fixtures /></LayoutRoute>} />
          <Route path="/live-scores" element={<LayoutRoute><LiveScores /></LayoutRoute>} />
          <Route path="/results" element={<LayoutRoute><Results /></LayoutRoute>} />
          <Route path="/points-table" element={<LayoutRoute><Home /></LayoutRoute>} />
          <Route path="/statistics" element={<LayoutRoute><Statistics /></LayoutRoute>} />
          <Route path="/sponsors" element={<LayoutRoute><SponsorsPage /></LayoutRoute>} />
          <Route path="/gallery" element={<LayoutRoute><Gallery /></LayoutRoute>} />
          <Route path="/auction" element={<LayoutRoute><Auction /></LayoutRoute>} />
          <Route path="/contact" element={<LayoutRoute><Contact /></LayoutRoute>} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <LayoutRoute><Profile /></LayoutRoute>
              </ProtectedRoute>
            }
          />
          <Route path="/admin/*" element={<AdminRoutes />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
