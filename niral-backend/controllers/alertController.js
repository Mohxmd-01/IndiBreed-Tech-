const Alert = require('../models/Alert');

// GET /api/alerts?type=&resolved=false&limit=50
exports.getAll = async (req, res, next) => {
  try {
    const { type, resolved, limit = 50 } = req.query;
    const query = { userId: req.user._id };
    if (type) query.type = type;
    if (resolved !== undefined) query.resolved = resolved === 'true';

    const alerts = await Alert.find(query)
      .sort({ time: -1 })
      .limit(Number(limit));
    res.json({ alerts, total: alerts.length });
  } catch (err) { next(err); }
};

// POST /api/alerts
exports.create = async (req, res, next) => {
  try {
    const { type, cowId, cowName, title, desc, action, source } = req.body;
    if (!type || !title || !desc) return res.status(400).json({ error: 'type, title, desc required.' });

    const alert = await Alert.create({
      userId: req.user._id, type, cowId, cowName, title, desc,
      action: action || '', source: source || 'manual', time: Date.now()
    });
    res.status(201).json({ alert });
  } catch (err) { next(err); }
};

// PUT /api/alerts/:id/resolve
exports.resolve = async (req, res, next) => {
  try {
    const alert = await Alert.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { resolved: true, resolvedAt: new Date() },
      { new: true }
    );
    if (!alert) return res.status(404).json({ error: 'Alert not found.' });
    res.json({ alert });
  } catch (err) { next(err); }
};

// POST /api/alerts/bulk-sync
exports.bulkSync = async (req, res, next) => {
  try {
    const { alerts } = req.body;
    if (!Array.isArray(alerts)) return res.status(400).json({ error: 'alerts array required.' });

    let synced = 0;
    for (const a of alerts) {
      if (!a.clientId) continue;
      await Alert.updateOne(
        { userId: req.user._id, clientId: a.clientId },
        { $setOnInsert: { ...a, userId: req.user._id, clientId: a.clientId } },
        { upsert: true }
      ).catch(() => {});
      synced++;
    }
    res.json({ synced });
  } catch (err) { next(err); }
};
