const ADMIN_ROLES = new Set(['SUPER_ADMIN', 'ADMIN', 'TEAM_MANAGER', 'SCORER']);

export function isAdminUser(roles: string[] | undefined): boolean {
  if (!roles?.length) return false;
  return roles.some((role) => ADMIN_ROLES.has(role));
}

/** Only same-site paths are allowed, so a crafted ?redirect= can't send users to another site. */
function safeRedirect(path: string | null | undefined): string | null {
  if (!path || !path.startsWith('/') || path.startsWith('//') || path.startsWith('/\\')) return null;
  return path;
}

export function getPostLoginPath(roles: string[] | undefined, redirect?: string | null): string {
  return safeRedirect(redirect) ?? (isAdminUser(roles) ? '/admin' : '/profile');
}

/** Login URL that brings the user back to `path` after signing in. */
export function loginPathFor(path: string): string {
  return `/login?redirect=${encodeURIComponent(path)}`;
}
