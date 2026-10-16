const repo = require('./auctionManage.repository');

/**
 * The public, read-only view of an auction: what the website and projector screen show.
 * Only public fields: no emails, phone numbers, admin notes or user ids.
 */

const CACHE_MS = 30000;
const cache = new Map(); // auctionId -> { key, at, data }

const RECENT_BIDS = 15;

/** Drafts and cancelled auctions are never shown publicly. */
const isPublic = (auction) => auction.is_legacy || !['DRAFT', 'CANCELLED'].includes(auction.status);

/** Public labels for the live board — kept on the server so screens stay consistent. */
const STATUS_LABEL = {
  ON_BLOCK: 'Bidding On',
  SOLD: 'Sold',
  UNSOLD: 'Unsold',
  PENDING: 'Waiting',
  WITHDRAWN: 'Removed',
};

const publicLot = (l) => ({
  lot_id: l.lot_id,
  lot_number: l.lot_number,
  player_name: l.player_name,
  vibhaag: l.vibhaag,
  category: l.category_name ?? l.player_role ?? null,
  base_price: l.base_price,
  status: l.status,
  status_label: STATUS_LABEL[l.status] ?? l.status,
  team_id: l.team_id,
  team_name: l.team_name,
  sold_price: l.sold_price,
  profile_photo: l.profile_photo,
  date_of_birth: l.date_of_birth,
  batting_style: l.batting_style,
  bowling_style: l.bowling_style,
  is_wicketkeeper: l.is_wicketkeeper,
});

const build = async (auctionId) => {
  const auction = await repo.findAuction(auctionId);
  if (!auction || !isPublic(auction)) return null;

  const [categories, allLots, teamRows, lastEvent] = await Promise.all([
    repo.findCategories(auctionId),
    repo.findLots(auctionId),
    auction.is_legacy ? repo.findLegacyTeams(auctionId) : repo.findTeams(auctionId),
    repo.findLastEvent(auctionId),
  ]);

  const lots = allLots.filter((l) => l.status !== 'WITHDRAWN' && (l.is_eligible || l.status === 'SOLD'));
  const current = lots.find((l) => l.lot_id === auction.current_lot_id && l.status === 'ON_BLOCK') ?? null;
  const increment = auction.min_bid_increment;
  const waiting = lots.filter((l) => l.status === 'PENDING');
  const nextLot = waiting[0] ?? null;

  let currentView = null;
  if (current) {
    const bids = await repo.findRoundBids(current.lot_id, current.bid_round);
    const highest = bids[0] ?? null;
    currentView = {
      ...publicLot(current),
      bid_round: current.bid_round,
      highest: highest && { amount: highest.amount, team_id: highest.team_id, team_name: highest.team_name },
      next_min_bid: highest ? highest.amount + increment : current.base_price,
      points_spent: highest ? highest.amount : current.base_price,
      bids: bids.slice(0, RECENT_BIDS).map((b) => ({
        amount: b.amount,
        team_id: b.team_id,
        team_name: b.team_name,
        placed_at: b.placed_at,
      })),
    };
  }

  const sold = lots.filter((l) => l.status === 'SOLD');

  // Right-hand panel: current on-block player, otherwise the last sold/unsold result.
  let featured = currentView;
  if (!featured && lastEvent && (lastEvent.event_type === 'PLAYER_SOLD' || lastEvent.event_type === 'PLAYER_UNSOLD')) {
    const lastLot = lots.find((l) => l.lot_id === lastEvent.lot_id);
    if (lastLot) {
      featured = {
        ...publicLot(lastLot),
        points_spent: lastLot.status === 'SOLD' ? lastLot.sold_price : null,
      };
    }
  }

  // Left-hand list: sold players are removed; unsold and waiting stay.
  const pool = lots.filter((l) => l.status !== 'SOLD').map(publicLot);

  const teams = teamRows.map((t) => ({
    team_id: t.team_id,
    team_name: t.team_name,
    short_name: t.short_name,
    team_logo: t.team_logo,
    budget: t.budget,
    spent: t.spent,
    remaining: t.remaining,
    players_bought: t.players_bought,
    max_players: t.max_players,
    slots_left: t.slots_left,
    players: sold
      .filter((l) => l.team_id === t.team_id)
      .map((l) => ({
        lot_id: l.lot_id,
        player_name: l.player_name,
        category: l.category_name ?? l.player_role ?? null,
        sold_price: l.sold_price,
      })),
  }));

  return {
    auction: {
      auction_id: auction.auction_id,
      title: auction.title,
      description: auction.description,
      rules: auction.rules,
      status: auction.status,
      is_legacy: auction.is_legacy,
      auction_date: auction.auction_date,
      venue: auction.venue,
      season_name: auction.season_name,
      season_year: auction.season_year,
      tournament: auction.event_id ? { title: auction.event_title, slug: auction.event_slug } : null,
      min_bid_increment: increment,
      max_players_per_team: auction.max_players_per_team,
      started_at: auction.started_at,
      completed_at: auction.completed_at,
      version: Number(auction.version),
    },
    categories: categories.map((c) => ({ auction_category_id: c.auction_category_id, name: c.name })),
    teams,
    current: currentView,
    featured: featured ?? null,
    next: nextLot ? { lot_id: nextLot.lot_id, lot_number: nextLot.lot_number, player_name: nextLot.player_name } : null,
    pool,
    lots: lots.map(publicLot),
    counts: {
      total: lots.length,
      sold: sold.length,
      unsold: lots.filter((l) => l.status === 'UNSOLD').length,
      remaining: waiting.length,
      on_block: current ? 1 : 0,
    },
    total_spent: teams.reduce((sum, t) => sum + t.spent, 0),
    last_event: lastEvent && {
      seq: Number(lastEvent.seq),
      type: lastEvent.event_type,
      lot_id: lastEvent.lot_id,
      team_name: lastEvent.team_name,
      amount: lastEvent.amount,
      at: lastEvent.created_at,
    },
    generated_at: new Date().toISOString(),
  };
};

/** Cached by auction version, so many viewers polling or reconnecting cost one build per change. */
const getSnapshot = async (auctionId) => {
  const meta = await repo.findVersion(auctionId);
  if (!meta) return null;
  const key = `${meta.version}:${new Date(meta.updated_at).getTime()}`;
  const hit = cache.get(auctionId);
  if (hit && hit.key === key && Date.now() - hit.at < CACHE_MS) return hit.data;
  const data = await build(auctionId);
  cache.set(auctionId, { key, at: Date.now(), data });
  return data;
};

const invalidate = (auctionId) => cache.delete(auctionId);

/** Landing-card fields derived once on the server so the public page only renders. */
const toPublicCard = (row) => {
  let phase;
  let status_label;
  let cta_label;
  let cta_enabled;
  if (row.status === 'LIVE' || row.status === 'PAUSED') {
    phase = 'live';
    status_label = 'Live';
    cta_label = 'View Live Auction';
    cta_enabled = true;
  } else if (row.status === 'COMPLETED' || row.is_legacy) {
    phase = 'completed';
    status_label = 'Completed';
    cta_label = 'View Auction';
    cta_enabled = true;
  } else {
    phase = 'upcoming';
    status_label = 'Upcoming';
    cta_label = 'View Live Auction';
    cta_enabled = false;
  }
  return { ...row, phase, status_label, cta_label, cta_enabled };
};

const listPublicCards = async () => {
  const rows = await repo.listPublicAuctions();
  return rows.map(toPublicCard);
};

module.exports = { getSnapshot, invalidate, listPublicCards };
