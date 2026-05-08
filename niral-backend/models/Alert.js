const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  clientId: { type: String },    // ALT001, AUTO-TEMP-DEV004, etc. for sync

  // ── Original fields ────────────────────────────────────────────────────────
  type:     { type: String, enum: ['critical', 'warning', 'info'], required: true },
  cowId:    { type: String },    // clientId of the cow
  cowName:  { type: String },
  title:    { type: String, required: true, trim: true },
  desc:     { type: String, required: true },
  action:   { type: String, default: '' },
  resolved: { type: Boolean, default: false },
  resolvedAt: { type: Date },
  source:   { type: String, enum: ['manual', 'iot', 'rule', 'ai'], default: 'rule' },
  time:     { type: Number, default: () => Date.now() },  // unix ms

  // ── Priority Engine (Phase 1) ──────────────────────────────────────────────
  priority:       { type: String, enum: ['critical', 'high', 'medium', 'low'], default: 'medium' },
  actionRequired: { type: Boolean, default: false },
  impactRs:       { type: Number, default: 0 },    // estimated ₹/day loss

  // ── Multi-role routing (Phase 2+) ─────────────────────────────────────────
  targetRole:     { type: String, enum: ['farmer', 'vet', 'company'], default: 'farmer' },

  // ── Cooldown / deduplication ───────────────────────────────────────────────
  cooldownKey:    { type: String, index: true },   // e.g. "FEVER-SC-1004-farmer"
  cooldownUntil:  { type: Date },                  // no new alert until this time
}, { timestamps: true });

alertSchema.index({ userId: 1, resolved: 1, type: 1 });
alertSchema.index({ userId: 1, createdAt: -1 });
alertSchema.index({ cooldownKey: 1, cooldownUntil: 1 });

module.exports = mongoose.model('Alert', alertSchema);
