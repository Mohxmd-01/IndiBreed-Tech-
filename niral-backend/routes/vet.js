const router  = require('express').Router();
const ctrl    = require('../controllers/vetController');
const protect = require('../middleware/auth');
const role    = require('../middleware/requireRole');

// All vet routes: must be authenticated + veterinarian role
router.use(protect);
router.use(role('veterinarian'));

// ── Profile ───────────────────────────────────────────────────────────────────
router.get('/profile', ctrl.getProfile);

// ── Task Feed (main inbox) ────────────────────────────────────────────────────
router.get('/feed', ctrl.getFeed);

// ── Linking ───────────────────────────────────────────────────────────────────
router.post('/link/request',   ctrl.requestLink);
router.put('/link/:id',        ctrl.respondToLink);
router.get('/links',           ctrl.getLinks);
router.get('/links/pending',   ctrl.getPendingLinks);

// ── Farmers ───────────────────────────────────────────────────────────────────
router.get('/farmers',          ctrl.getFarmers);
router.get('/farmers/:farmerId', ctrl.getFarmerDetail);

// ── Treatments ────────────────────────────────────────────────────────────────
router.post('/treatments',              ctrl.addTreatment);
router.get('/treatments',               ctrl.getTreatments);
router.get('/treatments/:farmerId',     ctrl.getTreatments);

// ── Visits ────────────────────────────────────────────────────────────────────
router.post('/visits',              ctrl.scheduleVisit);
router.get('/visits',               ctrl.getVisits);
router.put('/visits/:id/complete',  ctrl.completeVisit);
router.put('/visits/:id/cancel',    ctrl.cancelVisit);

module.exports = router;
