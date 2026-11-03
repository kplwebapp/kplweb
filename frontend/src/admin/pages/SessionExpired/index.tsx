import { Link, Navigate } from 'react-router-dom'
import { ADMIN_BASE } from '@/admin/config/sidebar'
import { adminSession } from '@/utils/adminSession'
import { SESSION_IDLE_MINUTES } from '@/hooks/useIdleSession'
import './SessionExpired.css'

/** Full-page notice after admin idle timeout — link back to sign in. */
export default function SessionExpiredPage() {
  if (adminSession.getToken()) return <Navigate to={ADMIN_BASE} replace />

  return (
    <div className="admin-session-expired-page">
      <div className="admin-session-expired-page__card">
        <div className="admin-session-expired-page__art" aria-hidden="true">
          <svg viewBox="0 0 200 150" width="180" height="135">
            <defs>
              <linearGradient id="adminExpClock" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fef3c7" />
                <stop offset="100%" stopColor="#fde68a" />
              </linearGradient>
            </defs>
            <ellipse cx="100" cy="138" rx="58" ry="7" fill="rgba(15,23,42,0.14)" />
            <circle cx="100" cy="72" r="44" fill="url(#adminExpClock)" stroke="#d97706" strokeWidth="3.5" />
            <circle cx="100" cy="72" r="4" fill="#92400e" />
            <line x1="100" y1="72" x2="100" y2="44" stroke="#92400e" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="100" y1="72" x2="122" y2="82" stroke="#b45309" strokeWidth="3" strokeLinecap="round" />
            <path d="M148 42c8 3 13 10 12 18" fill="none" stroke="#f59e0b" strokeWidth="3.5" strokeLinecap="round" />
            <path
              d="M156 34l4 12 -12 -3"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <rect x="28" y="98" width="34" height="26" rx="5" fill="#1e293b" />
            <circle cx="45" cy="111" r="5" fill="#fbbf24" />
            <path d="M45 90v8" stroke="#1e293b" strokeWidth="3.5" strokeLinecap="round" />
          </svg>
        </div>

        <h1 className="admin-session-expired-page__title">Your login has expired</h1>
        <p className="admin-session-expired-page__lead">
          You were signed out automatically after {SESSION_IDLE_MINUTES} minutes of inactivity and redirected here for
          security.
        </p>

        <ol className="admin-session-expired-page__steps">
          <li>
            <span>1</span> Idle timeout
          </li>
          <li aria-hidden="true">→</li>
          <li>
            <span>2</span> Auto sign-out
          </li>
          <li aria-hidden="true">→</li>
          <li className="is-here">
            <span>3</span> Sign in again
          </li>
        </ol>

        <Link to={`${ADMIN_BASE}/login`} className="btn btn-primary btn-lg admin-session-expired-page__cta">
          Sign in again
        </Link>
      </div>
    </div>
  )
}
