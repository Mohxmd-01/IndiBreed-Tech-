const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  clientId:    { type: String },          // DEV001 etc
  collarId:    { type: String, required: true, trim: true },
  linkedCowId: { type: String },          // client cow ID (COW001)
  linkedCowRef:{ type: mongoose.Schema.Types.ObjectId, ref: 'Cattle' },
  battery:     { type: Number, default: 100, min: 0, max: 100 },
  signal:      { type: Number, default: 90, min: 0, max: 100 },
  lastSync:    { type: Number, default: () => Date.now() },
  status:      { type: String, enum: ['online', 'offline'], default: 'online' },
  firmware:    { type: String, default: 'v2.3.2' },

  // Live sensor readings
  temp:        { type: Number, default: 38.5 },    // °C
  activity:    { type: Number, default: 60 },      // %

  // Telemetry history (last 24 readings)
  telemetry:   [{
    temp:      Number,
    activity:  Number,
    battery:   Number,
    timestamp: { type: Number, default: () => Date.now() },
  }],

  // ── Device Lifecycle / Ownership (Phase 1) ────────────────────────────────
  deviceStatus:   { type: String, enum: ['active', 'inactive', 'damaged', 'lost'], default: 'active' },
  activatedAt:    { type: Date },
  activatedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deviceHistory:  [{
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fromDate:  { type: Date, default: Date.now },
    toDate:    { type: Date },
    reason:    { type: String, enum: ['activation', 'transfer', 'reset'], default: 'activation' },
  }],
}, { timestamps: true });

deviceSchema.index({ userId: 1, collarId: 1 }, { unique: true });

module.exports = mongoose.model('Device', deviceSchema);

