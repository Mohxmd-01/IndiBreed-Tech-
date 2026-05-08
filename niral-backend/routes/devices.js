const router = require('express').Router();
const ctrl   = require('../controllers/deviceController');
const protect = require('../middleware/auth');

router.use(protect);

router.get('/',                ctrl.getAll);
router.post('/',               ctrl.create);
router.post('/telemetry',      ctrl.receiveTelemetry);
router.post('/bulk-sync',      ctrl.bulkSync);

// ── Phase 1: Device lifecycle endpoints ──────────────────────────────────────
router.post('/activate',       ctrl.activate);   // validate code → link device
router.post('/transfer',       ctrl.transfer);   // farmer transfers collar to new owner
router.put('/:id/reset',       ctrl.reset);      // mark device lost/damaged

module.exports = router;
