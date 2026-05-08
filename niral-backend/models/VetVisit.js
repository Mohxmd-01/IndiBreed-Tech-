/**
 * VetVisit.js — Scheduled or completed vet visits to a farm.
 */
const mongoose = require('mongoose');

const vetVisitSchema = new mongoose.Schema({
  vetId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  farmerId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  date:      { type: String, required: true },    // YYYY-MM-DD
  time:      { type: String, default: '' },        // "14:00"
  reason:    { type: String, required: true, trim: true },
  status:    { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'scheduled' },
  notes:     { type: String, trim: true, default: '' },
  completedAt: { type: Date },
}, { timestamps: true });

vetVisitSchema.index({ vetId: 1, date: 1 });
vetVisitSchema.index({ farmerId: 1, date: 1 });

module.exports = mongoose.model('VetVisit', vetVisitSchema);
