import { useState } from 'react'
import { getUploadUrl } from '@/utils/activityImage'
import { resolveTeamLogoSrc } from '@/constants/teamLogos'
import './tournament.scss'

type Props = {
  name: string
  logo?: string | null
  size?: number
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('')

/** Team logo as provided (no filters). Falls back to initials if missing. */
export default function TeamBadge({ name, logo = null, size = 40 }: Props) {
  const [failedLogo, setFailedLogo] = useState<string | null>(null)
  const style = { width: size, height: size, fontSize: size * 0.38 }
  const bundled = resolveTeamLogoSrc(name)
  const uploadSrc = logo && logo !== failedLogo ? getUploadUrl(logo) : null
  const src = bundled || uploadSrc

  if (src) {
    return (
      <img
        src={src}
        alt={`${name} logo`}
        className="team-badge team-badge--logo"
        style={style}
        onError={() => {
          if (logo) setFailedLogo(logo)
        }}
      />
    )
  }
  return (
    <span className="team-badge team-badge--initials" style={style} aria-hidden="true">
      {initials(name)}
    </span>
  )
}
