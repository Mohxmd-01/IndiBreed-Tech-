/**
 * Treatment.js — Veterinary treatment records for a cow.
 * Created by vets for cows belonging to linked farmers.
 */
const mongoose = require('mongoose');

const treatmentSchema = new mongoose.Schema({
  vetId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  farmerId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  cowId:       { type: String, required: true },     // clientId of the cow
  cowName:     { type: String, required: true },
  date:        { type: String, required: true },      // YYYY-MM-DD
  diagnosis:   { type: String, required: true, trim: true },
  medicines:   [{ name: String, dose: String, days: Number }],
  notes:       { type: String, trim: true, default: '' },
  followUpDate: { type: String },                   // YYYY-MM-DD
  outcome:     { type: String, enum: ['ongoing', 'recovered', 'worsened', 'referred'], default: 'ongoing' },
  alertId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Alert' }, // linked alert (optional)
}, { timestamps: true });

treatmentSchema.index({ vetId: 1, farmerId: 1, date: -1 });
treatmentSchema.index({ farmerId: 1, cowId: 1, date: -1 });

module.exports = mongoose.model('Treatment', treatmentSchema);
