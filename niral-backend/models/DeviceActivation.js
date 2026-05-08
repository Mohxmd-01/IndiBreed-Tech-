/**
 * DeviceActivation.js
 * Pre-seeded pool of activation codes for NiralFarm Smart Collars.
 * Codes are validated on POST /api/devices/activate.
 * activationCode is stored as bcrypt hash for security.
 */

const mongoose = require('mongoose');

const deviceActivationSchema = new mongoose.Schema({
  collarId:       { type: String, required: true, unique: true, trim: true, uppercase: true },
  activationCode: { type: String, required: true },   // bcrypt hash of the plain code
  isUsed:         { type: Boolean, default: false },
  usedBy:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  usedAt:         { type: Date },

  // Product type — determines device lifetime expectations
  productType:    { type: String, enum: ['buy', 'rent'], default: 'buy' },
  rentExpiresAt:  { type: Date },  // only relevant for 'rent'
}, { timestamps: true });

deviceActivationSchema.index({ isUsed: 1 });

module.exports = mongoose.model('DeviceActivation', deviceActivationSchema);
