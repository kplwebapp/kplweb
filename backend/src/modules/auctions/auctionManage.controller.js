const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');
const asyncHandler = require('../../utils/asyncHandler');
const service = require('./auctionManage.service');
const snapshot = require('./auctionSnapshot');
const stream = require('./auctionStream');
const repo = require('./auctionManage.repository');
const { exportCsv } = require('./auctionReports');
const { getUserPermissions } = require('../../middleware/authorize');
const { PERMISSIONS } = require('@kpl/shared');

stream.setSnapshotBuilder(snapshot.getSnapshot);

const auctionId = (req) => {
  const value = Number(req.params.auctionId);
  if (!Number.isInteger(value) || value <= 0) throw new ApiError(400, 'Invalid auction id');
  return value;
};
const lotId = (req) => {
  const value = Number(req.params.lotId);
  if (!Number.isInteger(value) || value <= 0) throw new ApiError(400, 'Invalid player id');
  return value;
};

const ok = (fn, message) => asyncHandler(async (req, res) => ApiResponse.success(res, await fn(req), message));

/** What the signed-in user may do, so screens only offer actions the API will accept. */
const abilities = async (req) => {
  if (req.user.roles?.includes('SUPER_ADMIN')) return { manage: true, operate: true };
  req.user.permissions ??= await getUserPermissions(req.user.id);
  return {
    manage: req.user.permissions.includes(PERMISSIONS.AUCTIONS_MANAGE),
    operate: req.user.permissions.includes(PERMISSIONS.AUCTIONS_OPERATE),
  };
};

const controller = {
  // Public (read-only)
  publicList: ok(() => repo.listPublicAuctions()),
  publicSnapshot: ok(async (req) => {
    const data = await snapshot.getSnapshot(auctionId(req));
    if (!data) throw new ApiError(404, 'Auction not found');
    return data;
  }),
  stream: asyncHandler(async (req, res) => stream.subscribe(res, auctionId(req))),

  // Admin reads
  list: ok(async (req) => ({ auctions: await service.list(), can: await abilities(req) })),
  detail: ok(async (req) => ({ ...(await service.detail(auctionId(req))), can: await abilities(req) })),
  candidates: ok((req) => service.candidates(auctionId(req))),
  teamOptions: ok((req) => service.teamOptions(auctionId(req))),
  bids: ok((req) => service.bids(auctionId(req))),
  events: ok((req) => service.events(auctionId(req))),
  seasons: ok(() => service.listSeasons()),
  tournaments: ok(() => service.listTournaments()),
  exportCsv: asyncHandler(async (req, res) => {
    const { filename, csv } = await exportCsv(auctionId(req), req.params.report);
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    res.send(csv);
  }),

  // Setup (auctions:manage)
  create: asyncHandler(async (req, res) =>
    ApiResponse.success(res, await service.create(req.body, req.user.id), 'Auction created', 201)),
  update: ok((req) => service.update(auctionId(req), req.body, req.user.id), 'Auction updated'),
  setCategories: ok((req) => service.setCategories(auctionId(req), req.body.categories, req.user.id), 'Categories saved'),
  setTeams: ok((req) => service.setTeams(auctionId(req), req.body.teams, req.user.id), 'Teams saved'),
  addPlayers: ok((req) => service.addPlayers(auctionId(req), req.body, req.user.id), 'Players added'),
  updateLot: ok((req) => service.updateLot(auctionId(req), lotId(req), req.body, req.user.id), 'Player updated'),
  withdrawLot: ok((req) => service.setLotWithdrawn(auctionId(req), lotId(req), true, req.user.id), 'Player removed from the pool'),
  restoreLot: ok((req) => service.setLotWithdrawn(auctionId(req), lotId(req), false, req.user.id), 'Player restored'),
  reorder: ok((req) => service.reorder(auctionId(req), req.body.lot_ids, req.user.id), 'Order saved'),
  reopen: ok((req) => service.reopen(auctionId(req), req.body.lot_id, req.body.reason, req.user.id), 'Player reopened'),
  restartBidding: ok(
    (req) => service.restartBidding(auctionId(req), req.body.lot_id, req.body.reason, req.user.id),
    'Bidding restarted'
  ),

  // Lifecycle
  transition: (action) =>
    ok((req) => service.transition(auctionId(req), action, req.body, req.user.id), 'Auction status updated'),

  // Live (auctions:operate)
  nextPlayer: ok((req) => service.nextPlayer(auctionId(req), req.body.lot_id ?? null, req.user.id), 'Player is up'),
  bid: ok((req) => service.placeBid(auctionId(req), req.body, req.user.id), 'Bid recorded'),
  sell: ok((req) => service.sell(auctionId(req), req.body.lot_id, req.user.id), 'Player sold'),
  unsold: ok((req) => service.markUnsold(auctionId(req), req.body.lot_id, req.user.id), 'Player unsold'),
};

module.exports = controller;
