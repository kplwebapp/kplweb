const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtu.be',
  'www.youtube-nocookie.com',
]);
const VIDEO_ID = /^[\w-]{11}$/;

/** Returns the 11-character video id from a YouTube watch/share/shorts/embed/live URL, or null. */
const parseYoutubeId = (input) => {
  let url;
  try {
    url = new URL(String(input).trim());
  } catch {
    return null;
  }
  if (!['http:', 'https:'].includes(url.protocol) || !YOUTUBE_HOSTS.has(url.hostname)) return null;

  const segments = url.pathname.split('/').filter(Boolean);
  const candidate =
    url.hostname === 'youtu.be'
      ? segments[0]
      : url.searchParams.get('v') || (['embed', 'shorts', 'live'].includes(segments[0]) ? segments[1] : null);

  return candidate && VIDEO_ID.test(candidate) ? candidate : null;
};

const youtubeWatchUrl = (id) => `https://www.youtube.com/watch?v=${id}`;

module.exports = { parseYoutubeId, youtubeWatchUrl };
