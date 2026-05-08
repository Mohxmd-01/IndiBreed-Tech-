const router = require('express').Router();
const { body } = require('express-validator');
const auth    = require('../controllers/authController');
const protect = require('../middleware/auth');

// POST /api/auth/register
// farmName only required for farmers — validated conditionally
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name required'),
  body('phone').matches(/^[6-9]\d{9}$/).withMessage('Valid 10-digit phone required'),
  body('password').isLength({ min: 6 }).withMessage('Password min 6 chars'),
  body('role').optional().isIn(['farmer', 'veterinarian', 'company']).withMessage('Invalid role'),
], auth.register);

// POST /api/auth/login
router.post('/login', [
  body('phone').notEmpty().withMessage('Phone required'),
  body('password').notEmpty().withMessage('Password required'),
], auth.login);

router.get('/me',  protect, auth.getMe);
router.put('/me',  protect, auth.updateMe);

module.exports = router;
