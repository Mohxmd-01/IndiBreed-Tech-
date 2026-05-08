const { validationResult } = require('express-validator');
const Cattle = require('../models/Cattle');

// GET /api/cattle
exports.getAll = async (req, res, next) => {
  try {
    const cattle = await Cattle.find({ userId: req.user._id, isActive: true }).sort({ name: 1 });
    res.json({ cattle, total: cattle.length });
  } catch (err) { next(err); }
};

// GET /api/cattle/:id
exports.getOne = async (req, res, next) => {
  try {
    const cow = await Cattle.findOne({ _id: req.params.id, userId: req.user._id });
    if (!cow) return res.status(404).json({ error: 'Cattle not found.' });
    res.json({ cattle: cow });
  } catch (err) { next(err); }
};

// POST /api/cattle
exports.create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const cow = await Cattle.create({ ...req.body, userId: req.user._id });
    res.status(201).json({ cattle: cow });
  } catch (err) { next(err); }
};

// PUT /api/cattle/:id
exports.update = async (req, res, next) => {
  try {
    const cow = await Cattle.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!cow) return res.status(404).json({ error: 'Cattle not found.' });
    res.json({ cattle: cow });
  } catch (err) { next(err); }
};

// DELETE /api/cattle/:id  (soft delete)
exports.remove = async (req, res, next) => {
  try {
    const cow = await Cattle.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isActive: false },
      { new: true }
    );
    if (!cow) return res.status(404).json({ error: 'Cattle not found.' });
    res.json({ message: 'Cattle removed.', cattle: cow });
  } catch (err) { next(err); }
};

// POST /api/cattle/bulk-sync  — sync all local cattle to backend (initial seed)
exports.bulkSync = async (req, res, next) => {
  try {
    const { cattle } = req.body;
    if (!Array.isArray(cattle)) return res.status(400).json({ error: 'cattle array required.' });

    const ops = cattle.map(c => ({
      updateOne: {
        filter: { userId: req.user._id, clientId: c.clientId || c.id },
        update: { $setOnInsert: { ...c, userId: req.user._id, clientId: c.clientId || c.id } },
        upsert: true,
      }
    }));

    const result = await Cattle.bulkWrite(ops);
    const all = await Cattle.find({ userId: req.user._id, isActive: true });
    res.json({ synced: result.upsertedCount, cattle: all });
  } catch (err) { next(err); }
};
