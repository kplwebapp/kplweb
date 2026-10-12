import type { ReactNode } from 'react'
import './tournament.scss'

export type EmptyArt = 'countdown' | 'teams' | 'standings' | 'photos' | 'videos'

const PRIMARY = 'var(--primary, #000066)'
const ACCENT = 'var(--accent-gold, #FFD700)'
const SOFT = '#E6ECFF'

/** Small inline illustrations so empty sections still look intentional. */
function Art({ type }: { type: EmptyArt }) {
  switch (type) {
    case 'countdown':
      return (
        <svg viewBox="0 0 160 120" aria-hidden="true">
          <rect x="18" y="22" width="96" height="84" rx="10" fill={SOFT} />
          <rect x="18" y="22" width="96" height="22" rx="10" fill={PRIMARY} />
          <rect x="18" y="34" width="96" height="10" fill={PRIMARY} />
          <rect x="38" y="14" width="6" height="18" rx="3" fill={PRIMARY} />
          <rect x="88" y="14" width="6" height="18" rx="3" fill={PRIMARY} />
          {[0, 1, 2, 3].map((col) =>
            [0, 1, 2].map((row) => (
              <rect key={`${col}-${row}`} x={30 + col * 20} y={54 + row * 15} width="12" height="9" rx="2" fill="#fff" />
            )),
          )}
          <rect x="70" y="84" width="12" height="9" rx="2" fill={ACCENT} />
          <circle cx="122" cy="80" r="26" fill="#fff" stroke={PRIMARY} strokeWidth="5" />
          <rect x="117" y="46" width="10" height="7" rx="2" fill={PRIMARY} />
          <path d="M122 80 V64" stroke={PRIMARY} strokeWidth="4" strokeLinecap="round" />
          <path d="M122 80 L133 87" stroke={ACCENT} strokeWidth="4" strokeLinecap="round" />
          <circle cx="122" cy="80" r="3.5" fill={PRIMARY} />
        </svg>
      )
    case 'teams':
      return (
        <svg viewBox="0 0 160 120" aria-hidden="true">
          {[
            { x: 22, fill: SOFT },
            { x: 108, fill: SOFT },
          ].map(({ x, fill }) => (
            <path key={x} d={`M${x} 40 l15 -8 l15 8 v22 c0 14 -15 22 -15 22 c0 0 -15 -8 -15 -22 z`} fill={fill} stroke={PRIMARY} strokeWidth="3" />
          ))}
          <path d="M60 30 l20 -10 l20 10 v30 c0 18 -20 30 -20 30 c0 0 -20 -12 -20 -30 z" fill={PRIMARY} />
          <path d="M80 38 l4 9 l10 1 l-8 6 l3 10 l-9 -5 l-9 5 l3 -10 l-8 -6 l10 -1 z" fill={ACCENT} />
          <text x="37" y="66" textAnchor="middle" fontSize="16" fontWeight="700" fill={PRIMARY}>?</text>
          <text x="123" y="66" textAnchor="middle" fontSize="16" fontWeight="700" fill={PRIMARY}>?</text>
        </svg>
      )
    case 'standings':
      return (
        <svg viewBox="0 0 160 120" aria-hidden="true">
          <rect x="22" y="62" width="36" height="40" rx="4" fill={SOFT} />
          <rect x="62" y="44" width="36" height="58" rx="4" fill={PRIMARY} />
          <rect x="102" y="74" width="36" height="28" rx="4" fill={SOFT} />
          <text x="40" y="88" textAnchor="middle" fontSize="16" fontWeight="700" fill={PRIMARY}>2</text>
          <text x="80" y="78" textAnchor="middle" fontSize="18" fontWeight="700" fill="#fff">1</text>
          <text x="120" y="94" textAnchor="middle" fontSize="16" fontWeight="700" fill={PRIMARY}>3</text>
          <path d="M68 20 h24 v8 c0 9 -5 14 -12 14 c-7 0 -12 -5 -12 -14 z" fill={ACCENT} />
          <path d="M68 23 h-6 c0 7 3 10 7 10 M92 23 h6 c0 7 -3 10 -7 10" fill="none" stroke={ACCENT} strokeWidth="3" />
          <rect x="76" y="40" width="8" height="5" fill={ACCENT} />
          <rect x="16" y="102" width="128" height="4" rx="2" fill={PRIMARY} opacity="0.25" />
        </svg>
      )
    case 'photos':
      return (
        <svg viewBox="0 0 160 120" aria-hidden="true">
          <rect x="30" y="28" width="80" height="64" rx="6" fill={SOFT} transform="rotate(-8 70 60)" />
          <rect x="48" y="24" width="84" height="68" rx="6" fill="#fff" stroke={PRIMARY} strokeWidth="3" />
          <circle cx="70" cy="44" r="7" fill={ACCENT} />
          <path d="M54 84 l20 -22 l14 14 l10 -10 l28 18 z" fill={PRIMARY} />
        </svg>
      )
    case 'videos':
      return (
        <svg viewBox="0 0 160 120" aria-hidden="true">
          <rect x="26" y="26" width="108" height="70" rx="10" fill={PRIMARY} />
          <rect x="34" y="34" width="92" height="54" rx="6" fill={SOFT} />
          <circle cx="80" cy="61" r="16" fill="#fff" />
          <path d="M75 52 l14 9 l-14 9 z" fill={PRIMARY} />
          <rect x="60" y="100" width="40" height="5" rx="2.5" fill={ACCENT} />
        </svg>
      )
  }
}

type Props = {
  art: EmptyArt
  title: string
  children?: ReactNode
  compact?: boolean
}

export default function EmptyState({ art, title, children, compact = false }: Props) {
  return (
    <div className={`tournament-empty${compact ? ' tournament-empty--compact' : ''}`}>
      <div className="tournament-empty__art">
        <Art type={art} />
      </div>
      <div>
        <h3 className="tournament-empty__title">{title}</h3>
        {children && <div className="tournament-empty__text">{children}</div>}
      </div>
    </div>
  )
}
