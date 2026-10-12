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

module.exports = {
  AUCTION_PLAYER_CATEGORIES,
  DEFAULT_POINTS_PER_TEAM,
  DEFAULT_MAX_PLAYERS_PER_TEAM,
  normalizeCategory,
};
