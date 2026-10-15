const { Router } = require('express');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');
const { PERMISSIONS } = require('@kpl/shared');
const validate = require('../../middleware/validate');
const ApiError = require('../../utils/ApiError');
const auctionsController = require('./auctions.controller');
const c = require('./auctionManage.controller');
const v = require('./auctionManage.validation');

const router = Router();

const read = [authenticate, authorize(PERMISSIONS.AUCTIONS_READ)];
const manage = [authenticate, authorize(PERMISSIONS.AUCTIONS_MANAGE)];
const operate = [authenticate, authorize(PERMISSIONS.AUCTIONS_OPERATE)];

// ---------- Public, read-only ----------
router.get('/', auctionsController.getBySeason); // legacy season view
router.get('/public', c.publicList);
router.get('/:auctionId/public', c.publicSnapshot);
router.get('/:auctionId/stream', c.stream);

// The old lot-editing endpoints bypassed the auction lifecycle and history.
const retired = (_req, _res, next) =>
  next(new ApiError(410, 'This endpoint has been replaced by /api/auctions/manage.'));
router.put('/', retired);
router.post('/lots', retired);
router.patch('/lots/:lotId', retired);
router.delete('/lots/:lotId', retired);

// ---------- Administration ----------
router.get('/manage', ...read, c.list);
router.get('/manage/options/seasons', ...read, c.seasons);
router.get('/manage/options/tournaments', ...read, c.tournaments);
router.post('/manage', ...manage, validate(v.createAuctionSchema), c.create);

router.get('/manage/:auctionId', ...read, c.detail);
router.patch('/manage/:auctionId', ...manage, validate(v.updateAuctionSchema), c.update);
router.put('/manage/:auctionId/categories', ...manage, validate(v.categoriesSchema), c.setCategories);
router.get('/manage/:auctionId/team-options', ...read, c.teamOptions);
router.put('/manage/:auctionId/teams', ...manage, validate(v.teamsSchema), c.setTeams);

router.get('/manage/:auctionId/candidates', ...read, c.candidates);
router.post('/manage/:auctionId/players', ...manage, validate(v.addPlayersSchema), c.addPlayers);
router.patch('/manage/:auctionId/players/:lotId', ...manage, validate(v.updateLotSchema), c.updateLot);
router.post('/manage/:auctionId/players/:lotId/withdraw', ...manage, c.withdrawLot);
router.post('/manage/:auctionId/players/:lotId/restore', ...manage, c.restoreLot);
router.put('/manage/:auctionId/order', ...manage, validate(v.reorderSchema), c.reorder);

// Lifecycle: setup steps and cancelling need manage; running the auction needs operate.
router.post('/manage/:auctionId/status/ready', ...manage, c.transition('ready'));
router.post('/manage/:auctionId/status/draft', ...manage, c.transition('draft'));
router.post('/manage/:auctionId/status/cancel', ...manage, validate(v.reasonSchema), c.transition('cancel'));
router.post('/manage/:auctionId/status/start', ...operate, c.transition('start'));
router.post('/manage/:auctionId/status/pause', ...operate, c.transition('pause'));
router.post('/manage/:auctionId/status/resume', ...operate, c.transition('resume'));
router.post('/manage/:auctionId/status/complete', ...operate, c.transition('complete'));

// Live bidding
router.post('/manage/:auctionId/live/next', ...operate, validate(v.nextPlayerSchema), c.nextPlayer);
router.post('/manage/:auctionId/live/bid', ...operate, validate(v.bidSchema), c.bid);
router.post('/manage/:auctionId/live/sold', ...operate, validate(v.lotRefSchema), c.sell);
router.post('/manage/:auctionId/live/unsold', ...operate, validate(v.lotRefSchema), c.unsold);
// Corrections are audited and need manage.
router.post('/manage/:auctionId/live/restart-bidding', ...manage, validate(v.lotRefWithReasonSchema), c.restartBidding);
router.post('/manage/:auctionId/reopen', ...manage, validate(v.lotRefWithReasonSchema), c.reopen);

// History and reports
router.get('/manage/:auctionId/bids', ...read, c.bids);
router.get('/manage/:auctionId/events', ...read, c.events);
router.get('/manage/:auctionId/export/:report', ...read, c.exportCsv);

module.exports = router;
