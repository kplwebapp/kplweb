const ApiError = require('../../utils/ApiError');
const repo = require('./auctionManage.repository');

/** CSV exports of an auction's results, team spending and bid history. */

const cell = (value) => {
  if (value == null) return '';
  const text = value instanceof Date ? value.toISOString() : String(value);
  // Leading =, +, - or @ would run as a formula in spreadsheet apps.
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

const toCsv = (header, rows) => [header, ...rows].map((r) => r.map(cell).join(',')).join('\r\n');

const REPORTS = {
  async results(auction) {
    const lots = await repo.findLots(auction.auction_id);
    return toCsv(
      ['Lot', 'Player', 'Vibhaag', 'Category', 'Base points', 'Status', 'Team', 'Sold for', 'Sold at', 'Eligible'],
      lots.map((l) => [l.lot_number, l.player_name, l.vibhaag, l.category_name ?? l.player_role, l.base_price,
        l.status, l.team_name, l.sold_price, l.sold_at, l.is_eligible ? 'Yes' : 'No'])
    );
  },

  async teams(auction) {
    const teams = auction.is_legacy ? await repo.findLegacyTeams(auction.auction_id) : await repo.findTeams(auction.auction_id);
    const lots = await repo.findLots(auction.auction_id);
    return toCsv(
      ['Team', 'Budget', 'Spent', 'Remaining', 'Players', 'Squad limit', 'Squad'],
      teams.map((t) => [t.team_name, t.budget, t.spent, t.remaining, t.players_bought, t.max_players,
        lots.filter((l) => l.status === 'SOLD' && l.team_id === t.team_id)
          .map((l) => `${l.player_name} (${l.sold_price})`).join('; ')])
    );
  },

  async bids(auction) {
    const bids = await repo.findBids(auction.auction_id);
    return toCsv(
      ['Time', 'Lot', 'Player', 'Round', 'Team', 'Amount', 'Winning bid', 'Recorded by'],
      bids.map((b) => [b.placed_at, b.lot_number, b.player_name, b.bid_round, b.team_name, b.amount,
        b.is_winning ? 'Yes' : '', b.placed_by])
    );
  },
};

const slug = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

async function exportCsv(auctionId, type) {
  const build = REPORTS[type];
  if (!build) throw new ApiError(400, 'Unknown report');
  const auction = await repo.findAuction(auctionId);
  if (!auction) throw new ApiError(404, 'Auction not found');
  return { filename: `${slug(auction.title)}-${type}.csv`, csv: `\uFEFF${await build(auction)}` };
}

module.exports = { exportCsv };
