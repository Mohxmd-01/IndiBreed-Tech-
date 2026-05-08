const AdvisoryLog = require('../models/AdvisoryLog');
const { runAdvisoryEngine } = require('../services/advisoryEngine');

// GET /api/advisory  — all advisories for the farm
exports.getAll = async (req, res, next) => {
  try {
    const logs = await AdvisoryLog.find({ userId: req.user._id, dismissed: false })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ advisories: logs });
  } catch (err) { next(err); }
};

// GET /api/advisory/:cowId  — run engine for specific cow
exports.getForCow = async (req, res, next) => {
  try {
    const { cowId } = req.params;

    // Check for fresh cached AI result (< 6h old)
    const cached = await AdvisoryLog.findOne({
      userId: req.user._id,
      cowId,
      layer: 'ai',
      cachedUntil: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (cached) {
      // Flat response — frontend reads r.data.layer, r.data.title, r.data.message etc.
      return res.json({ ...cached.toObject(), cached: true });
    }

    // Run the engine
    const result = await runAdvisoryEngine({ cowId, userId: req.user._id });

    // Save to log
    const log = await AdvisoryLog.create({
      userId: req.user._id,
      cowId,
      cowName: result.cowName,
      layer: result.layer,
      priority: result.priority,
      title: result.title,
      message: result.message,
      action: result.action || '',
      context: result.context,
      cachedUntil: result.layer === 'ai' ? new Date(Date.now() + 6 * 3600 * 1000) : null,
    });

    // Flat response — Advisory.jsx reads r.data.layer, r.data.title, r.data.message, r.data.action, r.data.context
    res.json({ ...log.toObject(), cached: false });
  } catch (err) { next(err); }
};

// POST /api/advisory/:id/dismiss
exports.dismiss = async (req, res, next) => {
  try {
    const log = await AdvisoryLog.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { dismissed: true },
      { new: true }
    );
    if (!log) return res.status(404).json({ error: 'Advisory not found.' });
    res.json({ advisory: log });
  } catch (err) { next(err); }
};
