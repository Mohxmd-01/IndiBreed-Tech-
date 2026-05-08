/**
 * VetAssignment.js — Links a veterinarian to a farmer.
 * Either side can initiate. Other side must accept.
 * Status flow: pending → accepted | rejected
 */
const mongoose = require('mongoose');

const vetAssignmentSchema = new mongoose.Schema({
  vetId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  farmerId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  initiatedBy: { type: String, enum: ['vet', 'farmer'], required: true },
  status:    { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  message:   { type: String, default: '' },   // optional note on request
  respondedAt: { type: Date },
}, { timestamps: true });

// Unique constraint: one active link per vet-farmer pair
vetAssignmentSchema.index({ vetId: 1, farmerId: 1 }, { unique: true });

module.exports = mongoose.model('VetAssignment', vetAssignmentSchema);
