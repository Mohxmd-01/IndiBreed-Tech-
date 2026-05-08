/**
 * requireRole.js — Role-based access control middleware.
 * Usage: router.get('/', protect, requireRole('farmer'), ctrl.fn)
 *        router.get('/', protect, requireRole('vet', 'farmer'), ctrl.fn)
 */

module.exports = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      error: `Access denied. This route requires role: ${roles.join(' or ')}.`,
      yourRole: req.user.role,
    });
  }
  next();
};
