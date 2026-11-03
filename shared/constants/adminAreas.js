/**
 * Admin panel areas Super Admin can grant to a role.
 * Selecting an area grants the listed API permissions (plus admin:access on save).
 */
const ADMIN_PANEL_AREAS = Object.freeze([
  {
    key: 'dashboard',
    label: 'Dashboard',
    description: 'Admin home overview',
    permissions: ['dashboard:read'],
  },
  {
    key: 'tournament_categories',
    label: 'Tournament Categories',
    description: 'Create and manage tournament categories',
    permissions: ['tournaments:read', 'tournaments:write'],
  },
  {
    key: 'tournaments',
    label: 'Cricket / Tournaments',
    description: 'Tournament list, details, teams and matches',
    permissions: [
      'tournaments:read',
      'tournaments:write',
      'seasons:read',
      'seasons:write',
      'matches:read',
      'matches:write',
      'teams:read',
      'teams:write',
    ],
  },
  {
    key: 'auctions',
    label: 'Auctions',
    description: 'Create and configure auctions',
    permissions: ['auctions:read', 'auctions:manage'],
  },
  {
    key: 'live_auctions',
    label: 'Live Auctions',
    description: 'Operate live bidding desk',
    permissions: ['auctions:read', 'auctions:operate'],
  },
  {
    key: 'events',
    label: 'Events',
    description: 'Event categories and event pages',
    permissions: ['events:read', 'events:write'],
  },
  {
    key: 'players',
    label: 'Players',
    description: 'Tournament player registrations',
    permissions: ['players:read', 'players:write', 'players:register'],
  },
  {
    key: 'sponsors',
    label: 'Sponsors',
    description: 'Sponsor content',
    permissions: ['sponsors:read', 'sponsors:write'],
  },
  {
    key: 'gallery',
    label: 'Gallery',
    description: 'Gallery media',
    permissions: ['gallery:read', 'gallery:write'],
  },
  {
    key: 'members',
    label: 'Registered Members',
    description: 'Approve members and profile changes',
    permissions: ['users:read', 'users:write'],
  },
]);

const permissionsForAreas = (areaKeys) => {
  const selected = new Set(areaKeys || []);
  const codes = new Set(['admin:access']);
  for (const area of ADMIN_PANEL_AREAS) {
    if (!selected.has(area.key)) continue;
    for (const code of area.permissions) codes.add(code);
  }
  return [...codes];
};

/** Areas whose full permission set is covered by the role's permissions. */
const areasFromPermissions = (permissionCodes) => {
  const have = new Set(permissionCodes || []);
  return ADMIN_PANEL_AREAS.filter((area) => area.permissions.every((code) => have.has(code))).map(
    (area) => area.key
  );
};

module.exports = {
  ADMIN_PANEL_AREAS,
  permissionsForAreas,
  areasFromPermissions,
};
