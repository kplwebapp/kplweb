/** Only same-site paths are allowed, so a crafted ?redirect= can't send users to another site. */
function safeRedirect(path: string | null | undefined): string | null {
  if (!path || !path.startsWith('/') || path.startsWith('//') || path.startsWith('/\\')) return null;
  return path;
}

/**
 * Where the website's member login lands. The admin panel has its own login at /admin/login,
 * so a member sign-in never opens it, whatever the account's roles.
 */
export function getPostLoginPath(redirect?: string | null): string {
  const target = safeRedirect(redirect);
  return target && !target.startsWith('/admin') ? target : '/profile';
}

/** Login URL that brings the user back to `path` after signing in. */
export function loginPathFor(path: string): string {
  return `/login?redirect=${encodeURIComponent(path)}`;
}
