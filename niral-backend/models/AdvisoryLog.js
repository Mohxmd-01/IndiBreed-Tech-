const mongoose = require('mongoose');

const advisoryLogSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  cowId:    { type: String, required: true },    // client cow ID
  cowName:  { type: String },
  layer:    { type: String, enum: ['rule', 'context', 'ai'], required: true },
  priority: { type: String, enum: ['critical', 'warning', 'info'], default: 'info' },
  title:    { type: String, required: true },
  message:  { type: String, required: true },
  action:   { type: String, default: '' },
  context:  { type: mongoose.Schema.Types.Mixed },  // raw context data used to generate
  // Cache control: AI responses cached for 6h
  cachedUntil: { type: Date },
  dismissed:   { type: Boolean, default: false },
}, { timestamps: true });

advisoryLogSchema.index({ userId: 1, cowId: 1, createdAt: -1 });

module.exports = mongoose.model('AdvisoryLog', advisoryLogSchema);
