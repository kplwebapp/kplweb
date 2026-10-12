const ApiError = require('../../utils/ApiError');
const {
  DEFAULT_MAX_PLAYERS_PER_TEAM,
  DEFAULT_POINTS_PER_TEAM,
  normalizeCategory,
} = require('./auction.constants');
const auctionsRepository = require('./auctions.repository');

async function assertSoldLotRules(auction, lotId, teamId, bidPoints) {
  if (!teamId) {
    throw new ApiError(400, 'A team must be selected when marking a player as sold.');
  }

  if (bidPoints == null || bidPoints < 0) {
    throw new ApiError(400, 'Bid points are required when marking a player as sold.');
  }

  const spendResult = await auctionsRepository.countSoldLotsForTeam(
    auction.auction_id,
    teamId,
    lotId
  );
  const { players_bought: playersBought, points_spent: pointsSpent } = spendResult.rows[0];
  const maxPlayers = auction.max_players_per_team ?? DEFAULT_MAX_PLAYERS_PER_TEAM;
  const pointsBudget = Number(auction.budget_per_team ?? DEFAULT_POINTS_PER_TEAM);

  if (playersBought >= maxPlayers) {
    throw new ApiError(
      400,
      `This team already has ${maxPlayers} players. Each team may bid on up to ${maxPlayers} players.`
    );
  }

  if (Number(pointsSpent) + Number(bidPoints) > pointsBudget) {
    throw new ApiError(
      400,
      `Bid exceeds remaining points. Team has ${pointsBudget - Number(pointsSpent)} points left out of ${pointsBudget}.`
    );
  }
}

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

  async upsertAuction(body) {
    const result = await auctionsRepository.upsertAuction({
      ...body,
      budget_per_team: body.budget_per_team ?? DEFAULT_POINTS_PER_TEAM,
      max_players_per_team: body.max_players_per_team ?? DEFAULT_MAX_PLAYERS_PER_TEAM,
    });
    return result.rows[0];
  },

  async createLot(body) {
    const auctionResult = await auctionsRepository.findBySeasonId(body.season_id);
    let auction = auctionResult.rows[0];

    if (!auction) {
      const created = await auctionsRepository.upsertAuction({
        season_id: body.season_id,
        title: 'KPL Player Auction',
        status: 'UPCOMING',
        budget_per_team: DEFAULT_POINTS_PER_TEAM,
        max_players_per_team: DEFAULT_MAX_PLAYERS_PER_TEAM,
      });
      auction = created.rows[0];
    }

    const playerRole = normalizeCategory(body.player_role);
    if (!playerRole) {
      throw new ApiError(400, 'Player category must be Batsman, Bowler, or All-rounder.');
    }

    const result = await auctionsRepository.createLot({
      auction_id: auction.auction_id,
      lot_number: body.lot_number,
      player_name: body.player_name,
      player_role: playerRole,
      vibhaag: body.vibhaag,
      base_price: body.base_price,
      status: body.status,
    });

    return result.rows[0];
  },

  async updateLot(lotId, body) {
    const existing = await auctionsRepository.findLotById(lotId);
    if (existing.rows.length === 0) {
      throw new ApiError(404, 'Auction lot not found');
    }

    const current = existing.rows[0];
    const status = body.status ?? current.status;
    const playerRole = body.player_role != null ? normalizeCategory(body.player_role) : current.player_role;

    if (body.player_role != null && !playerRole) {
      throw new ApiError(400, 'Player category must be Batsman, Bowler, or All-rounder.');
    }

    const soldPrice = status === 'SOLD' ? body.sold_price : body.sold_price ?? null;
    const teamId = status === 'SOLD' ? body.team_id : body.team_id ?? null;

    if (status === 'SOLD') {
      if (!playerRole) {
        throw new ApiError(400, 'Player category is required for sold lots.');
      }

      const auctionResult = await auctionsRepository.findAuctionByLotId(lotId);
      if (auctionResult.rows.length === 0) {
        throw new ApiError(404, 'Auction not found for this lot.');
      }

      await assertSoldLotRules(auctionResult.rows[0], lotId, teamId, soldPrice);
    }

    const result = await auctionsRepository.updateLot(lotId, {
      lot_number: body.lot_number,
      player_name: body.player_name,
      player_role: playerRole,
      vibhaag: body.vibhaag,
      base_price: body.base_price,
      sold_price: soldPrice,
      team_id: teamId,
      status,
    });

    return result.rows[0];
  },

  async deleteLot(lotId) {
    const result = await auctionsRepository.deleteLot(lotId);
    if (result.rows.length === 0) {
      throw new ApiError(404, 'Auction lot not found');
    }
  },
};

module.exports = auctionsService;
