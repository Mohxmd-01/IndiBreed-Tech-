const router = require('express').Router();
const ctrl = require('../controllers/financeController');
const protect = require('../middleware/auth');

router.use(protect);

router.get('/summary',              ctrl.getSummary);
router.get('/expenses',             ctrl.getExpenses);
router.post('/expense',             ctrl.addExpense);
router.put('/config',               ctrl.updateConfig);
router.post('/expenses/bulk-sync',  ctrl.bulkSyncExpenses);

module.exports = router;
