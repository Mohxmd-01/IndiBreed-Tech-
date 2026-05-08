const router = require('express').Router();
const ctrl = require('../controllers/alertController');
const protect = require('../middleware/auth');

router.use(protect);

router.get('/',              ctrl.getAll);
router.post('/',             ctrl.create);
router.put('/:id/resolve',   ctrl.resolve);
router.post('/bulk-sync',    ctrl.bulkSync);

module.exports = router;
