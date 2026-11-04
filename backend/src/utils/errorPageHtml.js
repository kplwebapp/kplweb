/** Branded HTML error pages for browser clients hitting the API host. */

const TITLES = {
  404: 'Page not found',
  403: 'Access denied',
  401: 'Sign in required',
  400: 'Bad request',
  409: 'Conflict',
  500: 'Something went wrong',
  503: 'Service unavailable',
};

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const renderErrorPage = ({ statusCode = 500, message, code }) => {
  const status = Number(statusCode) || 500;
  const title = TITLES[status] || 'Error';
  const detail = message || (status >= 500 ? 'Internal server error' : 'Request failed');
  const errorCode = code || `HTTP_${status}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)} · KPL API</title>
  <style>
    :root { color-scheme: light; }
    * { box-sizing: border-box; }
    body {
      margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
      font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      background: linear-gradient(145deg, #0f172a 0%, #1e293b 45%, #334155 100%);
      padding: 1.5rem;
    }
    .card {
      width: min(420px, 100%); background: #fff; border-radius: 1rem; padding: 2rem 1.75rem;
      text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,.35);
    }
    .code { letter-spacing: .12em; text-transform: uppercase; color: #94a3b8; font-size: .8rem; font-weight: 700; margin: 0 0 .35rem; }
    h1 { margin: 0 0 .5rem; font-size: 1.45rem; color: #0f172a; }
    p { margin: 0 0 1.25rem; color: #64748b; line-height: 1.5; font-size: .95rem; }
    a {
      display: inline-block; padding: .6rem 1.1rem; border-radius: .5rem; text-decoration: none;
      background: #000066; color: #fff; font-weight: 600; font-size: .9rem;
    }
  </style>
</head>
<body>
  <main class="card">
    <p class="code">${escapeHtml(String(status))} · ${escapeHtml(errorCode)}</p>
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(detail)}</p>
    <a href="/">KPL API home</a>
  </main>
</body>
</html>`;
};

/** True when the client likely wants HTML rather than a JSON API envelope. */
const wantsHtml = (req) => {
  const accept = String(req.headers.accept || '');
  if (accept.includes('application/json') && !accept.includes('text/html')) return false;
  if (accept.includes('text/html')) return true;
  // Browsers navigating to unknown paths often send */* — prefer HTML then.
  return accept.includes('*/*') && !req.xhr;
};

module.exports = { renderErrorPage, wantsHtml };
