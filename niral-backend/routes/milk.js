const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/milkController');
const protect = require('../middleware/auth');

router.use(protect);

router.get('/',             ctrl.getAll);
router.get('/summary',      ctrl.getSummary);
router.post('/', [
  body('date').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Date YYYY-MM-DD required'),
  body('morning').isFloat({ min: 0 }).withMessage('Valid morning litres required'),
  body('evening').isFloat({ min: 0 }).withMessage('Valid evening litres required'),
], ctrl.create);
router.post('/bulk-sync',   ctrl.bulkSync);

module.exports = router;
