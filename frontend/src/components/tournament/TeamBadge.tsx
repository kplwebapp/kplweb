import { useState } from 'react'
import { getUploadUrl } from '@/utils/activityImage'
import './tournament.scss'

type Props = {
  name: string
  logo: string | null
  size?: number
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('')

/** Team logo, or the team's initials in a circle when no logo was uploaded (or it fails to load). */
export default function TeamBadge({ name, logo, size = 40 }: Props) {
  const [failedLogo, setFailedLogo] = useState<string | null>(null)
  const style = { width: size, height: size, fontSize: size * 0.38 }

  if (logo && logo !== failedLogo) {
    return (
      <img
        src={getUploadUrl(logo)}
        alt={`${name} logo`}
        className="team-badge team-badge--logo"
        style={style}
        onError={() => setFailedLogo(logo)}
      />
    )
  }
  return (
    <span className="team-badge team-badge--initials" style={style} aria-hidden="true">
      {initials(name)}
    </span>
  )
}
