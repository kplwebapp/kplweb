const { DEFAULT_MAX_PLAYERS_PER_TEAM } = require('./auction.constants');
const auctionsRepository = require('./auctions.repository');

/** Read-only season view kept for the legacy auction; new auctions use auctionManage.service. */
const auctionsService = {
  async getBySeason(seasonId) {
    const auctionResult = await auctionsRepository.findBySeasonId(seasonId);
    if (auctionResult.rows.length === 0) {
      return null;
    }

    const auction = auctionResult.rows[0];
    const [lotsResult, spendResult] = await Promise.all([
      auctionsRepository.findLotsByAuctionId(auction.auction_id),
      auctionsRepository.findTeamSpendByAuctionId(auction.auction_id),
    ]);

    return {
      auction: {
        ...auction,
        points_per_team: Number(auction.budget_per_team),
        max_players_per_team: auction.max_players_per_team ?? DEFAULT_MAX_PLAYERS_PER_TEAM,
      },
      lots: lotsResult.rows,
      teamSpend: spendResult.rows.map((row) => ({
        ...row,
        points_spent: Number(row.points_spent),
        points_remaining: Number(row.points_remaining),
        players_bought: Number(row.players_bought),
        batsmen: Number(row.batsmen),
        bowlers: Number(row.bowlers),
        all_rounders: Number(row.all_rounders),
        max_players_per_team: Number(row.max_players_per_team),
      })),
    };
  },
};

module.exports = auctionsService;
