const { Router } = require('express');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');
const { PERMISSIONS } = require('@kpl/shared');
const validate = require('../../middleware/validate');
const {
  upsertAuctionSchema,
  createLotSchema,
  updateLotSchema,
} = require('./auctions.validation');
const auctionsController = require('./auctions.controller');

const router = Router();

router.get('/', auctionsController.getBySeason);

router.put('/', authenticate, authorize(PERMISSIONS.TOURNAMENTS_WRITE), validate(upsertAuctionSchema), auctionsController.upsertAuction);
router.post('/lots', authenticate, authorize(PERMISSIONS.TOURNAMENTS_WRITE), validate(createLotSchema), auctionsController.createLot);
router.patch('/lots/:lotId', authenticate, authorize(PERMISSIONS.TOURNAMENTS_WRITE), validate(updateLotSchema), auctionsController.updateLot);
router.delete('/lots/:lotId', authenticate, authorize(PERMISSIONS.TOURNAMENTS_WRITE), auctionsController.deleteLot);

module.exports = router;
