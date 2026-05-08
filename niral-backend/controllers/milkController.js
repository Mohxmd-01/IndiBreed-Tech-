const { validationResult } = require('express-validator');
const MilkRecord = require('../models/MilkRecord');

// GET /api/milk?cowId=&from=&to=&limit=30
exports.getAll = async (req, res, next) => {
  try {
    const { cowId, clientCowId, from, to, limit = 90 } = req.query;
    const query = { userId: req.user._id };
    if (clientCowId) query.clientCowId = clientCowId;
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = from;
      if (to)   query.date.$lte = to;
    }
    const records = await MilkRecord.find(query).sort({ date: -1 }).limit(Number(limit));
    res.json({ records, total: records.length });
  } catch (err) { next(err); }
};

// POST /api/milk
exports.create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { cowId, clientCowId, clientId, date, morning, evening, notes } = req.body;
    const record = await MilkRecord.create({
      userId: req.user._id, cowId, clientCowId, clientId, date,
      morning: +morning, evening: +evening, notes
    });
    res.status(201).json({ record });
  } catch (err) {
    // Duplicate for same cow+date → update instead
    if (err.code === 11000) {
      try {
        const { cowId, clientCowId, date, morning, evening } = req.body;
        const record = await MilkRecord.findOneAndUpdate(
          { userId: req.user._id, clientCowId, date },
          { morning: +morning, evening: +evening },
          { new: true }
        );
        return res.json({ record, updated: true });
      } catch (e) { next(e); }
    }
    next(err);
  }
};

// POST /api/milk/bulk-sync
exports.bulkSync = async (req, res, next) => {
  try {
    const { records } = req.body;
    if (!Array.isArray(records)) return res.status(400).json({ error: 'records array required.' });

    let synced = 0;
    for (const r of records) {
      await MilkRecord.updateOne(
        { userId: req.user._id, clientCowId: r.clientCowId || r.cowId, date: r.date },
        { $setOnInsert: { ...r, userId: req.user._id, morning: +r.morning, evening: +r.evening } },
        { upsert: true }
      ).catch(() => {}); // skip duplicates silently
      synced++;
    }
    res.json({ synced });
  } catch (err) { next(err); }
};

// GET /api/milk/summary  — today + 30d totals per cow
exports.getSummary = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

    const monthly = await MilkRecord.aggregate([
      { $match: { userId: req.user._id, date: { $gte: monthAgo } } },
      { $group: { _id: '$clientCowId', totalLitres: { $sum: '$total' }, days: { $sum: 1 } } },
    ]);

    const todayTotal = await MilkRecord.aggregate([
      { $match: { userId: req.user._id, date: today } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);

    res.json({ todayTotal: todayTotal[0]?.total || 0, monthly });
  } catch (err) { next(err); }
};
