const AUCTION_PLAYER_CATEGORIES = Object.freeze([
  'Batsman',
  'Bowler',
  'All-rounder',
]);

const DEFAULT_POINTS_PER_TEAM = 100000;
const DEFAULT_MAX_PLAYERS_PER_TEAM = 16;

function normalizeCategory(role) {
  if (!role) return null;
  const normalized = String(role).trim().toLowerCase();
  if (normalized === 'batsman') return 'Batsman';
  if (normalized === 'bowler') return 'Bowler';
  if (normalized === 'all-rounder' || normalized === 'all rounder' || normalized === 'allrounder') {
    return 'All-rounder';
  }
  return null;
}

const AUCTION_STATUS = Object.freeze({
  DRAFT: 'DRAFT',
  READY: 'READY',
  LIVE: 'LIVE',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
});

const LOT_STATUS = Object.freeze({
  PENDING: 'PENDING',
  ON_BLOCK: 'ON_BLOCK',
  SOLD: 'SOLD',
  UNSOLD: 'UNSOLD',
  WITHDRAWN: 'WITHDRAWN',
});

/** Lifecycle actions: the statuses each may start from and the status it leads to. */
const LIFECYCLE = Object.freeze({
  ready: { from: ['DRAFT'], to: 'READY' },
  draft: { from: ['READY'], to: 'DRAFT' },
  start: { from: ['READY'], to: 'LIVE' },
  pause: { from: ['LIVE'], to: 'PAUSED' },
  resume: { from: ['PAUSED'], to: 'LIVE' },
  complete: { from: ['LIVE', 'PAUSED'], to: 'COMPLETED' },
  cancel: { from: ['DRAFT', 'READY', 'LIVE', 'PAUSED'], to: 'CANCELLED' },
});

/** Settings that can only change before the auction goes live. */
const SETUP_STATUSES = ['DRAFT', 'READY'];
/** Statuses in which the auction can still be changed at all. */
const OPEN_STATUSES = ['DRAFT', 'READY', 'LIVE', 'PAUSED'];

module.exports = {
  AUCTION_PLAYER_CATEGORIES,
  DEFAULT_POINTS_PER_TEAM,
  DEFAULT_MAX_PLAYERS_PER_TEAM,
  normalizeCategory,
  AUCTION_STATUS,
  LOT_STATUS,
  LIFECYCLE,
  SETUP_STATUSES,
  OPEN_STATUSES,
};
