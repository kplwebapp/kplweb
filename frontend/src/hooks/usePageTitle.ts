import { useEffect } from 'react'

const SITE_NAME = 'Kansara Premier League'

/** Sets the browser tab title to "Page | Kansara Premier League" (or just the site name). */
export function usePageTitle(title?: string | null) {
  useEffect(() => {
    const previous = document.title
    document.title = title?.trim() ? `${title.trim()} | ${SITE_NAME}` : SITE_NAME
    return () => {
      document.title = previous
    }
  }, [title])
}

export { SITE_NAME }
