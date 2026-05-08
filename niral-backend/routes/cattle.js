const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/cattleController');
const protect = require('../middleware/auth');

router.use(protect);

router.get('/',           ctrl.getAll);
router.get('/:id',        ctrl.getOne);
router.post('/', [
  body('name').trim().notEmpty().withMessage('Name required'),
  body('breed').trim().notEmpty().withMessage('Breed required'),
  body('age').isFloat({ min: 0 }).withMessage('Valid age required'),
  body('weight').isFloat({ min: 0 }).withMessage('Valid weight required'),
], ctrl.create);
router.put('/:id',        ctrl.update);
router.delete('/:id',     ctrl.remove);
router.post('/bulk-sync', ctrl.bulkSync);

module.exports = router;
