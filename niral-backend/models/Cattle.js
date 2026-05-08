const mongoose = require('mongoose');

const cattleSchema = new mongoose.Schema({
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  clientId:   { type: String, index: true },  // original COW001 etc from frontend
  name:       { type: String, required: true, trim: true },
  breed:      { type: String, required: true, trim: true },
  age:        { type: Number, required: true, min: 0, max: 30 },
  weight:     { type: Number, required: true, min: 0 },
  lactation:  { type: Number, default: 0, min: 0, max: 10 },
  health:     { type: String, enum: ['healthy', 'warning', 'critical'], default: 'healthy' },
  pregnant:   { type: Boolean, default: false },
  collarId:   { type: String, default: null },
  tagId:      { type: String, default: '' },
  milkAvg:   { type: Number, default: 0, min: 0 },
  notes:      { type: String, default: '' },
  isActive:   { type: Boolean, default: true },
}, { timestamps: true });

cattleSchema.index({ userId: 1, name: 1 });
cattleSchema.index({ userId: 1, health: 1 });

module.exports = mongoose.model('Cattle', cattleSchema);
