const router = require('express').Router();
const ctrl = require('../controllers/advisoryController');
const protect = require('../middleware/auth');

router.use(protect);

router.get('/',             ctrl.getAll);
router.get('/:cowId',       ctrl.getForCow);
router.post('/:id/dismiss', ctrl.dismiss);

module.exports = router;
