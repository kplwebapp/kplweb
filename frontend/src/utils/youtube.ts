export const youtubeThumbnail = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`

export const youtubeEmbedUrl = (id: string, autoplay = false) =>
  `https://www.youtube-nocookie.com/embed/${id}${autoplay ? '?autoplay=1' : ''}`

const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtu.be',
  'www.youtube-nocookie.com',
])

/** Same rules as the API: watch, youtu.be, shorts, embed and live links with an 11-character video id. */
export function parseYoutubeId(input: string): string | null {
  let url: URL
  try {
    url = new URL(input.trim())
  } catch {
    return null
  }
  if (!['http:', 'https:'].includes(url.protocol) || !YOUTUBE_HOSTS.has(url.hostname)) return null
  const segments = url.pathname.split('/').filter(Boolean)
  const candidate =
    url.hostname === 'youtu.be'
      ? segments[0]
      : url.searchParams.get('v') || (['embed', 'shorts', 'live'].includes(segments[0]) ? segments[1] : null)
  return candidate && /^[\w-]{11}$/.test(candidate) ? candidate : null
}
