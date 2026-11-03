/**
 * Live auction rules for category-wise bidding:
 * - icon: assigned without bidding (paper cheat)
 * - squad_round: All-rounder / Batsman / Bowler — even distribution rounds
 * - open: Other — bid while points and squad slots remain
 */

const normalizeCategoryName = (name) =>
  String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');

/** @returns {'icon' | 'squad_round' | 'open'} */
const categoryMode = (name) => {
  const n = normalizeCategoryName(name);
  if (n.includes('icon')) return 'icon';
  if (n.includes('other')) return 'open';
  if (n.includes('allrounder') || n === 'batsman' || n.includes('batsman') || n === 'bowler' || n.includes('bowler')) {
    return 'squad_round';
  }
  return 'open';
};

const STANDARD_CATEGORIES = Object.freeze([
  'Icon Player',
  'All Rounder',
  'Batsman',
  'Bowlers',
  'Other Players',
]);

/**
 * For squad_round categories: round size = number of teams.
 * Round 1 = first N sales, round 2 = next N, etc.
 * Teams that already bought in the current round cannot bid again in that round.
 */
const squadRoundState = ({ soldOrdered, teamCount, pendingCount }) => {
  const roundSize = Math.max(1, teamCount);
  const totalInCategory = soldOrdered.length + pendingCount;
  const totalRounds = Math.max(1, Math.ceil(totalInCategory / roundSize));
  const currentRound = Math.min(totalRounds, Math.floor(soldOrdered.length / roundSize) + 1);
  const roundStart = (currentRound - 1) * roundSize;
  const roundSales = soldOrdered.slice(roundStart, roundStart + roundSize);
  const lockedTeamIds = new Set(roundSales.map((s) => s.team_id).filter(Boolean));
  return {
    mode: 'squad_round',
    current_round: currentRound,
    total_rounds: totalRounds,
    round_size: roundSize,
    sold_in_category: soldOrdered.length,
    pending_in_category: pendingCount,
    locked_team_ids: [...lockedTeamIds],
  };
};

module.exports = {
  categoryMode,
  normalizeCategoryName,
  STANDARD_CATEGORIES,
  squadRoundState,
};
