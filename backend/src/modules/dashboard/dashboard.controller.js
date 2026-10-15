const pool = require('../../config/database');
const ApiResponse = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const dashboardStats = require('./dashboard.stats');

const getSummary = asyncHandler(async (_req, res) => {
  const [users, teams, matches, tournaments] = await Promise.all([
    pool.query('SELECT COUNT(*)::int AS c FROM users'),
    pool.query('SELECT COUNT(*)::int AS c FROM teams'),
    pool.query("SELECT COUNT(*)::int AS c FROM matches WHERE status = 'LIVE'"),
    pool.query('SELECT COUNT(*)::int AS c FROM tournaments'),
  ]);

  return ApiResponse.success(res, {
    totalUsers: users.rows[0].c,
    totalTeams: teams.rows[0].c,
    liveMatches: matches.rows[0].c,
    totalTournaments: tournaments.rows[0].c,
  });
});

const getStats = asyncHandler(async (_req, res) => {
  return ApiResponse.success(res, await dashboardStats.getStats());
});

module.exports = { getSummary, getStats };
