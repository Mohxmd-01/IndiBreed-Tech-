const mongoose = require('mongoose');

const milkRecordSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  cowId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Cattle', required: true },
  clientCowId: { type: String },  // COW001 etc for sync
  clientId:    { type: String },  // ML-COW001-2026-05-04 for dedup
  date:     { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },  // YYYY-MM-DD
  morning:  { type: Number, required: true, min: 0, max: 100 },
  evening:  { type: Number, required: true, min: 0, max: 100 },
  total:    { type: Number },
  notes:    { type: String, default: '' },
}, { timestamps: true });

// Auto-compute total before save
milkRecordSchema.pre('save', function (next) {
  this.total = +(this.morning + this.evening).toFixed(1);
  next();
});

milkRecordSchema.index({ userId: 1, date: -1 });
milkRecordSchema.index({ cowId: 1, date: -1 });
milkRecordSchema.index({ userId: 1, cowId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('MilkRecord', milkRecordSchema);
