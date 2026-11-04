import { Link } from 'react-router-dom'
import './ErrorPage.css'

export type ErrorKind = 'not-found' | 'server' | 'offline' | 'forbidden' | 'generic'

type Props = {
  kind?: ErrorKind
  title?: string
  description?: string
  /** Primary CTA — defaults by kind. */
  homeTo?: string
  homeLabel?: string
  /** Optional secondary action (e.g. retry). */
  onRetry?: () => void
  retryLabel?: string
  /** Show compact card (admin shell) vs full-bleed page. */
  variant?: 'page' | 'panel'
  code?: string | number
}

const COPY: Record<ErrorKind, { title: string; description: string; code: string }> = {
  'not-found': {
    title: 'Page not found',
    description: 'This address does not exist or may have moved. Check the URL, or head back home.',
    code: '404',
  },
  server: {
    title: 'Something went wrong',
    description: 'We hit an unexpected error. Please try again in a moment. If it keeps happening, contact support.',
    code: '500',
  },
  offline: {
    title: 'You are offline',
    description: 'No internet connection was detected. Check your network, then try again.',
    code: 'OFFLINE',
  },
  forbidden: {
    title: 'Access denied',
    description: 'You do not have permission to view this page. Sign in with an account that does, or go home.',
    code: '403',
  },
  generic: {
    title: 'Unable to continue',
    description: 'Something unexpected happened. Please try again or return to the home page.',
    code: 'ERROR',
  },
}

function Art({ kind }: { kind: ErrorKind }) {
  if (kind === 'offline') {
    return (
      <svg viewBox="0 0 200 140" width="180" height="126" aria-hidden="true">
        <ellipse cx="100" cy="122" rx="60" ry="8" fill="rgba(15,23,42,0.1)" />
        <rect x="70" y="78" width="60" height="36" rx="8" fill="#1e293b" />
        <rect x="78" y="86" width="44" height="20" rx="3" fill="#e2e8f0" />
        <path d="M100 78 V58" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
        <circle cx="100" cy="52" r="8" fill="#94a3b8" />
        <path d="M70 40 Q100 18 130 40" fill="none" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
        <path d="M80 50 Q100 34 120 50" fill="none" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
        <path d="M55 30 L145 100" stroke="#ef4444" strokeWidth="5" strokeLinecap="round" />
      </svg>
    )
  }
  if (kind === 'server') {
    return (
      <svg viewBox="0 0 200 140" width="180" height="126" aria-hidden="true">
        <ellipse cx="100" cy="122" rx="58" ry="8" fill="rgba(15,23,42,0.1)" />
        <rect x="40" y="36" width="120" height="70" rx="12" fill="#0f172a" />
        <rect x="52" y="48" width="96" height="12" rx="4" fill="#334155" />
        <rect x="52" y="68" width="96" height="12" rx="4" fill="#334155" />
        <circle cx="64" cy="90" r="5" fill="#ef4444" />
        <circle cx="82" cy="90" r="5" fill="#f59e0b" />
        <circle cx="100" cy="90" r="5" fill="#22c55e" />
        <path d="M148 28 l8 14 h-16 z" fill="#f59e0b" stroke="#b45309" strokeWidth="2" />
        <text x="148" y="40" textAnchor="middle" fontSize="11" fontWeight="800" fill="#78350f">
          !
        </text>
      </svg>
    )
  }
  if (kind === 'forbidden') {
    return (
      <svg viewBox="0 0 200 140" width="180" height="126" aria-hidden="true">
        <ellipse cx="100" cy="122" rx="58" ry="8" fill="rgba(15,23,42,0.1)" />
        <rect x="62" y="62" width="76" height="48" rx="10" fill="#0f172a" />
        <path
          d="M78 62 V48 a22 22 0 0 1 44 0 V62"
          fill="none"
          stroke="#0f172a"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <circle cx="100" cy="84" r="7" fill="#fbbf24" />
        <rect x="97" y="84" width="6" height="14" rx="2" fill="#fbbf24" />
      </svg>
    )
  }
  // not-found / generic — broken path / map pin
  return (
    <svg viewBox="0 0 200 140" width="180" height="126" aria-hidden="true">
      <ellipse cx="100" cy="122" rx="58" ry="8" fill="rgba(15,23,42,0.1)" />
      <path
        d="M100 28 c-22 0 -40 17 -40 38 c0 28 40 56 40 56 s40 -28 40 -56 c0 -21 -18 -38 -40 -38 z"
        fill="#e0e7ff"
        stroke="#000066"
        strokeWidth="4"
      />
      <circle cx="100" cy="64" r="14" fill="#fff" stroke="#000066" strokeWidth="3" />
      <text x="100" y="70" textAnchor="middle" fontSize="18" fontWeight="800" fill="#000066">
        ?
      </text>
    </svg>
  )
}

/** Branded full-page / panel error UI used by public site, admin, and crash boundary. */
export default function ErrorPage({
  kind = 'generic',
  title,
  description,
  homeTo = '/',
  homeLabel = 'Go home',
  onRetry,
  retryLabel = 'Try again',
  variant = 'page',
  code,
}: Props) {
  const copy = COPY[kind]
  const displayCode = code ?? copy.code

  return (
    <div className={`kpl-error-page kpl-error-page--${variant} kpl-error-page--${kind}`}>
      <div className="kpl-error-page__card">
        <div className="kpl-error-page__art">
          <Art kind={kind} />
        </div>
        <p className="kpl-error-page__code" aria-hidden="true">
          {displayCode}
        </p>
        <h1 className="kpl-error-page__title">{title ?? copy.title}</h1>
        <p className="kpl-error-page__lead">{description ?? copy.description}</p>
        <div className="kpl-error-page__actions">
          {onRetry && (
            <button type="button" className="btn btn-primary" onClick={onRetry}>
              {retryLabel}
            </button>
          )}
          <Link to={homeTo} className={`btn ${onRetry ? 'btn-outline-secondary' : 'btn-primary'}`}>
            {homeLabel}
          </Link>
        </div>
      </div>
    </div>
  )
}
